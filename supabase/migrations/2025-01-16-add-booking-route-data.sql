-- Add distance and duration columns to bookings table
-- This allows bookings to store route information calculated from the map

-- Add estimated_distance column (in kilometers)
ALTER TABLE IF EXISTS bookings
  ADD COLUMN IF NOT EXISTS estimated_distance NUMERIC(10, 2);

-- Add estimated_duration column (in seconds) - Changed to NUMERIC to handle decimal values
ALTER TABLE IF EXISTS bookings
  ADD COLUMN IF NOT EXISTS estimated_duration NUMERIC(10, 2);

-- Add index for querying by distance
CREATE INDEX IF NOT EXISTS idx_bookings_distance ON bookings(estimated_distance);

-- Add comments for documentation
COMMENT ON COLUMN bookings.estimated_distance IS 'Estimated distance in kilometers calculated from map routing';
COMMENT ON COLUMN bookings.estimated_duration IS 'Estimated duration in seconds calculated from map routing (can be fractional)';
