-- =====================================================
-- QUICK FIX: Run this in Supabase SQL Editor
-- =====================================================
-- This will fix the RLS policies for chat image uploads
-- =====================================================

-- 1. Initialize user settings for ALL existing users
INSERT INTO user_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 2. Fix RLS policies for user_settings
DROP POLICY IF EXISTS "user_settings self insert" ON user_settings;
CREATE POLICY "user_settings self insert" ON user_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings self update" ON user_settings;
CREATE POLICY "user_settings self update" ON user_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings self read" ON user_settings;
CREATE POLICY "user_settings self read" ON user_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. Fix RLS policies for notification_preferences
DROP POLICY IF EXISTS "notification_preferences self insert" ON notification_preferences;
CREATE POLICY "notification_preferences self insert" ON notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_preferences self update" ON notification_preferences;
CREATE POLICY "notification_preferences self update" ON notification_preferences
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_preferences self read" ON notification_preferences;
CREATE POLICY "notification_preferences self read" ON notification_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. Verify settings exist
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM user_settings) as users_with_settings,
    (SELECT COUNT(*) FROM notification_preferences) as users_with_notif_prefs;

-- =====================================================
-- NEXT: MANUALLY CREATE STORAGE BUCKET
-- =====================================================
-- Go to Supabase Dashboard → Storage → New Bucket
-- 
-- Bucket settings:
-- - Name: chat-images
-- - Public: YES
-- - File size limit: 5242880 (5MB)
-- - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
--
-- Then add these 3 policies to the bucket:
-- =====================================================

-- POLICY 1: Allow Upload
-- CREATE POLICY "Authenticated users can upload chat images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'chat-images');

-- POLICY 2: Allow View  
-- CREATE POLICY "Anyone can view chat images"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'chat-images');

-- POLICY 3: Allow Delete Own
-- CREATE POLICY "Users can delete own images"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'chat-images' AND owner = auth.uid());

-- =====================================================
-- Done! Try uploading an image in chat again
-- =====================================================
