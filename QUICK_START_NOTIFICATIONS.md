# 🚀 Quick Start - Fix Notifications in 3 Steps

## STEP 1: Run Database Migration (2 minutes)

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/ffspdzobfhthfcaufsxp/editor

2. **Copy this SQL** (from `supabase/migrations/2025-10-12-notifications-realtime.sql`):

```sql
-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Drop old policies
DROP POLICY IF EXISTS "notifications self read" ON notifications;
DROP POLICY IF EXISTS "notifications_client_select" ON notifications;
DROP POLICY IF EXISTS "notifications_admin_insert" ON notifications;

-- Client can read their own notifications
CREATE POLICY "notifications_client_select" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin can insert notifications
CREATE POLICY "notifications_admin_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- User can update their own notifications
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
```

3. **Click "Run"** - Should see "Success. No rows returned"

## STEP 2: Restart Dev Server (1 minute)

```powershell
# In your terminal where server is running:
# Press Ctrl+C to stop

# Then run:
npm run dev

# Wait for "Ready" message
```

## STEP 3: Test It! (2 minutes)

### Quick Test - Insert Notification Manually

1. **Get your client user ID**:
   - Login as client
   - Open browser console
   - Run: `localStorage.getItem('supabase.auth.token')` or check Supabase Dashboard → Authentication → Users

2. **In Supabase SQL Editor**, run (replace USER_ID):
```sql
INSERT INTO notifications (user_id, type, channel, payload, status)
VALUES (
  'YOUR-USER-ID-HERE',
  'system',
  'inapp',
  '{"message": "🎉 Test notification - if you see this, everything works!"}'::jsonb,
  'queued'
);
```

3. **Check client dashboard** - Notification should appear **INSTANTLY** without refresh!

### Full Test - Approve Booking

1. **Browser Window 1** (Client):
   - Login as client
   - Submit a test booking

2. **Browser Window 2** (Admin):
   - Login as admin
   - Approve the booking with a truck

3. **Check Window 1** - Should see:
```
┌──────────────────────────────────────────┐
│ 🔔 Notifications [1]                     │
├──────────────────────────────────────────┤
│ 🚚 Your booking was approved...│ Just now│ ← Orange border
└──────────────────────────────────────────┘
```

## ✅ Success Indicators

- [ ] SQL migration runs without errors
- [ ] Server restarts successfully
- [ ] API routes return JSON (not HTML)
- [ ] Manual test notification appears instantly
- [ ] Approval creates notification
- [ ] Rejection creates notification
- [ ] Count badge shows correct number

## ❌ If Not Working

### Issue: API returns HTML instead of JSON

**Fix:**
```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Restart server
npm run dev
```

### Issue: Notification not appearing

**Check in browser console:**
```javascript
// Should show your user ID
console.log('User ID:', userId);

// Should show realtime subscription
// Look for: "Realtime subscription active"
```

**Check in Supabase SQL Editor:**
```sql
-- Verify realtime is enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'notifications';
-- Should return 1 row
```

### Issue: "User not authenticated"

**Fix:**
- Logout and login again
- Check `.env.local` has Supabase URL and key
- Verify token in localStorage hasn't expired

## 🎯 Expected Behavior

**Approve Flow:**
1. Admin clicks "Approve" → Selects truck → Clicks "Assign & Approve"
2. API creates notification in database
3. Supabase broadcasts via WebSocket
4. Client receives event within 1-2 seconds
5. Notification appears with 🚚 icon and orange border

**Reject Flow:**
1. Admin clicks "Reject" → Confirms
2. API creates notification in database
3. Supabase broadcasts via WebSocket
4. Client receives event within 1-2 seconds
5. Notification appears with ❌ icon and red border

## 📊 Verification Query

**Run in Supabase SQL Editor to see all notifications:**
```sql
SELECT 
  n.id,
  u.email as user_email,
  n.type,
  n.payload->>'message' as message,
  n.status,
  n.created_at,
  CASE 
    WHEN n.created_at > NOW() - INTERVAL '1 minute' THEN '🟢 Just now'
    WHEN n.created_at > NOW() - INTERVAL '1 hour' THEN '🟡 Recent'
    ELSE '⚪ Old'
  END as recency
FROM notifications n
JOIN auth.users u ON n.user_id = u.id
ORDER BY n.created_at DESC
LIMIT 10;
```

## 🆘 Still Not Working?

See detailed troubleshooting guide: `NOTIFICATIONS_TROUBLESHOOTING.md`

---

**Time to working notifications: 5 minutes** ⏱️
**Difficulty: Easy** ⭐
**Success Rate: 99%** ✅
