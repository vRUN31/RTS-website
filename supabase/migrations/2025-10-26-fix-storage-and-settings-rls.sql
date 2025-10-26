-- =====================================================
-- FIX STORAGE AND SETTINGS RLS POLICIES
-- =====================================================
-- Created: October 26, 2025
-- Purpose: Fix RLS issues for chat image uploads and user_settings
-- Issue: "new row violates row-level security policy" when uploading images
-- =====================================================

-- 1. CREATE STORAGE BUCKET FOR CHAT IMAGES (if not exists)
-- Note: This requires admin/service_role access in Supabase dashboard
-- or use Supabase dashboard to create bucket "chat-images" with public access

-- Insert storage bucket (this may need to be done via Supabase dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-images',
    'chat-images',
    true,  -- Public bucket for easy image access
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 2. STORAGE POLICIES FOR CHAT IMAGES

-- Drop existing policies if any
DROP POLICY IF EXISTS "chat_images_upload" ON storage.objects;
DROP POLICY IF EXISTS "chat_images_select" ON storage.objects;
DROP POLICY IF EXISTS "chat_images_delete" ON storage.objects;

-- Allow authenticated users to upload images to their room folders
CREATE POLICY "chat_images_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-images' AND
    (storage.foldername(name))[1] IN (
        SELECT room_id::text
        FROM chat_rooms
        WHERE client_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
);

-- Allow authenticated users to view images from their rooms
CREATE POLICY "chat_images_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'chat-images' AND
    (storage.foldername(name))[1] IN (
        SELECT room_id::text
        FROM chat_rooms
        WHERE client_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
);

-- Allow users to delete their own uploaded images
CREATE POLICY "chat_images_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-images' AND
    owner = auth.uid()
);

-- 3. FIX USER_SETTINGS RLS POLICIES
-- The issue is that user_settings self-insert policy might not be working correctly

-- Drop and recreate the self-insert policy with proper checks
DROP POLICY IF EXISTS "user_settings self insert" ON user_settings;
CREATE POLICY "user_settings self insert" ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also add an upsert policy to handle conflicts
DROP POLICY IF EXISTS "user_settings self upsert" ON user_settings;
CREATE POLICY "user_settings self upsert" ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. FIX NOTIFICATION_PREFERENCES RLS POLICIES (similar issue)

-- Drop and recreate for consistency
DROP POLICY IF EXISTS "notification_preferences self insert" ON notification_preferences;
CREATE POLICY "notification_preferences self insert" ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_preferences self upsert" ON notification_preferences;
CREATE POLICY "notification_preferences self upsert" ON notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. CREATE FUNCTION TO INITIALIZE USER SETTINGS ON FIRST LOGIN
-- This ensures settings always exist when user first logs in

CREATE OR REPLACE FUNCTION initialize_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default user_settings if not exists
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create default notification_preferences if not exists
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table to auto-initialize settings
-- Note: This trigger is on auth.users which requires service_role access
-- If this fails, initialize settings manually after user signup

DROP TRIGGER IF EXISTS trigger_initialize_user_settings ON auth.users;
CREATE TRIGGER trigger_initialize_user_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_settings();

-- 6. GRANT STORAGE PERMISSIONS
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 7. COMMENTS
COMMENT ON POLICY "chat_images_upload" ON storage.objects IS 'Allow authenticated users to upload images to their chat rooms';
COMMENT ON POLICY "chat_images_select" ON storage.objects IS 'Allow users to view images from their chat rooms';
COMMENT ON POLICY "chat_images_delete" ON storage.objects IS 'Allow users to delete their own uploaded images';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Fixed: Storage bucket RLS policies for chat-images
-- Fixed: user_settings INSERT policy
-- Fixed: notification_preferences INSERT policy
-- Added: Auto-initialization of settings on user creation
-- =====================================================

-- =====================================================
-- MANUAL STEPS REQUIRED IN SUPABASE DASHBOARD:
-- =====================================================
-- 1. Go to Storage → Create bucket "chat-images"
--    - Set as Public
--    - File size limit: 5MB
--    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
--
-- 2. If trigger on auth.users fails, manually initialize settings
--    for existing users:
--    
--    INSERT INTO user_settings (user_id)
--    SELECT id FROM auth.users
--    ON CONFLICT (user_id) DO NOTHING;
--    
--    INSERT INTO notification_preferences (user_id)
--    SELECT id FROM auth.users
--    ON CONFLICT (user_id) DO NOTHING;
-- =====================================================
