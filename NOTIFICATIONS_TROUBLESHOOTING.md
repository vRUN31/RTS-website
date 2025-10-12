# Fix Notifications Not Showing - Complete Guide

## Problem
Notifications are not appearing in the client dashboard after booking approval/rejection.

## Root Causes & Solutions

### 1. Database Setup Required

**Run this migration in Supabase SQL Editor:**

Location: `supabase/migrations/2025-10-12-notifications-realtime.sql`

```sql
-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Update RLS policies
DROP POLICY IF EXISTS "notifications self read" ON notifications;
DROP POLICY IF EXISTS "notifications_client_select" ON notifications;
DROP POLICY IF EXISTS "notifications_admin_insert" ON notifications;

CREATE POLICY "notifications_client_select" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_admin_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
```

### 2. Verify API Routes Working

**Test in browser console** (http://localhost:3002):
```javascript
// Should return JSON, not HTML
fetch('/api/bookings/approve')
  .then(r => r.json())
  .then(d => console.log('✅ Approve route:', d))
  .catch(e => console.error('❌ Error:', e));

fetch('/api/bookings/reject')
  .then(r => r.json())
  .then(d => console.log('✅ Reject route:', d))
  .catch(e => console.error('❌ Error:', e));
```

**Expected output:**
```json
{
  "message": "Approve/Reject API endpoint is working",
  "env": { "hasSupabaseUrl": true, "hasSupabaseKey": true }
}
```

### 3. Verify Realtime Subscription

**Check in browser console** (client dashboard):
```javascript
// This should already be running from the dashboard code
// Look for these logs:
// ✅ "New notification received: {new: {...}}"
// ❌ If you see "Realtime error" or subscription fails, check below
```

### 4. Manual Test - Create Notification Directly

**In Supabase SQL Editor:**

```sql
-- Get a client user ID first
SELECT id, email FROM auth.users WHERE email LIKE '%client%' LIMIT 1;

-- Insert test notification (replace USER_ID with actual ID)
INSERT INTO notifications (user_id, type, channel, payload, status)
VALUES (
  'USER_ID_HERE',
  'system',
  'inapp',
  '{"message": "Test notification - if you see this, realtime is working!"}'::jsonb,
  'queued'
);
```

**Expected**: Notification should appear in client dashboard **instantly** without refresh.

### 5. Check Database Constraints

**In Supabase SQL Editor:**

```sql
-- Verify notifications table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Check if realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';

-- Check RLS policies
SELECT 
  policyname, 
  cmd, 
  roles,
  SUBSTRING(qual::text, 1, 100) as using_clause
FROM pg_policies 
WHERE tablename = 'notifications';
```

### 6. Debug Approval Flow

**Add console logs to see what's happening:**

Open browser DevTools → Console, then:

1. **Admin side** - When approving:
```
Look for these logs:
[API approve] Request received
[API approve] Body: {bookingId: "...", truckId: "..."}
[API approve] Creating notification for user: ...
[API approve] Notification created successfully
[API approve] Success - booking approved
```

2. **Client side** - Should see:
```
New notification received: {
  new: {
    id: "...",
    user_id: "...",
    type: "dispatch",
    payload: {message: "..."},
    ...
  }
}
```

### 7. Common Issues & Fixes

#### Issue 1: "Realtime subscription not working"

**Check:**
```javascript
// In client dashboard console
const supabase = createClient();
console.log('Supabase URL:', supabase.supabaseUrl);
console.log('Supabase Key:', supabase.supabaseKey ? '✅ Set' : '❌ Missing');
```

**Fix:** Ensure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

#### Issue 2: "Notifications table RLS blocking reads"

**Fix in Supabase SQL Editor:**
```sql
-- Grant read access
GRANT SELECT ON notifications TO authenticated;

-- Verify policy allows user to read their own notifications
SELECT * FROM notifications WHERE user_id = auth.uid();
```

#### Issue 3: "user_id in notification doesn't match auth.uid()"

**Debug:**
```sql
-- Check what's in notifications table
SELECT id, user_id, type, payload->>'message' as message, created_at 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Check current user ID (run as client)
SELECT auth.uid() as my_user_id;

-- See if they match
SELECT * FROM notifications WHERE user_id = auth.uid();
```

**Fix:** Ensure booking.user_id matches the client's auth.uid()

#### Issue 4: "Notifications exist but not showing in UI"

**Check loading state:**
```sql
-- Verify notifications exist for user
SELECT * FROM notifications 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'client@example.com')
ORDER BY created_at DESC;
```

**Check UI code:**
- Customer dashboard should have `notifications` state
- Should map over `notifications.map(n => ...)`
- Check `notificationsLoading` state

### 8. Step-by-Step Testing Procedure

**A. Database Setup (REQUIRED FIRST):**
```
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire contents of: supabase/migrations/2025-10-12-notifications-realtime.sql
4. Paste and click "Run"
5. Verify success: "Success. No rows returned"
```

**B. Restart Dev Server (REQUIRED):**
```powershell
# Stop server (Ctrl+C)
# Then run:
npm run dev
```

**C. Test API Routes:**
```
1. Open browser: http://localhost:3002/api/bookings/approve
2. Should see JSON response (not HTML)
3. Open: http://localhost:3002/api/bookings/reject
4. Should see JSON response (not HTML)
```

**D. Test Realtime (Manual):**
```
1. Login as client in browser window 1
2. Keep dashboard open
3. Open Supabase SQL Editor
4. Run test notification insert (see section 4 above)
5. Check window 1 - notification should appear instantly
```

**E. Test Full Approval Flow:**
```
1. Client window: Submit a booking
2. Admin window: Approve the booking
3. Client window: Notification should appear instantly
   - Icon: 🚚
   - Message: "Your booking was approved..."
   - Time: "Just now"
   - Border: Orange
```

### 9. Quick Verification Checklist

Run these checks in order:

- [ ] Database migration executed successfully
- [ ] `supabase_realtime` includes `notifications` table
- [ ] RLS policies allow client to read own notifications
- [ ] API routes return JSON (not HTML)
- [ ] Dev server restarted after route fix
- [ ] `.env.local` has Supabase credentials
- [ ] Client dashboard has realtime subscription code
- [ ] Browser console shows no errors
- [ ] Manual test notification appears instantly
- [ ] Full approval flow creates notification

### 10. Emergency Debug Script

**Run this in Supabase SQL Editor to get full diagnostic:**

```sql
-- === NOTIFICATIONS DIAGNOSTIC ===

-- 1. Table exists?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'notifications'
) as table_exists;

-- 2. Realtime enabled?
SELECT EXISTS (
  SELECT FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
) as realtime_enabled;

-- 3. RLS policies count
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'notifications';

-- 4. Recent notifications
SELECT 
  id,
  user_id,
  type,
  channel,
  payload->>'message' as message,
  status,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 5;

-- 5. User count with notifications
SELECT COUNT(DISTINCT user_id) as users_with_notifications
FROM notifications;

-- === END DIAGNOSTIC ===
```

### 11. Still Not Working?

**Final checklist:**

1. **Hard refresh browser** (Ctrl+Shift+R)
2. **Clear browser cache** completely
3. **Check Supabase Dashboard logs** (Logs & Reports)
4. **Verify user is logged in** (auth.uid() returns value)
5. **Check browser Network tab** for WebSocket connection
6. **Look for errors** in browser console
7. **Check Next.js terminal** for server errors

### 12. Contact Support With

If still not working, provide:

1. Screenshot of Supabase SQL Editor showing:
   ```sql
   SELECT * FROM pg_publication_tables WHERE tablename = 'notifications';
   ```

2. Screenshot of browser console showing:
   ```javascript
   console.log('User ID:', userId);
   console.log('Notifications:', notifications);
   ```

3. Screenshot of Network tab showing WebSocket connection

4. Contents of browser console (all errors)

---

**Expected Timeline:**
- Database setup: 2 minutes
- Server restart: 1 minute
- Testing: 5 minutes
- **Total: 8 minutes to working notifications** ✅

**Success Criteria:**
When you approve a booking as admin, client should see notification appear within 1-2 seconds without refreshing the page.
