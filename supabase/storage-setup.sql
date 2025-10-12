-- =====================================================
-- SUPABASE STORAGE SETUP FOR CHAT IMAGES
-- =====================================================
-- Run these SQL commands AFTER creating the storage bucket in UI
-- Bucket name: chat-images
-- =====================================================

-- 1. Allow authenticated users to upload images to chat-images bucket
CREATE POLICY "Allow authenticated uploads to chat-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-images' AND
    auth.uid()::text = (storage.foldername(name))[1]  -- Users can only upload to their own folder
);

-- 2. Allow authenticated users to update their own images
CREATE POLICY "Allow authenticated updates to own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'chat-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Allow authenticated users to delete their own images
CREATE POLICY "Allow authenticated deletes of own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Allow public read access to all chat images
-- (Required for displaying images in chat)
CREATE POLICY "Allow public read access to chat images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');

-- =====================================================
-- MANUAL STEPS IN SUPABASE DASHBOARD UI
-- =====================================================
-- 
-- 1. Go to Storage section in Supabase Dashboard
-- 2. Click "New bucket" button
-- 3. Bucket name: chat-images
-- 4. Set as: PUBLIC bucket (check the box)
-- 5. File size limit: 5242880 (5MB)
-- 6. Allowed MIME types: image/jpeg,image/png,image/gif,image/webp
-- 7. Click "Create bucket"
-- 8. Then run the SQL policies above in SQL Editor
-- 
-- =====================================================
