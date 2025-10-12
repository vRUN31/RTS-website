-- ============================================
-- CHECK AND FIX USER PROFILES
-- Debug script to check profiles and fix missing ones
-- Date: 2025-10-12
-- ============================================

-- 1. Check all users and their profiles
SELECT 
    au.id as user_id,
    au.email as auth_email,
    au.created_at as user_created_at,
    p.id as profile_id,
    p.email as profile_email,
    p.name as profile_name,
    p.role as profile_role,
    p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;

-- 2. Find users without profiles (orphaned auth users)
SELECT 
    au.id,
    au.email,
    au.created_at,
    'Missing profile!' as issue
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 3. Create missing profiles for existing auth users
-- This will create a profile for sujalatkari.22@gmail.com if it's missing
INSERT INTO public.profiles (id, role, name, email, created_at)
SELECT 
    au.id,
    'client' as role,
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name);

-- 4. Verify all users now have profiles
SELECT 
    COUNT(*) FILTER (WHERE p.id IS NOT NULL) as users_with_profiles,
    COUNT(*) FILTER (WHERE p.id IS NULL) as users_without_profiles,
    COUNT(*) as total_users
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id;

-- ============================================
-- ADDITIONAL FIXES
-- ============================================

-- 5. Ensure email is populated in all profiles
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
AND (p.email IS NULL OR p.email = '');

-- 6. Ensure name is populated (use email local-part if missing)
UPDATE public.profiles p
SET name = split_part(p.email, '@', 1)
WHERE (name IS NULL OR name = '')
AND email IS NOT NULL;

-- ============================================
-- VERIFICATION
-- ============================================

-- Final check: Show all profiles with their details
SELECT 
    p.id,
    p.role,
    p.name,
    p.email,
    p.client_id,
    au.email as auth_email,
    p.created_at
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC;

COMMENT ON TABLE public.profiles IS 'User profiles - auto-populated from auth.users on signup';
