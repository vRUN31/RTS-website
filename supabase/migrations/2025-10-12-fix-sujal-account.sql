-- ============================================
-- QUICK FIX FOR SUJAL'S ACCOUNT
-- Run this AFTER running 2025-10-12-fix-profiles-rls.sql
-- ============================================

-- Step 1: Check if Sujal's user exists in auth
DO $$
DECLARE
    sujal_user_id UUID;
BEGIN
    SELECT id INTO sujal_user_id
    FROM auth.users
    WHERE email = 'sujalatkari.22@gmail.com';
    
    IF sujal_user_id IS NULL THEN
        RAISE NOTICE '❌ User sujalatkari.22@gmail.com NOT FOUND in auth.users';
        RAISE NOTICE 'Please create the account via signup page first!';
    ELSE
        RAISE NOTICE '✅ Found user: %', sujal_user_id;
        
        -- Step 2: Create or update profile
        INSERT INTO public.profiles (id, role, name, email, created_at)
        VALUES (
            sujal_user_id,
            'client',
            'Sujal Atkari',
            'sujalatkari.22@gmail.com',
            now()
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            role = EXCLUDED.role;
        
        RAISE NOTICE '✅ Profile created/updated for Sujal';
    END IF;
END $$;

-- Step 3: Verify the profile
SELECT 
    p.id,
    p.role,
    p.name,
    p.email,
    au.email as auth_email,
    'Profile exists!' as status
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE au.email = 'sujalatkari.22@gmail.com';

-- Step 4: Show all users and profiles for comparison
SELECT 
    au.email as auth_email,
    p.name as profile_name,
    p.role as profile_role,
    CASE 
        WHEN p.id IS NOT NULL THEN '✅ Has Profile'
        ELSE '❌ Missing Profile'
    END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ SUJAL FIX COMPLETE';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Clear browser cache (Ctrl+Shift+Delete)';
    RAISE NOTICE '2. Go to http://localhost:3000/login';
    RAISE NOTICE '3. Select CLIENT role';
    RAISE NOTICE '4. Email: sujalatkari.22@gmail.com';
    RAISE NOTICE '5. Enter password';
    RAISE NOTICE '6. Should redirect to /dashboard/customer';
    RAISE NOTICE '';
END $$;
