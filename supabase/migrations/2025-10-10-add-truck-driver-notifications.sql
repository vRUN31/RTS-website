-- Migration: add columns for bookings estimated_cost, shipments operational_cost, drivers email/phone if missing, and trucks.display_code
BEGIN;

ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS estimated_cost numeric;
ALTER TABLE IF EXISTS public.shipments ADD COLUMN IF NOT EXISTS operational_cost numeric;
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE IF EXISTS public.trucks ADD COLUMN IF NOT EXISTS display_code text;

COMMIT;
