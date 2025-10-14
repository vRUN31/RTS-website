-- Fix: Change estimated_duration from INTEGER to NUMERIC to handle decimal seconds
-- Run this if you already ran the previous migration

-- Drop the column if it exists with wrong type
ALTER TABLE bookings DROP COLUMN IF EXISTS estimated_duration;

-- Re-add with correct type
ALTER TABLE bookings ADD COLUMN estimated_duration NUMERIC(10, 2);

-- Update comment
COMMENT ON COLUMN bookings.estimated_duration IS 'Estimated duration in seconds calculated from map routing (can be fractional)';
