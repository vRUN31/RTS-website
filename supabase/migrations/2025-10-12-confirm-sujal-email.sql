-- ============================================
-- CONFIRM SUJAL'S EMAIL
-- Fix: "Email not confirmed" error during login
-- ============================================

-- Step 1: Check current email confirmation status
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Email Confirmed'
        WHEN confirmed_at IS NOT NULL THEN '✅ Confirmed (old field)'
        ELSE '❌ Email NOT Confirmed'
    END as confirmation_status,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'sujalatkari.22@gmail.com';

-- Step 2: Confirm the email (mark as verified)
UPDATE auth.users
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now())
WHERE email = 'sujalatkari.22@gmail.com'
AND (email_confirmed_at IS NULL OR confirmed_at IS NULL);

-- Step 3: Verify the update
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL AND confirmed_at IS NOT NULL THEN '✅ FIXED - Email Confirmed'
        ELSE '⚠️ Still needs attention'
    END as status
FROM auth.users
WHERE email = 'sujalatkari.22@gmail.com';

-- Step 4: Also fix admin email if needed
UPDATE auth.users
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now())
WHERE email = 'chopadeshyam8@gmail.com'
AND (email_confirmed_at IS NULL OR confirmed_at IS NULL);

-- Step 5: Show all users with confirmation status
SELECT 
    email,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
        ELSE '❌ Not Confirmed'
    END as email_status,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ EMAIL CONFIRMATION FIX COMPLETE';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Sujal''s email is now marked as confirmed!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Go to http://localhost:3000/login';
    RAISE NOTICE '2. Select CLIENT role';
    RAISE NOTICE '3. Email: sujalatkari.22@gmail.com';
    RAISE NOTICE '4. Enter password';
    RAISE NOTICE '5. Should login successfully now!';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: If you want to disable email confirmation for dev:';
    RAISE NOTICE 'Go to Supabase Dashboard > Authentication > Settings';
    RAISE NOTICE 'Disable "Enable email confirmations"';
    RAISE NOTICE '';
END $$;
