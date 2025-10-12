-- ============================================
-- VERIFY PROFILES RLS POLICIES
-- Check if policies exist and are correctly configured
-- Date: 2025-10-12
-- ============================================

-- Step 1: Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Step 2: List all existing policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as operation_name,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
ORDER BY policyname;

-- Step 3: Count policies (should be at least 6)
SELECT 
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE cmd = 'r') as select_policies,
    COUNT(*) FILTER (WHERE cmd = 'a') as insert_policies,
    COUNT(*) FILTER (WHERE cmd = 'w') as update_policies,
    COUNT(*) FILTER (WHERE cmd = 'd') as delete_policies,
    COUNT(*) FILTER (WHERE cmd = '*') as all_policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- Step 4: Check for required policies by name
SELECT 
    policy_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'profiles' 
            AND policyname = policy_name
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (VALUES
    ('profiles_self_insert'),
    ('profiles_self_read'),
    ('profiles_self_update'),
    ('profiles_admin_read'),
    ('profiles_admin_update'),
    ('profiles_admin_insert')
) AS required_policies(policy_name);

-- Step 5: Test if current user can read their own profile
DO $$
DECLARE
    current_user_id UUID;
    profile_count INTEGER;
BEGIN
    -- Get current authenticated user (if any)
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE '⚠️  No authenticated user - cannot test policies';
        RAISE NOTICE '   This is normal when running from SQL Editor';
    ELSE
        RAISE NOTICE '✅ Current user ID: %', current_user_id;
        
        -- Try to read own profile
        SELECT COUNT(*) INTO profile_count
        FROM public.profiles
        WHERE id = current_user_id;
        
        IF profile_count > 0 THEN
            RAISE NOTICE '✅ Can read own profile (RLS working)';
        ELSE
            RAISE NOTICE '⚠️  Profile not found (but RLS allows query)';
        END IF;
    END IF;
END $$;

-- Step 6: Summary and recommendations
DO $$
DECLARE
    policy_count INTEGER;
    rls_enabled BOOLEAN;
BEGIN
    -- Check RLS
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'profiles';
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles';
    
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'PROFILES TABLE RLS STATUS';
    RAISE NOTICE '==============================================';
    
    IF rls_enabled THEN
        RAISE NOTICE '✅ RLS is ENABLED on profiles table';
    ELSE
        RAISE NOTICE '❌ RLS is DISABLED on profiles table';
        RAISE NOTICE '   Run: ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total policies found: %', policy_count;
    
    IF policy_count >= 6 THEN
        RAISE NOTICE '✅ Sufficient policies exist (% policies)', policy_count;
    ELSIF policy_count > 0 THEN
        RAISE NOTICE '⚠️  Only % policies found (expected at least 6)', policy_count;
    ELSE
        RAISE NOTICE '❌ NO policies found - RLS will block all access!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run 2025-10-12-fix-sujal-account.sql';
    RAISE NOTICE '';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================
