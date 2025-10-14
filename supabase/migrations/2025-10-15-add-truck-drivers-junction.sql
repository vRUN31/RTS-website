-- Migration: Add support for multiple drivers per truck
-- Created: 2025-10-15
-- Description: Creates a junction table to link trucks with multiple drivers

-- Step 1: Create truck_drivers junction table
CREATE TABLE IF NOT EXISTS public.truck_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(truck_id, driver_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_truck_drivers_truck_id ON public.truck_drivers(truck_id);
CREATE INDEX IF NOT EXISTS idx_truck_drivers_driver_id ON public.truck_drivers(driver_id);
CREATE INDEX IF NOT EXISTS idx_truck_drivers_primary ON public.truck_drivers(truck_id, is_primary) WHERE is_primary = true;

-- Step 3: Migrate existing truck->driver relationships
INSERT INTO public.truck_drivers (truck_id, driver_id, is_primary)
SELECT id, driver_id, true
FROM public.trucks
WHERE driver_id IS NOT NULL
ON CONFLICT (truck_id, driver_id) DO NOTHING;

-- Step 4: Add comments
COMMENT ON TABLE public.truck_drivers IS 'Junction table linking trucks to multiple drivers';
COMMENT ON COLUMN public.truck_drivers.is_primary IS 'Indicates the primary driver for this truck';
COMMENT ON COLUMN public.truck_drivers.assigned_at IS 'When this driver was assigned to the truck';

-- Step 5: Enable Row Level Security
ALTER TABLE public.truck_drivers ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for admins
CREATE POLICY "admins_read_truck_drivers" ON public.truck_drivers
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admins_insert_truck_drivers" ON public.truck_drivers
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admins_update_truck_drivers" ON public.truck_drivers
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "admins_delete_truck_drivers" ON public.truck_drivers
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Step 7: Create RLS policies for clients (read-only for their shipments)
CREATE POLICY "clients_read_truck_drivers" ON public.truck_drivers
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        JOIN public.shipments ON shipments.client_id = profiles.client_id
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'client'
        AND shipments.truck_id = truck_drivers.truck_id
    )
);

-- Step 8: Create function to ensure only one primary driver per truck
CREATE OR REPLACE FUNCTION ensure_single_primary_driver()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        -- Set all other drivers for this truck to non-primary
        UPDATE public.truck_drivers
        SET is_primary = false
        WHERE truck_id = NEW.truck_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_driver
BEFORE INSERT OR UPDATE ON public.truck_drivers
FOR EACH ROW
EXECUTE FUNCTION ensure_single_primary_driver();

-- Step 9: Create helper view for easy querying
CREATE OR REPLACE VIEW public.trucks_with_drivers AS
SELECT 
    t.id AS truck_id,
    t.display_code,
    t.plate,
    t.status,
    t.vehicle_type,
    t.location,
    t.driver_id AS legacy_driver_id,
    json_agg(
        json_build_object(
            'driver_id', d.id,
            'name', d.name,
            'phone', d.phone,
            'license_no', d.license_no,
            'is_primary', td.is_primary,
            'assigned_at', td.assigned_at
        ) ORDER BY td.is_primary DESC, td.assigned_at DESC
    ) FILTER (WHERE d.id IS NOT NULL) AS drivers
FROM public.trucks t
LEFT JOIN public.truck_drivers td ON td.truck_id = t.id
LEFT JOIN public.drivers d ON d.id = td.driver_id
GROUP BY t.id, t.display_code, t.plate, t.status, t.vehicle_type, t.location, t.driver_id;

COMMENT ON VIEW public.trucks_with_drivers IS 'View combining trucks with their assigned drivers (multiple drivers supported)';

-- Step 10: Grant permissions on view
GRANT SELECT ON public.trucks_with_drivers TO authenticated;
