# 🔧 Storage & RLS Policy Fix Guide

## Problem
Error when uploading images in chat: **"new row violates row-level security policy"**

## Root Cause
1. **Storage bucket `chat-images` doesn't exist** or has no RLS policies
2. **`user_settings` table** missing proper INSERT policy or settings not initialized for user

---

## 🚀 Quick Fix (Do This First!)

### Step 1: Create Storage Bucket in Supabase Dashboard

1. Open your Supabase project dashboard
2. Go to **Storage** → Click **New bucket**
3. Fill in details:
   - **Name:** `chat-images`
   - **Public bucket:** ✅ Enable (so images are publicly accessible)
   - **File size limit:** `5242880` (5MB)
   - **Allowed MIME types:** 
     ```
     image/jpeg
     image/jpg
     image/png
     image/gif
     image/webp
     ```
4. Click **Create bucket**

### Step 2: Add Storage Policies

Go to **Storage** → Select `chat-images` bucket → **Policies** tab → Click **New Policy**

#### Policy 1: Allow Upload
```sql
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-images'
);
```

#### Policy 2: Allow Select/View
```sql
CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');
```

#### Policy 3: Allow Delete Own Images
```sql
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-images' AND
    owner = auth.uid()
);
```

### Step 3: Initialize User Settings

Go to **SQL Editor** → Run this query:

```sql
-- Initialize settings for all existing users
INSERT INTO user_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

### Step 4: Fix RLS Policies on Settings Tables

Run this in **SQL Editor**:

```sql
-- Fix user_settings policies
DROP POLICY IF EXISTS "user_settings self insert" ON user_settings;
CREATE POLICY "user_settings self insert" ON user_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix notification_preferences policies  
DROP POLICY IF EXISTS "notification_preferences self insert" ON notification_preferences;
CREATE POLICY "notification_preferences self insert" ON notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

---

## 🔍 Verify Fix

### Test 1: Check if bucket exists
```sql
SELECT * FROM storage.buckets WHERE id = 'chat-images';
```
Should return 1 row.

### Test 2: Check storage policies
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%chat%';
```
Should show 3 policies.

### Test 3: Check user settings exist
```sql
SELECT COUNT(*) FROM user_settings;
SELECT COUNT(*) FROM notification_preferences;
```
Should equal the number of users in `auth.users`.

### Test 4: Try uploading an image
1. Go to chat section
2. Click image upload button
3. Select an image
4. Should upload successfully! ✅

---

## 🛠️ Advanced Fix (Auto-Initialize Settings)

If you want settings to auto-create when users sign up, run the migration file:

```bash
# In your Supabase dashboard → SQL Editor
# Copy and run the entire content of:
supabase/migrations/2025-10-26-fix-storage-and-settings-rls.sql
```

This adds a trigger that automatically creates settings records when new users sign up.

---

## 🐛 Troubleshooting

### Error: "bucket not found"
- Go back to Step 1 and create the bucket

### Error: "policies not working"
- Make sure you're logged in (check `auth.uid()` is not null)
- Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'objects';`

### Error: "still getting RLS error"
- Check if user_settings exist for your user:
  ```sql
  SELECT * FROM user_settings WHERE user_id = auth.uid();
  ```
- If null, run Step 3 again

### Images not showing after upload
- Verify bucket is **Public** (Settings → Make public)
- Check image URL is correct: should start with your Supabase storage URL

---

## 📝 Alternative: Disable RLS Temporarily (Not Recommended)

**⚠️ Only for testing! Don't use in production!**

```sql
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
```

To re-enable:
```sql
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Summary

**The error happens because:**
1. Storage bucket doesn't have proper policies
2. User settings aren't initialized

**The fix:**
1. ✅ Create `chat-images` bucket (public)
2. ✅ Add 3 storage policies (upload, select, delete)
3. ✅ Initialize user_settings for all users
4. ✅ Fix INSERT policies on settings tables

After completing these steps, image uploads in chat should work perfectly!

---

## 🔗 References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- Migration file: `supabase/migrations/2025-10-26-fix-storage-and-settings-rls.sql`
