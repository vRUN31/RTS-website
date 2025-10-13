-- Fix RLS policies for contracts table - Add INSERT, UPDATE, DELETE permissions for admins
-- Run this in Supabase SQL Editor

-- Add INSERT policy for admins
DROP POLICY IF EXISTS "contracts admin insert" ON public.contracts;
CREATE POLICY "contracts admin insert" ON public.contracts 
  FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

-- Add UPDATE policy for admins
DROP POLICY IF EXISTS "contracts admin update" ON public.contracts;
CREATE POLICY "contracts admin update" ON public.contracts 
  FOR UPDATE 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Add DELETE policy for admins
DROP POLICY IF EXISTS "contracts admin delete" ON public.contracts;
CREATE POLICY "contracts admin delete" ON public.contracts 
  FOR DELETE 
  USING (public.is_admin(auth.uid()));

-- Verify all policies exist
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added INSERT, UPDATE, DELETE policies for contracts table';
  RAISE NOTICE 'Admins can now create, modify, and delete contracts';
END $$;
