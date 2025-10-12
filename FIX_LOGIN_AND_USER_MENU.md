# 🔧 Fix Login & User Menu Issues

## Problems Identified

### Problem 1: Can't Login as sujalatkari.22@gmail.com
**Root Cause**: The user was created in `auth.users` but the corresponding profile wasn't created in the `profiles` table due to RLS policy issues.

### Problem 2: Top Bar Shows Admin's Email
**Root Cause**: Two possibilities:
1. Browser cache showing old session data
2. The profile fetch is failing, causing the UserMenu to not update

---

## 🚀 Quick Fix (Do These Steps)

### Step 1: Run the RLS Policy Fix (If Not Done Already)

1. Open Supabase Dashboard: https://app.supabase.com/project/ffspdzobfhthfcaufsxp
2. Go to **SQL Editor**
3. Run the migration: `2025-10-12-fix-profiles-rls.sql`
4. Wait for "Success" message

### Step 2: Create Missing Profile for Sujal

Run this SQL in Supabase SQL Editor:

```sql
-- Check if the user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'sujalatkari.22@gmail.com';

-- If the user exists, create their profile
INSERT INTO public.profiles (id, role, name, email, created_at)
SELECT 
    au.id,
    'client' as role,
    'Sujal Atkari' as name,
    au.email,
    au.created_at
FROM auth.users au
WHERE au.email = 'sujalatkari.22@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Verify the profile was created
SELECT p.id, p.role, p.name, p.email 
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE au.email = 'sujalatkari.22@gmail.com';
```

### Step 3: Fix ALL Missing Profiles (Recommended)

Run the comprehensive fix script: `2025-10-12-check-and-fix-profiles.sql`

This will:
- ✅ Find all users without profiles
- ✅ Create profiles for them automatically
- ✅ Populate missing email/name fields
- ✅ Show a summary of all users

### Step 4: Clear Browser Cache & Test Login

1. **Clear Browser Cache**:
   - Chrome: Press `Ctrl+Shift+Delete` → Clear "Cached images and files" + "Cookies and site data"
   - Or use Incognito/Private window

2. **Logout Current Session**:
   - Click user menu in top-right
   - Click "Logout"

3. **Login as Sujal**:
   - Go to: http://localhost:3000/login
   - Select **Client** role
   - Email: `sujalatkari.22@gmail.com`
   - Password: (the password you set during signup)
   - Click "Continue"

4. **Verify Top Bar**:
   - Should show: "S" avatar + "sujalatkari.22@gmail.com"
   - Should NOT show admin's email

---

## 🔍 Detailed Diagnosis

### UserMenu Component Analysis

The `_user-menu.client.tsx` component:
```tsx
// Fetches the current logged-in user
const { data: { user } } = await supabase.auth.getUser();
setEmail(user?.email ?? null);  // ← This should show correct email

// Then fetches the profile
const { data } = await supabase.from('profiles').select('id, role').eq('id', user.id).maybeSingle();
```

**Why it might show wrong email:**
1. **Browser cached the old session** (localStorage/sessionStorage)
2. **Profile fetch fails** due to RLS, causing component to not re-render
3. **Multiple browser tabs** with different logged-in users

### Login Flow Issues

The login page tries to:
1. Sign in with email/password
2. Fetch the user's profile
3. Create profile if missing (but this fails if RLS policies are broken)
4. Redirect to dashboard

**Why login might fail:**
- Profile doesn't exist → Login page tries to create it → RLS blocks the insert → Login fails

---

## 🛠️ SQL Scripts Reference

### Check All Users and Profiles
```sql
SELECT 
    au.id as user_id,
    au.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.name as profile_name,
    p.role as profile_role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;
```

### Find Missing Profiles
```sql
SELECT 
    au.id,
    au.email,
    au.created_at,
    'Missing profile!' as issue
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
```

### Create Profile Manually for Sujal
```sql
-- Replace USER_ID with the actual UUID from auth.users
INSERT INTO public.profiles (id, role, name, email)
VALUES (
    'USER_ID_HERE',
    'client',
    'Sujal Atkari',
    'sujalatkari.22@gmail.com'
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email, name = EXCLUDED.name;
```

### Delete User (If Needed to Start Fresh)
```sql
-- WARNING: This permanently deletes the user
-- Run only if you want to re-create the account

-- First, delete the profile
DELETE FROM public.profiles 
WHERE email = 'sujalatkari.22@gmail.com';

-- Then delete from auth (requires admin access)
-- Do this in Supabase Dashboard → Authentication → Users → Delete User
```

---

## ✅ Verification Checklist

After running the fixes:

### 1. Check Database
```sql
-- Should show both users with profiles
SELECT 
    au.email as auth_email,
    p.email as profile_email,
    p.name,
    p.role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;
```

Expected result:
| auth_email | profile_email | name | role |
|------------|--------------|------|------|
| sujalatkari.22@gmail.com | sujalatkari.22@gmail.com | Sujal Atkari | client |
| chopadeshyam8@gmail.com | chopadeshyam8@gmail.com | Admin Name | admin |

### 2. Test Login Flow
- [ ] Can login as sujalatkari.22@gmail.com (client)
- [ ] Redirects to `/dashboard/customer`
- [ ] Top bar shows "S" avatar + correct email
- [ ] User menu dropdown works
- [ ] Can logout successfully

### 3. Test Multiple Users
- [ ] Logout as Sujal
- [ ] Login as Admin (chopadeshyam8@gmail.com)
- [ ] Top bar shows admin's email (not Sujal's)
- [ ] Redirects to `/admin`
- [ ] Logout
- [ ] Login as Sujal again
- [ ] Top bar shows Sujal's email (not admin's)

### 4. Test Browser Cache
- [ ] Open Incognito/Private window
- [ ] Login as Sujal
- [ ] Should work without any cached data

---

## 🚨 Common Issues & Solutions

### Issue: "User not found" or "Invalid login credentials"
**Solution**: The user doesn't exist in auth.users. Re-create the account via signup page.

### Issue: "new row violates row-level security policy"
**Solution**: Run the `2025-10-12-fix-profiles-rls.sql` migration first.

### Issue: Top bar shows wrong email after login
**Solutions**:
1. **Clear browser cache completely**
2. **Use Incognito window** to test without cache
3. **Check if multiple tabs are open** with different users
4. **Hard refresh the page**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Issue: Profile fetch fails with RLS error
**Solution**: Make sure these policies exist:
```sql
-- Users can read their own profile
CREATE POLICY "profiles_self_read" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "profiles_self_insert" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);
```

### Issue: Login succeeds but redirects to wrong dashboard
**Solution**: Check the profile's `role` field:
```sql
UPDATE public.profiles 
SET role = 'client' 
WHERE email = 'sujalatkari.22@gmail.com';
```

---

## 🔐 Security Notes

### Admin Email Check
Your `.env.local` has:
```
NEXT_PUBLIC_ADMIN_EMAILS=chopadeshyam8@gmail.com
```

This means:
- ✅ Only `chopadeshyam8@gmail.com` can be an admin
- ✅ All other emails will be clients
- ✅ `sujalatkari.22@gmail.com` should be a client (correct)

### RLS Policies
The fixed RLS policies ensure:
- ✅ Users can only read/update their own profile
- ✅ Users can create their own profile during signup
- ✅ Admins can manage all profiles
- ✅ No unauthorized access to other users' data

---

## 📂 Related Files

- RLS Fix: `supabase/migrations/2025-10-12-fix-profiles-rls.sql`
- Profile Check: `supabase/migrations/2025-10-12-check-and-fix-profiles.sql`
- UserMenu: `src/app/_user-menu.client.tsx`
- Login: `src/app/login/page.tsx`
- Register: `src/app/register/page.tsx`
- Schema: `supabase/schema.sql`

---

## 🎯 TL;DR - Quick Steps

1. **Run RLS fix** in Supabase SQL Editor
2. **Run profile check/fix** script to create missing profiles
3. **Clear browser cache** or use Incognito
4. **Logout and login** as sujalatkari.22@gmail.com
5. **Verify** top bar shows correct email

The key issue is that the profile wasn't created during signup due to RLS policy errors. Once you run the migrations and create the missing profile, everything should work perfectly!
