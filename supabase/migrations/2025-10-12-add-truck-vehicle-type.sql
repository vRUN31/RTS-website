-- =====================================================
-- ADD VEHICLE TYPE TO TRUCKS TABLE
-- =====================================================
-- Created: October 12, 2025
-- Purpose: Add vehicle_type column to trucks table to match booking vehicle types
-- =====================================================

-- Add vehicle_type column to trucks table
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS vehicle_type TEXT;

-- Add check constraint for vehicle types (matches booking form options)
ALTER TABLE trucks 
DROP CONSTRAINT IF EXISTS trucks_vehicle_type_check;

ALTER TABLE trucks 
ADD CONSTRAINT trucks_vehicle_type_check 
CHECK (vehicle_type IS NULL OR vehicle_type IN (
    'Pickup (1.5T)',
    'LCV (3.5T)',
    'Truck (9T)',
    'Truck (16T)',
    'Trailer (25T)'
));

-- Add index for faster filtering by vehicle type
CREATE INDEX IF NOT EXISTS idx_trucks_vehicle_type ON trucks(vehicle_type) WHERE vehicle_type IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN trucks.vehicle_type IS 'Type of vehicle/truck matching booking options: Pickup (1.5T), LCV (3.5T), Truck (9T), Truck (16T), Trailer (25T)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Added vehicle_type column to trucks table
-- Constraint ensures only valid vehicle types
-- Index added for performance
-- =====================================================
