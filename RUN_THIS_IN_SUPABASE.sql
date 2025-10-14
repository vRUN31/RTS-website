-- ==============================================================
-- COPY THIS ENTIRE FILE AND RUN IN SUPABASE SQL EDITOR
-- ==============================================================

-- Step 1: Drop the columns if they exist (to start fresh)
ALTER TABLE bookings DROP COLUMN IF EXISTS estimated_distance;
ALTER TABLE bookings DROP COLUMN IF EXISTS estimated_duration;

-- Step 2: Add columns with correct NUMERIC type
ALTER TABLE bookings ADD COLUMN estimated_distance NUMERIC(10, 2);
ALTER TABLE bookings ADD COLUMN estimated_duration NUMERIC(10, 2);

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_distance ON bookings(estimated_distance);

-- Step 4: Add documentation comments
COMMENT ON COLUMN bookings.estimated_distance IS 'Estimated distance in kilometers calculated from map routing';
COMMENT ON COLUMN bookings.estimated_duration IS 'Estimated duration in seconds calculated from map routing (can be fractional)';

-- Verify the columns were created correctly
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('estimated_distance', 'estimated_duration');
