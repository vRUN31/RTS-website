-- Migration: Ensure bookings.client_id is properly populated
-- Created: 2025-10-15
-- Purpose: 
--   1. Backfill client_id for existing bookings where it's NULL
--   2. Add a trigger to auto-populate client_id on new bookings

BEGIN;

-- Step 1: Backfill client_id for existing bookings that have NULL client_id
-- Try to get client_id from the profiles table based on user_id
UPDATE public.bookings b
SET client_id = p.client_id
FROM public.profiles p
WHERE b.user_id = p.id
  AND b.client_id IS NULL
  AND p.client_id IS NOT NULL;

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.bookings
  WHERE client_id IS NOT NULL;
  
  RAISE NOTICE 'Backfilled client_id for bookings. Total bookings with client_id: %', updated_count;
END $$;

-- Step 2: Create a function to auto-populate client_id
CREATE OR REPLACE FUNCTION public.auto_populate_booking_client_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If client_id is not provided, try to get it from the user's profile
  IF NEW.client_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT client_id INTO NEW.client_id
    FROM public.profiles
    WHERE id = NEW.user_id
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger to run before insert on bookings
DROP TRIGGER IF EXISTS trigger_auto_populate_booking_client_id ON public.bookings;

CREATE TRIGGER trigger_auto_populate_booking_client_id
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_booking_client_id();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete: bookings.client_id auto-population enabled';
  RAISE NOTICE 'New bookings will automatically inherit client_id from user profile';
END $$;

COMMIT;
