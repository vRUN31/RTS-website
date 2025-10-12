-- ============================================
-- FIX PROFILES RLS POLICIES
-- Fix: "new row violates row-level security policy for table 'profiles'"
-- Date: 2025-10-12
-- ============================================

-- Drop existing broken policies
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
DROP POLICY IF EXISTS "profiles self insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin read" ON public.profiles;

-- Recreate clean policies

-- 1. Allow users to insert their own profile during signup
CREATE POLICY "profiles_self_insert" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Allow users to read their own profile
CREATE POLICY "profiles_self_read" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "profiles_self_update" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Allow admins to read all profiles (for admin dashboards)
CREATE POLICY "profiles_admin_read" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- 5. Allow admins to update all profiles
CREATE POLICY "profiles_admin_update" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 6. Allow admins to insert profiles (for admin user creation)
CREATE POLICY "profiles_admin_insert" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

-- Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add helpful comment
COMMENT ON TABLE public.profiles IS 'User profiles with RLS - users can manage their own, admins can manage all';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
