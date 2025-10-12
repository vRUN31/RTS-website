-- =====================================================
-- NOTIFICATIONS REALTIME SETUP
-- =====================================================
-- Purpose: Enable real-time notifications for booking approval/rejection
-- =====================================================

-- 1. Ensure notifications table has proper structure
ALTER TABLE notifications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN type SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN channel SET NOT NULL;

-- 2. Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- 3. Update RLS policies for notifications

-- Drop existing policies
DROP POLICY IF EXISTS "notifications self read" ON notifications;
DROP POLICY IF EXISTS "notifications_client_select" ON notifications;
DROP POLICY IF EXISTS "notifications_admin_insert" ON notifications;

-- Clients can view their own notifications
CREATE POLICY "notifications_client_select" ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can insert notifications for any user
CREATE POLICY "notifications_admin_insert" ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5. Grant permissions
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;

-- 6. Add helpful comment
COMMENT ON TABLE notifications IS 'In-app notifications for booking approvals, rejections, and system messages';

-- =====================================================
-- VERIFICATION QUERIES (run these to test)
-- =====================================================

-- Check if realtime is enabled:
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Check policies:
-- SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE tablename = 'notifications';

-- Test notification insert (as admin):
-- INSERT INTO notifications (user_id, type, channel, payload, status)
-- VALUES (
--   'your-user-id-here',
--   'system',
--   'inapp',
--   '{"message": "Test notification"}'::jsonb,
--   'queued'
-- );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
