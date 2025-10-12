# QUICK START: Report Issue System

## 🚀 3-Step Setup

### Step 1: Run Database Migration

Open Supabase SQL Editor and execute:

```sql
-- File: supabase/migrations/2025-10-12-report-issue-system.sql
-- This creates:
-- - issues table
-- - issue_replies table
-- - RLS policies
-- - Triggers for notifications
-- - Indexes for performance
-- - Realtime subscriptions
```

**Or copy this complete migration:**

```sql
-- =====================================================
-- REPORT ISSUE SYSTEM MIGRATION
-- =====================================================

-- 1. Create issues table
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('shipment', 'billing', 'technical', 'general', 'urgent')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    attachment_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- 2. Create issue_replies table
CREATE TABLE IF NOT EXISTS issue_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    attachment_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_replies_issue_id ON issue_replies(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_replies_created_at ON issue_replies(created_at DESC);

-- 4. Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_replies ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for issues
CREATE POLICY "issues_client_select" ON issues FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "issues_admin_select" ON issues FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "issues_client_insert" ON issues FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "issues_client_update" ON issues FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "issues_admin_update" ON issues FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 6. Create RLS policies for issue_replies
CREATE POLICY "issue_replies_client_select" ON issue_replies FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_replies.issue_id AND issues.user_id = auth.uid() AND (issue_replies.is_internal = false OR issue_replies.user_id = auth.uid())));
CREATE POLICY "issue_replies_admin_select" ON issue_replies FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "issue_replies_client_insert" ON issue_replies FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM issues WHERE issues.id = issue_replies.issue_id AND issues.user_id = auth.uid()));
CREATE POLICY "issue_replies_admin_insert" ON issue_replies FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 7. Create trigger functions
CREATE OR REPLACE FUNCTION update_issue_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_issue_on_reply() RETURNS TRIGGER AS $$
BEGIN
    UPDATE issues SET updated_at = NEW.created_at WHERE id = NEW.issue_id;
    IF EXISTS (SELECT 1 FROM profiles WHERE profiles.id = NEW.user_id AND profiles.role = 'admin') THEN
        UPDATE issues SET status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END WHERE id = NEW.issue_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_admin_on_issue() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, channel, payload, status)
    SELECT p.id, 'system', 'inapp', jsonb_build_object('issueId', NEW.id, 'message', 'New issue reported: ' || NEW.title, 'category', NEW.category, 'priority', NEW.priority), 'queued'
    FROM profiles p WHERE p.role = 'admin';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_client_on_reply() RETURNS TRIGGER AS $$
DECLARE v_issue_user_id UUID; v_is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = NEW.user_id AND profiles.role = 'admin') INTO v_is_admin;
    IF v_is_admin AND NOT NEW.is_internal THEN
        SELECT user_id INTO v_issue_user_id FROM issues WHERE id = NEW.issue_id;
        INSERT INTO notifications (user_id, type, channel, payload, status) VALUES (v_issue_user_id, 'system', 'inapp', jsonb_build_object('issueId', NEW.issue_id, 'message', 'Admin replied to your issue', 'replyId', NEW.id), 'queued');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers
DROP TRIGGER IF EXISTS trigger_update_issue_timestamp ON issues;
CREATE TRIGGER trigger_update_issue_timestamp BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_issue_timestamp();

DROP TRIGGER IF EXISTS trigger_update_issue_on_reply ON issue_replies;
CREATE TRIGGER trigger_update_issue_on_reply AFTER INSERT ON issue_replies FOR EACH ROW EXECUTE FUNCTION update_issue_on_reply();

DROP TRIGGER IF EXISTS trigger_notify_admin_on_issue ON issues;
CREATE TRIGGER trigger_notify_admin_on_issue AFTER INSERT ON issues FOR EACH ROW EXECUTE FUNCTION notify_admin_on_issue();

DROP TRIGGER IF EXISTS trigger_notify_client_on_reply ON issue_replies;
CREATE TRIGGER trigger_notify_client_on_reply AFTER INSERT ON issue_replies FOR EACH ROW EXECUTE FUNCTION notify_client_on_reply();

-- 9. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE issue_replies;

-- 10. Grant permissions
GRANT ALL ON issues TO authenticated;
GRANT ALL ON issue_replies TO authenticated;

-- ✅ Migration complete!
```

### Step 2: Verify Installation

Run these verification queries:

```sql
-- 1. Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('issues', 'issue_replies');
-- Expected: 2 rows

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('issues', 'issue_replies');
-- Expected: both should have rowsecurity = true

-- 3. Check realtime is enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('issues', 'issue_replies');
-- Expected: 2 rows

-- 4. Check triggers exist
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%issue%';
-- Expected: 4 triggers

-- 5. Test insert (will fail if RLS not working)
-- As authenticated user:
INSERT INTO issues (user_id, title, description, category) 
VALUES (auth.uid(), 'Test Issue', 'Testing', 'general');
-- Expected: Success (1 row inserted)
```

### Step 3: Test the Feature

#### As a Client:
1. Login as a client user
2. Go to Customer Dashboard → Support section
3. Click "⚠️ Report Issue" button
4. Fill out the form:
   - Title: "Test shipment delay"
   - Category: Shipment 🚚
   - Priority: High
   - Description: "My shipment is delayed by 2 days"
5. Click "Submit Issue"
6. Click "View My Issues" to see your submitted issue
7. Click on the issue to view details
8. Wait for admin reply

#### As an Admin:
1. Login as admin user
2. Go to `/admin/issues`
3. See the test issue in the list
4. Click on the issue
5. Click "In Progress" status button
6. Type a reply: "We're looking into this now"
7. Click "Send Reply"
8. Issue status should change to "In Progress"
9. Client should receive notification instantly

---

## ✅ Success Criteria

You know it's working when:
- ✅ Client can create issues
- ✅ Admin sees new issues instantly (real-time)
- ✅ Admin receives notification for new issues
- ✅ Admin can reply to issues
- ✅ Client receives notification for admin replies
- ✅ Status badges update in real-time
- ✅ Search and filters work
- ✅ Internal notes are hidden from clients

---

## 🐛 Common Issues & Fixes

### "Permission denied for table issues"
**Problem:** RLS policies not applied correctly

**Fix:**
```sql
-- Re-create policies
DROP POLICY IF EXISTS "issues_client_select" ON issues;
CREATE POLICY "issues_client_select" ON issues 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());
```

### "Realtime not working"
**Problem:** Tables not added to realtime publication

**Fix:**
```sql
-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE issue_replies;

-- Verify
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### "Notifications not appearing"
**Problem:** Triggers not firing or notifications table not enabled

**Fix:**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_notify_admin_on_issue';

-- Re-create if missing
CREATE TRIGGER trigger_notify_admin_on_issue
    AFTER INSERT ON issues
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_issue();

-- Enable notifications realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### "Admin can't see issues"
**Problem:** User doesn't have admin role

**Fix:**
```sql
-- Check user role
SELECT id, email, role FROM profiles WHERE email = 'your-admin@email.com';

-- Set admin role if needed
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
```

---

## 📚 Additional Resources

- Full Documentation: `REPORT_ISSUE_SYSTEM.md`
- Database Migration: `supabase/migrations/2025-10-12-report-issue-system.sql`
- Client Component: `src/components/issues/IssueReportForm.client.tsx`
- Admin Page: `src/app/admin/issues/page.tsx`

---

## 🎯 Next Steps

After successful setup:
1. ✅ Run all 3 database migrations (notifications, chat, issues)
2. ✅ Create Supabase Storage bucket 'chat-images'
3. ✅ Test complete system end-to-end
4. ✅ Deploy to production

---

**Setup Time:** ~5 minutes  
**Difficulty:** Easy  
**Prerequisites:** Supabase project configured, user authentication working

Good luck! 🚀
