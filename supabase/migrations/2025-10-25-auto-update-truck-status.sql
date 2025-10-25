-- Migration: Automatic Truck Status Management
-- Description: Auto-updates truck status when shipments are created/updated/completed

-- Date: 2025-10-25

-- ============================================================================
-- Function: Automatically update truck status based on shipment status changes
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_update_truck_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When shipment status changes to 'in_transit', set truck to 'Running'
    IF (TG_OP = 'UPDATE' AND NEW.status = 'in_transit' AND OLD.status != 'in_transit') THEN
        UPDATE trucks 
        SET status = 'Running',
            status_updated_at = NOW(),
            status_reason = 'Trip started for shipment ' || NEW.id
        WHERE id = NEW.truck_id;
        
        RAISE NOTICE 'Truck % status updated to Running (shipment % started)', NEW.truck_id, NEW.id;
    END IF;
    
    -- When shipment status changes to 'delivered', set truck to 'Available'
    IF (TG_OP = 'UPDATE' AND NEW.status = 'delivered' AND OLD.status != 'delivered') THEN
        UPDATE trucks 
        SET status = 'Available',
            status_updated_at = NOW(),
            status_reason = 'Trip completed for shipment ' || NEW.id
        WHERE id = NEW.truck_id;
        
        RAISE NOTICE 'Truck % status updated to Available (shipment % delivered)', NEW.truck_id, NEW.id;
    END IF;
    
    -- When shipment status changes to 'cancelled', set truck to 'Available'
    IF (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled') THEN
        UPDATE trucks 
        SET status = 'Available',
            status_updated_at = NOW(),
            status_reason = 'Trip cancelled for shipment ' || NEW.id
        WHERE id = NEW.truck_id;
        
        RAISE NOTICE 'Truck % status updated to Available (shipment % cancelled)', NEW.truck_id, NEW.id;
    END IF;
    
    -- When a new shipment is created with 'in_transit' status, set truck to 'Running'
    IF (TG_OP = 'INSERT' AND NEW.status = 'in_transit') THEN
        UPDATE trucks 
        SET status = 'Running',
            status_updated_at = NOW(),
            status_reason = 'Trip started for shipment ' || NEW.id
        WHERE id = NEW.truck_id;
        
        RAISE NOTICE 'Truck % status updated to Running (new shipment % created)', NEW.truck_id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Create trigger on shipments table
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_auto_update_truck_status ON shipments;

CREATE TRIGGER trigger_auto_update_truck_status
    AFTER INSERT OR UPDATE OF status
    ON shipments
    FOR EACH ROW
    WHEN (NEW.truck_id IS NOT NULL)
    EXECUTE FUNCTION auto_update_truck_status();

-- ============================================================================
-- One-time fix: Update truck status for all currently delivered shipments
-- ============================================================================

-- Set trucks to 'Available' if their most recent shipment is 'delivered' or 'cancelled'
UPDATE trucks t
SET status = 'Available',
    status_updated_at = NOW(),
    status_reason = 'Shipment completed - truck available for new trips'
WHERE id IN (
    SELECT DISTINCT s.truck_id
    FROM shipments s
    WHERE s.status IN ('delivered', 'cancelled')
      AND s.truck_id IS NOT NULL
      AND NOT EXISTS (
          -- Check if there's any active shipment for this truck
          SELECT 1 
          FROM shipments s2 
          WHERE s2.truck_id = s.truck_id 
            AND s2.status IN ('pending', 'in_transit')
            AND s2.created_at > s.created_at
      )
)
AND status != 'Available' -- Only update if not already available
AND status NOT IN ('Maintenance', 'Offline'); -- Don't override manual statuses

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION auto_update_truck_status() IS 
'Automatically updates truck status when shipments are created or updated. 
Sets truck to Running when trip starts (in_transit), and Available when trip completes (delivered/cancelled).';

COMMENT ON TRIGGER trigger_auto_update_truck_status ON shipments IS 
'Triggers automatic truck status updates based on shipment status changes';
