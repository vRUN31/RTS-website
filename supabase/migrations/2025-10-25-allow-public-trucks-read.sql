-- Migration: Allow public (guest users) to read trucks table
-- This enables the guest user trucks showcase feature

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "trucks public read" ON public.trucks;

-- Create policy to allow anyone (including unauthenticated users) to read trucks
CREATE POLICY "trucks public read" ON public.trucks
  FOR SELECT
  USING (true);
