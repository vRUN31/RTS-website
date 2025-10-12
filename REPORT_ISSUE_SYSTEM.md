# REPORT ISSUE SYSTEM - COMPLETE DOCUMENTATION

## 📋 Overview

The Report Issue system allows clients to report problems to admins with a comprehensive ticketing interface. This includes:
- Client submission form with categories and priorities
- Real-time notifications for both parties
- Admin management interface with status tracking
- Conversation threads with internal notes
- Full mobile responsive design

---

## 🗂️ Database Schema

### Tables Created

#### 1. `issues` Table
Stores all client-reported issues.

```sql
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    client_id UUID REFERENCES clients(id),
    
    -- Issue details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('shipment', 'billing', 'technical', 'general', 'urgent')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    
    -- Admin assignment
    assigned_to UUID REFERENCES profiles(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);
```

#### 2. `issue_replies` Table
Stores conversation between client and admin.

```sql
CREATE TABLE issue_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Reply content
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Internal notes only admins can see
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔐 Row Level Security (RLS) Policies

### Issues Table Policies

```sql
-- Clients can view their own issues
CREATE POLICY "issues_client_select" ON issues
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all issues
CREATE POLICY "issues_admin_select" ON issues
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Clients can create their own issues
CREATE POLICY "issues_client_insert" ON issues
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Clients can update their own issues
CREATE POLICY "issues_client_update" ON issues
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Admins can update any issue
CREATE POLICY "issues_admin_update" ON issues
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
```

### Issue Replies Policies

```sql
-- Users can view replies to their issues (excluding internal notes)
CREATE POLICY "issue_replies_client_select" ON issue_replies
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM issues
            WHERE issues.id = issue_replies.issue_id
            AND issues.user_id = auth.uid()
            AND (issue_replies.is_internal = false OR issue_replies.user_id = auth.uid())
        )
    );

-- Admins can view all replies
CREATE POLICY "issue_replies_admin_select" ON issue_replies
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Users can insert replies to their issues
CREATE POLICY "issue_replies_client_insert" ON issue_replies
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM issues
            WHERE issues.id = issue_replies.issue_id
            AND issues.user_id = auth.uid()
        )
    );

-- Admins can insert replies to any issue
CREATE POLICY "issue_replies_admin_insert" ON issue_replies
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
```

---

## ⚡ Real-time Features

### Realtime Enabled

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE issue_replies;
```

### Client Subscriptions
- New replies from admin → instant notification
- Issue status changes → instant update

### Admin Subscriptions
- New issues submitted → instant notification
- New replies from clients → instant update

---

## 🎨 Components Created

### 1. Client Issue Report Form
**File:** `src/components/issues/IssueReportForm.client.tsx`

**Features:**
- ✅ Create new issue with title, description, category, priority
- ✅ View all submitted issues
- ✅ Click issue to view details and conversation
- ✅ Reply to issues with real-time updates
- ✅ Real-time status badges (Open, In Progress, Resolved, Closed)
- ✅ Category icons (🚚 Shipment, 💳 Billing, ⚙️ Technical, 🚨 Urgent, 📝 General)
- ✅ Priority badges with colors and pulse animation for urgent
- ✅ Relative timestamps (Just now, 5m ago, 2h ago, etc.)
- ✅ Empty states with helpful messages
- ✅ Form validation (required fields, max lengths)
- ✅ Success/error messages

**Usage:**
```tsx
<IssueReportForm
  userId={userId}
  onClose={() => setShowIssueForm(false)}
  onSuccess={() => {
    console.log('Issue reported successfully');
  }}
/>
```

### 2. Admin Issues Management
**File:** `src/app/admin/issues/page.tsx`

**Features:**
- ✅ View all issues with filtering (All, Open, In Progress, Resolved)
- ✅ Search issues by title, description, or client email
- ✅ KPI cards showing counts (Open, In Progress, Resolved)
- ✅ Click issue to view full details
- ✅ Reply to issues with admin/client distinction
- ✅ Internal notes (visible only to admins)
- ✅ Update issue status with single click
- ✅ Real-time updates for new issues and replies
- ✅ Client email display for each issue
- ✅ 2-column layout (issue list + detail view)

---

## 🔔 Automatic Notifications

### 1. New Issue Notification
**Trigger:** When client creates an issue
**Recipients:** All admins
**Type:** system
**Payload:**
```json
{
  "issueId": "uuid",
  "message": "New issue reported: [title]",
  "category": "shipment",
  "priority": "high"
}
```

### 2. Admin Reply Notification
**Trigger:** When admin replies to an issue
**Recipients:** Issue owner (client)
**Type:** system
**Payload:**
```json
{
  "issueId": "uuid",
  "message": "Admin replied to your issue",
  "replyId": "uuid"
}
```

---

## 📊 Status Workflow

```
open → in_progress → resolved → closed
```

### Status Descriptions:

1. **open**: Issue just created, awaiting admin review
2. **in_progress**: Admin is actively working on the issue
3. **resolved**: Issue has been fixed/addressed
4. **closed**: Issue is completely closed (no further action)

### Auto-Status Changes:
- When admin replies to an "open" issue → automatically changes to "in_progress"
- When issue is marked "resolved" → `resolved_at` timestamp is set
- When issue is marked "closed" → `closed_at` timestamp is set

---

## 🎯 Categories

1. **shipment** (🚚): Issues related to shipments, tracking, delivery
2. **billing** (💳): Payment, invoices, pricing issues
3. **technical** (⚙️): App bugs, technical problems
4. **general** (📝): General inquiries, other topics
5. **urgent** (🚨): Critical issues requiring immediate attention

---

## 🚦 Priorities

1. **low**: Non-urgent, can be addressed later
2. **medium**: Standard priority (default)
3. **high**: Important, should be addressed soon
4. **urgent**: Critical, requires immediate attention (badge pulses)

---

## 🎨 UI/UX Features

### Client Interface
- **Premium Modal Design**: Backdrop blur, smooth animations
- **Form Validation**: Required fields, character limits, helpful hints
- **Issue List View**: Status badges, priority indicators, relative timestamps
- **Conversation View**: Instagram-style message bubbles (admin orange, client blue)
- **Real-time Updates**: New replies appear instantly
- **Empty States**: Helpful messages and CTAs when no issues exist
- **Mobile Responsive**: Adapts to all screen sizes

### Admin Interface
- **2-Column Layout**: Issue list on left, detail on right
- **Quick Stats**: KPI cards showing issue counts by status
- **Filter Tabs**: All, Open, In Progress, Resolved
- **Search Bar**: Search by title, description, or client email
- **Status Actions**: Quick buttons to update issue status
- **Internal Notes**: Toggle for admin-only messages
- **Color Coding**: Status and priority badges with distinct colors
- **Real-time**: New issues and replies appear instantly

---

## 🔧 Setup Instructions

### 1. Run Database Migration

```bash
# Execute the migration file in Supabase SQL Editor
# File: supabase/migrations/2025-10-12-report-issue-system.sql
```

**Or via Supabase CLI:**
```bash
supabase db push
```

### 2. Verify Tables Created

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('issues', 'issue_replies');

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('issues', 'issue_replies');
```

### 3. Verify Realtime Enabled

```sql
-- Check if tables are in realtime publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('issues', 'issue_replies');
```

### 4. Test Issue Creation

As a client:
1. Navigate to customer dashboard
2. Click "💬 Support Chat" in sidebar
3. Click "⚠️ Report Issue"
4. Fill out form and submit
5. View issue in "My Issues" list

As an admin:
1. Navigate to `/admin/issues`
2. See new issue appear in list
3. Click issue to view details
4. Reply to issue
5. Update status

---

## 🧪 Testing Checklist

### Client Side
- [ ] Create issue with all required fields
- [ ] See issue in "My Issues" list
- [ ] Click issue to view details
- [ ] Reply to issue
- [ ] Receive notification when admin replies
- [ ] See status badge update in real-time
- [ ] Test form validation (empty fields, max length)
- [ ] Test all categories and priorities
- [ ] Test mobile responsive design

### Admin Side
- [ ] See new issue appear in list instantly
- [ ] Receive notification for new issue
- [ ] Search issues by keyword
- [ ] Filter issues by status
- [ ] Click issue to view full details
- [ ] Reply to issue (normal and internal)
- [ ] Update issue status
- [ ] See KPI cards update
- [ ] Test with multiple issues
- [ ] Test mobile responsive layout

---

## 🐛 Troubleshooting

### Issue Not Appearing for Admin

**Check:**
1. RLS policies allow admin SELECT on issues
2. Admin profile has `role = 'admin'`
3. Realtime is enabled for issues table

**Fix:**
```sql
-- Verify admin role
SELECT id, email, role FROM profiles WHERE role = 'admin';

-- Re-enable realtime if needed
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
```

### Notifications Not Working

**Check:**
1. Notifications table has realtime enabled
2. Trigger functions are created
3. User is authenticated

**Fix:**
```sql
-- Check trigger functions
SELECT * FROM pg_trigger WHERE tgname LIKE '%issue%';

-- Re-create triggers if needed
DROP TRIGGER IF EXISTS trigger_notify_admin_on_issue ON issues;
CREATE TRIGGER trigger_notify_admin_on_issue
    AFTER INSERT ON issues
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_issue();
```

### Replies Not Visible

**Check:**
1. `is_internal` flag is false for client-visible replies
2. RLS policies allow client to SELECT replies
3. Realtime subscription is active

**Fix:**
```sql
-- Check if reply is internal
SELECT id, issue_id, is_internal FROM issue_replies;

-- Make reply public if needed
UPDATE issue_replies SET is_internal = false WHERE id = 'uuid';
```

### Real-time Not Working

**Check:**
1. Supabase client is initialized correctly
2. Channel subscription is active
3. User is authenticated

**Fix in Client Code:**
```tsx
// Ensure channel is subscribed
const channel = supabase.channel('issues-realtime');
const status = channel.subscribe();
console.log('Channel status:', status); // Should be 'SUBSCRIBED'
```

---

## 📈 Performance Optimization

### Indexes Created
```sql
-- Issues indexes
CREATE INDEX idx_issues_user_id ON issues(user_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);

-- Issue replies indexes
CREATE INDEX idx_issue_replies_issue_id ON issue_replies(issue_id);
CREATE INDEX idx_issue_replies_created_at ON issue_replies(created_at DESC);
```

### Query Optimization Tips
1. Filter by status before searching
2. Limit results with `.limit(50)`
3. Use pagination for large datasets
4. Cache frequently accessed data

---

## 🔮 Future Enhancements

### Planned Features
- [ ] File attachments (images, PDFs)
- [ ] Email notifications
- [ ] Issue templates for common problems
- [ ] Bulk actions (close multiple issues)
- [ ] Issue analytics dashboard
- [ ] Priority auto-escalation based on age
- [ ] Custom fields per category
- [ ] Issue tagging system
- [ ] Export issues to CSV
- [ ] SLA tracking and alerts

### Nice-to-Have Features
- [ ] Issue voting/upvoting
- [ ] Related issues suggestions
- [ ] Knowledge base integration
- [ ] AI-powered categorization
- [ ] Customer satisfaction ratings
- [ ] Issue resolution time reports

---

## 📝 API Reference

### Create Issue
```tsx
const { error } = await supabase.from('issues').insert({
  user_id: userId,
  client_id: clientId,
  title: 'Issue title',
  description: 'Detailed description',
  category: 'shipment',
  priority: 'high',
  status: 'open'
});
```

### Get Issues (Client)
```tsx
const { data, error } = await supabase
  .from('issues')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Get Issues (Admin)
```tsx
const { data, error } = await supabase
  .from('issues')
  .select(`
    *,
    profiles:user_id (
      email
    )
  `)
  .order('created_at', { ascending: false });
```

### Add Reply
```tsx
const { error } = await supabase.from('issue_replies').insert({
  issue_id: issueId,
  user_id: userId,
  message: 'Reply message',
  is_internal: false
});
```

### Update Issue Status
```tsx
const { error } = await supabase
  .from('issues')
  .update({ status: 'resolved', resolved_at: new Date().toISOString() })
  .eq('id', issueId);
```

---

## 📞 Support

For questions or issues with the Report Issue system:
1. Check this documentation
2. Review the troubleshooting section
3. Check Supabase logs for errors
4. Verify database permissions
5. Test with SQL queries directly

---

## ✅ Migration Checklist

Before deploying to production:
- [ ] Run database migration
- [ ] Verify RLS policies are correct
- [ ] Test issue creation as client
- [ ] Test issue management as admin
- [ ] Test real-time subscriptions
- [ ] Test notifications
- [ ] Verify mobile responsive design
- [ ] Check performance with multiple issues
- [ ] Test all status transitions
- [ ] Test internal notes visibility
- [ ] Review security (RLS, authentication)
- [ ] Update admin navigation to include Issues link

---

**Created:** October 12, 2025  
**Version:** 1.0  
**Author:** GitHub Copilot  
**System:** RTS Transport Management Platform
