# 🔧 Fix Signup Error - RLS Policy Issue

## Problem
When users try to sign up, they get this error:
```
new row violates row-level security policy for table "profiles"
```

## Root Cause
The `profiles` table has Row Level Security (RLS) enabled, but the policy that allows users to insert their own profile during signup was broken or missing.

## Solution
Run the migration file: `supabase/migrations/2025-10-12-fix-profiles-rls.sql`

---

## 📋 Step-by-Step Fix

### Option 1: Run in Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com/project/ffspdzobfhthfcaufsxp
   - Log in to your account

2. **Navigate to SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Copy the Migration SQL**
   - Open the file: `supabase/migrations/2025-10-12-fix-profiles-rls.sql`
   - Copy all the contents (Ctrl+A, Ctrl+C)

4. **Paste and Run**
   - Paste the SQL into the Supabase SQL Editor
   - Click **Run** button (or press Ctrl+Enter)
   - Wait for "Success. No rows returned" message

5. **Verify the Fix**
   - The migration will:
     ✅ Drop old broken policies
     ✅ Create clean RLS policies
     ✅ Allow users to insert their own profile
     ✅ Allow users to read/update their own data
     ✅ Allow admins to manage all profiles

### Option 2: Using Supabase CLI (Advanced)

```bash
# Make sure you're logged in
npx supabase login

# Link your project (if not already linked)
npx supabase link --project-ref ffspdzobfhthfcaufsxp

# Run the migration
npx supabase db push
```

---

## 🧪 Test the Fix

1. **Go to your signup page**
   - Navigate to: http://localhost:3000/register

2. **Try to create a new account**
   - Fill in the signup form
   - Use a test email (e.g., `test@example.com`)
   - Choose a password

3. **Expected Result**
   - ✅ Account should be created successfully
   - ✅ No RLS policy error
   - ✅ User redirected to appropriate dashboard

---

## 📚 What the Migration Does

### Policies Created

1. **`profiles_self_insert`**
   - Allows users to create their own profile during signup
   - Check: `auth.uid() = id`

2. **`profiles_self_read`**
   - Allows users to read their own profile data
   - Check: `auth.uid() = id`

3. **`profiles_self_update`**
   - Allows users to update their own profile
   - Check: `auth.uid() = id`

4. **`profiles_admin_read`**
   - Allows admins to view all profiles
   - Check: `public.is_admin(auth.uid())`

5. **`profiles_admin_update`**
   - Allows admins to update any profile
   - Check: `public.is_admin(auth.uid())`

6. **`profiles_admin_insert`**
   - Allows admins to create profiles for other users
   - Check: `public.is_admin(auth.uid())`

---

## 🔍 Verify Policies in Database

After running the migration, check the policies:

```sql
-- Run this in Supabase SQL Editor to verify
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

You should see all 6 policies listed above.

---

## 🚨 Troubleshooting

### If Error Persists

1. **Check if migration ran successfully**
   ```sql
   SELECT * FROM public.migrations 
   WHERE name LIKE '%profiles%' 
   ORDER BY executed_at DESC;
   ```

2. **Manually verify RLS is enabled**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'profiles';
   ```
   - `rowsecurity` should be `true`

3. **Check if policies exist**
   ```sql
   SELECT COUNT(*) as policy_count
   FROM pg_policies
   WHERE tablename = 'profiles';
   ```
   - Should return `6` policies

### If You Need to Reset

```sql
-- Drop all policies
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;

-- Then re-run the migration
```

---

## ✅ Success Indicators

After the fix, you should be able to:
- ✅ Sign up new users without errors
- ✅ Users can read their own profile
- ✅ Users can update their own profile
- ✅ Admins can manage all profiles
- ✅ No "row violates RLS policy" errors

---

## 📝 Additional Notes

- **Admin Check**: The `public.is_admin()` function checks if a user has `role = 'admin'` in their profile
- **Security**: RLS ensures users can only access their own data (unless they're admins)
- **Signup Flow**: When a user signs up via Supabase Auth, a profile row is automatically created with `id = auth.uid()`

---

## 🔗 Related Files

- Migration: `supabase/migrations/2025-10-12-fix-profiles-rls.sql`
- Schema: `supabase/schema.sql`
- Register Page: `src/app/register/page.tsx`

---

**Need Help?** Check the Supabase logs in the dashboard under **Logs > Postgres Logs** for more details about RLS errors.
