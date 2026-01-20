-- Migration: Booking System Automation
-- This migration adds database functions and triggers for automated booking processing

-- ============================================================================
-- SECTION 1: Automated Status Transitions
-- ============================================================================

-- Function to auto-update booking status based on shipment status changes
CREATE OR REPLACE FUNCTION public.sync_booking_status_from_shipment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking_id uuid;
BEGIN
    -- Find the booking associated with this shipment (by matching client, origin, destination)
    SELECT b.id INTO v_booking_id
    FROM bookings b
    WHERE b.client_id = NEW.client_id
      AND b.source_city = NEW.origin
      AND b.destination_city = NEW.destination
      AND b.status IN ('submitted', 'approved', 'in_transit')
    ORDER BY b.created_at DESC
    LIMIT 1;

    IF v_booking_id IS NOT NULL THEN
        -- Sync status from shipment to booking
        IF NEW.status = 'in_transit' THEN
            UPDATE bookings SET status = 'in_transit' WHERE id = v_booking_id;
        ELSIF NEW.status = 'delivered' THEN
            UPDATE bookings SET status = 'delivered' WHERE id = v_booking_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger to sync booking status when shipment status changes
DROP TRIGGER IF EXISTS trg_sync_booking_status ON shipments;
CREATE TRIGGER trg_sync_booking_status
    AFTER UPDATE OF status ON shipments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION sync_booking_status_from_shipment();

-- ============================================================================
-- SECTION 2: Automated Notifications on Status Change
-- ============================================================================

-- Function to create notification when booking status changes
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_title text;
    v_message text;
BEGIN
    -- Determine notification message based on new status
    CASE NEW.status
        WHEN 'approved' THEN
            v_title := 'Booking Approved';
            v_message := format('Your booking from %s to %s has been approved.', NEW.source_city, NEW.destination_city);
        WHEN 'rejected' THEN
            v_title := 'Booking Rejected';
            v_message := format('Your booking from %s to %s has been rejected. Please contact support for details.', NEW.source_city, NEW.destination_city);
        WHEN 'in_transit' THEN
            v_title := 'Shipment In Transit';
            v_message := format('Your shipment from %s to %s is now in transit.', NEW.source_city, NEW.destination_city);
        WHEN 'delivered' THEN
            v_title := 'Shipment Delivered';
            v_message := format('Your shipment from %s to %s has been delivered.', NEW.source_city, NEW.destination_city);
        ELSE
            RETURN NEW; -- No notification for other statuses
    END CASE;

    -- Insert notification
    INSERT INTO notifications (user_id, type, channel, payload, status, created_at)
    VALUES (
        NEW.user_id,
        'system',
        'inapp',
        jsonb_build_object(
            'title', v_title,
            'message', v_message,
            'bookingId', NEW.id,
            'status', NEW.status
        ),
        'queued',
        now()
    );

    RETURN NEW;
END;
$$;

-- Trigger to create notifications on booking status change
DROP TRIGGER IF EXISTS trg_booking_status_notification ON bookings;
CREATE TRIGGER trg_booking_status_notification
    AFTER UPDATE OF status ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_booking_status_change();

-- ============================================================================
-- SECTION 3: Automated Truck Status Management
-- ============================================================================

-- Function to update truck status based on shipment assignments
CREATE OR REPLACE FUNCTION public.manage_truck_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- When shipment is created, mark truck as assigned
        IF NEW.truck_id IS NOT NULL AND NEW.status IN ('pending', 'in_transit') THEN
            UPDATE trucks SET status = 'assigned' WHERE id = NEW.truck_id::text;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- When shipment status changes
        IF NEW.status = 'in_transit' AND NEW.truck_id IS NOT NULL THEN
            UPDATE trucks SET status = 'running' WHERE id = NEW.truck_id::text;
        ELSIF NEW.status IN ('delivered', 'cancelled') AND NEW.truck_id IS NOT NULL THEN
            -- Check if truck has other active shipments
            IF NOT EXISTS (
                SELECT 1 FROM shipments 
                WHERE truck_id = NEW.truck_id 
                  AND id != NEW.id 
                  AND status IN ('pending', 'in_transit')
            ) THEN
                UPDATE trucks SET status = 'available' WHERE id = NEW.truck_id::text;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger to manage truck status
DROP TRIGGER IF EXISTS trg_manage_truck_status ON shipments;
CREATE TRIGGER trg_manage_truck_status
    AFTER INSERT OR UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION manage_truck_status();

-- ============================================================================
-- SECTION 4: Auto-Rejection of Stale Bookings
-- ============================================================================

-- Function to auto-reject bookings that haven't been processed within X days
CREATE OR REPLACE FUNCTION public.auto_reject_stale_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    -- Reject bookings older than 7 days that are still in 'submitted' status
    WITH updated AS (
        UPDATE bookings
        SET status = 'rejected',
            notes = COALESCE(notes, '') || ' [Auto-rejected due to no response within 7 days]'
        WHERE status = 'submitted'
          AND created_at < now() - interval '7 days'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM updated;
    
    RETURN v_count;
END;
$$;

-- To run this automatically, set up a Supabase cron job (via pg_cron extension or Edge Function)
-- Example: SELECT cron.schedule('auto-reject-stale-bookings', '0 0 * * *', 'SELECT public.auto_reject_stale_bookings()');

-- ============================================================================
-- SECTION 5: Geofencing for Status Transitions (pickup/delivery zones)
-- ============================================================================

-- Function to check if truck is within geofence of a location
CREATE OR REPLACE FUNCTION public.check_geofence(
    p_truck_lat double precision,
    p_truck_lng double precision,
    p_target_lat double precision,
    p_target_lng double precision,
    p_radius_km double precision DEFAULT 1.0
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_distance double precision;
BEGIN
    -- Haversine formula to calculate distance in km
    v_distance := 6371 * acos(
        cos(radians(p_truck_lat)) * cos(radians(p_target_lat)) *
        cos(radians(p_target_lng) - radians(p_truck_lng)) +
        sin(radians(p_truck_lat)) * sin(radians(p_target_lat))
    );
    
    RETURN v_distance <= p_radius_km;
END;
$$;

-- Function to auto-update shipment status based on GPS location
CREATE OR REPLACE FUNCTION public.process_telemetry_geofence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_shipment record;
BEGIN
    -- Find active shipments for this truck
    FOR v_shipment IN
        SELECT s.*, b.source_city, b.destination_city
        FROM shipments s
        LEFT JOIN bookings b ON b.client_id = s.client_id 
            AND b.source_city = s.origin 
            AND b.destination_city = s.destination
        WHERE s.truck_id = NEW.truck_id::uuid
          AND s.status IN ('pending', 'in_transit')
    LOOP
        -- This is a placeholder - in production, you'd geocode the origin/destination
        -- and check if the truck is within the geofence
        -- For now, we just log the telemetry
        NULL;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Trigger for geofence checking on telemetry updates
DROP TRIGGER IF EXISTS trg_process_geofence ON telemetry;
CREATE TRIGGER trg_process_geofence
    AFTER INSERT ON telemetry
    FOR EACH ROW
    EXECUTE FUNCTION process_telemetry_geofence();

-- ============================================================================
-- SECTION 6: Booking Validation Constraints
-- ============================================================================

-- Function to validate booking before insert/update
CREATE OR REPLACE FUNCTION public.validate_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Ensure pickup date is not in the past (for new bookings)
    IF TG_OP = 'INSERT' AND NEW.pickup_date IS NOT NULL THEN
        IF NEW.pickup_date < CURRENT_DATE THEN
            RAISE EXCEPTION 'Pickup date cannot be in the past';
        END IF;
    END IF;
    
    -- Ensure weight is positive
    IF NEW.weight_mt IS NOT NULL AND NEW.weight_mt <= 0 THEN
        RAISE EXCEPTION 'Weight must be a positive number';
    END IF;
    
    -- Ensure source and destination are different
    IF LOWER(TRIM(NEW.source_city)) = LOWER(TRIM(NEW.destination_city)) THEN
        RAISE EXCEPTION 'Source and destination must be different';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for booking validation
DROP TRIGGER IF EXISTS trg_validate_booking ON bookings;
CREATE TRIGGER trg_validate_booking
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION validate_booking();

-- ============================================================================
-- SECTION 7: Double-Booking Prevention
-- ============================================================================

-- Function to check for truck double-booking
CREATE OR REPLACE FUNCTION public.check_truck_double_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_conflict_count integer;
BEGIN
    IF NEW.truck_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check for overlapping shipments with the same truck
    SELECT COUNT(*) INTO v_conflict_count
    FROM shipments
    WHERE truck_id = NEW.truck_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status IN ('pending', 'in_transit')
      AND (
          -- Check if the new shipment overlaps with existing ones
          (NEW.eta IS NOT NULL AND eta IS NOT NULL AND 
           NEW.created_at < eta AND NEW.eta > created_at)
          OR
          -- If no eta, just check for any active shipment
          (NEW.eta IS NULL AND status IN ('pending', 'in_transit'))
      );
    
    IF v_conflict_count > 0 THEN
        RAISE WARNING 'Truck % may have conflicting shipments. Please verify availability.', NEW.truck_id;
        -- Note: Using WARNING instead of EXCEPTION to allow manual override
        -- Change to EXCEPTION if you want strict enforcement
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger for double-booking check
DROP TRIGGER IF EXISTS trg_check_double_booking ON shipments;
CREATE TRIGGER trg_check_double_booking
    BEFORE INSERT OR UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION check_truck_double_booking();

-- ============================================================================
-- SECTION 8: Helper Functions for Auto-Assignment
-- ============================================================================

-- Function to get recommended vehicle type based on weight
CREATE OR REPLACE FUNCTION public.recommend_vehicle_type(p_weight_mt numeric)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE
        WHEN p_weight_mt <= 1.5 THEN 'Pickup (1.5T)'
        WHEN p_weight_mt <= 3.5 THEN 'LCV (3.5T)'
        WHEN p_weight_mt <= 9 THEN 'Truck (9T)'
        WHEN p_weight_mt <= 16 THEN 'Truck (16T)'
        ELSE 'Trailer (25T)'
    END;
END;
$$;

-- Function to find best available truck for a booking
CREATE OR REPLACE FUNCTION public.find_best_available_truck(
    p_vehicle_type text,
    p_exclude_truck_ids text[] DEFAULT '{}'::text[]
)
RETURNS TABLE(
    truck_id text,
    plate text,
    vehicle_type text,
    driver_id uuid,
    status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.plate, t.vehicle_type, t.driver_id, t.status
    FROM trucks t
    WHERE t.vehicle_type = p_vehicle_type
      AND t.status IN ('available', 'idle')
      AND t.id != ALL(p_exclude_truck_ids)
      AND t.driver_id IS NOT NULL
    ORDER BY t.last_updated DESC NULLS LAST
    LIMIT 5;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.recommend_vehicle_type(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_best_available_truck(text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_geofence(double precision, double precision, double precision, double precision, double precision) TO authenticated;

-- ============================================================================
-- SECTION 9: Add columns for automation tracking
-- ============================================================================

-- Add automation-related columns to bookings if they don't exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS auto_assigned boolean DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assignment_score integer;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assignment_reason text;

-- Add geofence columns to shipments for location-based automation
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS origin_lat double precision;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS origin_lng double precision;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS dest_lat double precision;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS dest_lng double precision;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS pickup_geofence_entered_at timestamptz;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS delivery_geofence_entered_at timestamptz;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_auto_assigned ON bookings(auto_assigned) WHERE auto_assigned = true;
CREATE INDEX IF NOT EXISTS idx_shipments_status_truck ON shipments(status, truck_id) WHERE status IN ('pending', 'in_transit');
CREATE INDEX IF NOT EXISTS idx_telemetry_truck_recent ON telemetry(truck_id, ts DESC);

COMMENT ON COLUMN bookings.auto_assigned IS 'Whether this booking was automatically assigned';
COMMENT ON COLUMN bookings.assignment_score IS 'Confidence score (0-100) for auto-assignment';
COMMENT ON COLUMN shipments.pickup_geofence_entered_at IS 'When truck entered pickup location geofence';
COMMENT ON COLUMN shipments.delivery_geofence_entered_at IS 'When truck entered delivery location geofence';
