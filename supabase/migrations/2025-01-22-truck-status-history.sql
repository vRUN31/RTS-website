-- Migration: Advanced Truck Status Management System
-- Created: 2025-01-22
-- Description: Adds status history tracking and enhanced status management

BEGIN;

-- Step 1: Create enum for truck status (for better consistency)
DO $$ BEGIN
    CREATE TYPE truck_status_enum AS ENUM ('running', 'halt', 'maintenance', 'offline', 'available');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create truck_status_history table
CREATE TABLE IF NOT EXISTS public.truck_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    previous_status TEXT,
    reason TEXT,
    notes TEXT,
    location TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_truck_status_history_truck_id ON public.truck_status_history(truck_id);
CREATE INDEX IF NOT EXISTS idx_truck_status_history_changed_at ON public.truck_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_truck_status_history_status ON public.truck_status_history(status);

-- Step 4: Add metadata columns to trucks table if they don't exist
ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;
ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES auth.users(id);
ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS status_reason TEXT;
ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS odometer_reading NUMERIC(10, 2);
ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS next_maintenance_due DATE;

-- Step 5: Create function to log status changes
CREATE OR REPLACE FUNCTION log_truck_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.truck_status_history (
            truck_id,
            status,
            previous_status,
            reason,
            location,
            changed_by,
            changed_at
        ) VALUES (
            NEW.id,
            NEW.status,
            OLD.status,
            NEW.status_reason,
            NEW.location,
            NEW.status_updated_by,
            COALESCE(NEW.status_updated_at, NOW())
        );
        
        -- Clear the reason field after logging
        NEW.status_reason := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for automatic status history logging
DROP TRIGGER IF EXISTS truck_status_change_trigger ON public.trucks;
CREATE TRIGGER truck_status_change_trigger
    BEFORE UPDATE ON public.trucks
    FOR EACH ROW
    EXECUTE FUNCTION log_truck_status_change();

-- Step 7: Create view for latest truck status with history count
CREATE OR REPLACE VIEW public.trucks_with_status_info AS
SELECT 
    t.id,
    t.display_code,
    t.plate,
    t.status,
    t.vehicle_type,
    t.location,
    t.driver_id,
    t.status_updated_at,
    t.status_updated_by,
    t.odometer_reading,
    t.last_maintenance_date,
    t.next_maintenance_due,
    t.created_at,
    t.last_updated,
    COUNT(h.id) as status_change_count,
    MAX(h.changed_at) as last_status_change
FROM public.trucks t
LEFT JOIN public.truck_status_history h ON h.truck_id = t.id
GROUP BY t.id, t.display_code, t.plate, t.status, t.vehicle_type, t.location, 
         t.driver_id, t.status_updated_at, t.status_updated_by, t.odometer_reading,
         t.last_maintenance_date, t.next_maintenance_due, t.created_at, t.last_updated;

-- Step 8: Enable Row Level Security
ALTER TABLE public.truck_status_history ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for truck_status_history (admin-only)
CREATE POLICY "admins_read_truck_status_history" ON public.truck_status_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admins_insert_truck_status_history" ON public.truck_status_history
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Step 10: Create helper function to get truck status summary
CREATE OR REPLACE FUNCTION get_truck_status_summary(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    status TEXT,
    truck_count BIGINT,
    avg_duration_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH status_durations AS (
        SELECT 
            h.status,
            h.truck_id,
            EXTRACT(EPOCH FROM (
                LEAD(h.changed_at) OVER (PARTITION BY h.truck_id ORDER BY h.changed_at) - h.changed_at
            )) / 3600 as duration_hours
        FROM public.truck_status_history h
        WHERE h.changed_at >= NOW() - (days_back || ' days')::INTERVAL
    )
    SELECT 
        sd.status,
        COUNT(DISTINCT sd.truck_id) as truck_count,
        ROUND(AVG(sd.duration_hours)::NUMERIC, 2) as avg_duration_hours
    FROM status_durations sd
    WHERE sd.duration_hours IS NOT NULL
    GROUP BY sd.status
    ORDER BY truck_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create function to get truck maintenance alerts
CREATE OR REPLACE FUNCTION get_trucks_needing_maintenance()
RETURNS TABLE (
    truck_id UUID,
    display_code TEXT,
    plate TEXT,
    status TEXT,
    last_maintenance_date DATE,
    next_maintenance_due DATE,
    days_overdue INTEGER,
    odometer_reading NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as truck_id,
        t.display_code,
        t.plate,
        t.status,
        t.last_maintenance_date,
        t.next_maintenance_due,
        (CURRENT_DATE - t.next_maintenance_due)::INTEGER as days_overdue,
        t.odometer_reading
    FROM public.trucks t
    WHERE t.next_maintenance_due IS NOT NULL
    AND t.next_maintenance_due <= CURRENT_DATE
    AND t.status != 'maintenance'
    ORDER BY days_overdue DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Add comments
COMMENT ON TABLE public.truck_status_history IS 'Tracks all status changes for trucks with timestamp and reason';
COMMENT ON COLUMN public.truck_status_history.reason IS 'Reason for status change (e.g., "Scheduled maintenance", "Engine issue")';
COMMENT ON COLUMN public.truck_status_history.notes IS 'Additional notes or details about the status change';
COMMENT ON COLUMN public.truck_status_history.changed_by IS 'User who initiated the status change';

COMMENT ON FUNCTION log_truck_status_change() IS 'Automatically logs truck status changes to history table';
COMMENT ON FUNCTION get_truck_status_summary(INTEGER) IS 'Returns summary statistics of truck status over specified days';
COMMENT ON FUNCTION get_trucks_needing_maintenance() IS 'Returns list of trucks that need maintenance based on due date';

COMMIT;
