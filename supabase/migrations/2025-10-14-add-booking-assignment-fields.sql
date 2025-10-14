-- Migration: Add truck assignment and email notification support to bookings
-- Adds truck_id, driver_id fields to bookings table for assignment tracking
-- Adds driver_id to trucks table for permanent driver assignment

BEGIN;

-- Add truck_id to bookings for assignment (UUID type to match trucks.id)
ALTER TABLE IF EXISTS public.bookings 
  ADD COLUMN IF NOT EXISTS truck_id uuid REFERENCES public.trucks(id) ON DELETE SET NULL;

-- Add driver_id to bookings for direct driver assignment
ALTER TABLE IF EXISTS public.bookings 
  ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;

-- Add driver_id to trucks for permanent driver-truck assignment
ALTER TABLE IF EXISTS public.trucks 
  ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_truck_id ON public.bookings(truck_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON public.bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_trucks_driver_id ON public.trucks(driver_id);

-- Add approved_at timestamp to track when booking was approved
ALTER TABLE IF EXISTS public.bookings 
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Add approved_by to track which admin approved
ALTER TABLE IF EXISTS public.bookings 
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;
