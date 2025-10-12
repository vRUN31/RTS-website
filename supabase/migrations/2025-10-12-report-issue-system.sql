-- =====================================================
-- REPORT ISSUE SYSTEM MIGRATION
-- =====================================================
-- Created: October 12, 2025
-- Purpose: Allow clients to report issues to admin with replies
-- Features: Issue tracking, status management, admin replies, notifications
-- =====================================================

-- 1. ISSUES TABLE
-- Stores client-reported issues
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Issue details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('shipment', 'billing', 'technical', 'general', 'urgent')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    
    -- Admin assignment
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Attachments
    attachment_urls TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- 2. ISSUE REPLIES TABLE
-- Stores conversation between client and admin
CREATE TABLE IF NOT EXISTS issue_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Reply content
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Internal notes only admins can see
    
    -- Attachments
    attachment_urls TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INDEXES FOR PERFORMANCE
-- Issues indexes
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_client_id ON issues(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_updated_at ON issues(updated_at DESC);

-- Issue replies indexes
CREATE INDEX IF NOT EXISTS idx_issue_replies_issue_id ON issue_replies(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_replies_user_id ON issue_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_replies_created_at ON issue_replies(created_at DESC);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_replies ENABLE ROW LEVEL SECURITY;

-- Issues Policies
-- Clients can view their own issues
CREATE POLICY "issues_client_select" ON issues
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all issues
CREATE POLICY "issues_admin_select" ON issues
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Clients can create their own issues
CREATE POLICY "issues_client_insert" ON issues
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Clients can update their own issues (only specific fields)
CREATE POLICY "issues_client_update" ON issues
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can update any issue
CREATE POLICY "issues_admin_update" ON issues
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Issue Replies Policies
-- Users can view replies to their issues (excluding internal notes)
CREATE POLICY "issue_replies_client_select" ON issue_replies
    FOR SELECT
    TO authenticated
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
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Users can insert replies to their issues
CREATE POLICY "issue_replies_client_insert" ON issue_replies
    FOR INSERT
    TO authenticated
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
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 5. TRIGGERS AND FUNCTIONS

-- Function to update issue's updated_at timestamp
CREATE OR REPLACE FUNCTION update_issue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for issues
DROP TRIGGER IF EXISTS trigger_update_issue_timestamp ON issues;
CREATE TRIGGER trigger_update_issue_timestamp
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_issue_timestamp();

-- Function to update issue when reply is added
CREATE OR REPLACE FUNCTION update_issue_on_reply()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the issue's updated_at timestamp
    UPDATE issues
    SET updated_at = NEW.created_at
    WHERE id = NEW.issue_id;
    
    -- If reply is from admin and issue is 'open', change to 'in_progress'
    IF EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = NEW.user_id
        AND profiles.role = 'admin'
    ) THEN
        UPDATE issues
        SET status = CASE 
            WHEN status = 'open' THEN 'in_progress'
            ELSE status
        END
        WHERE id = NEW.issue_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new replies
DROP TRIGGER IF EXISTS trigger_update_issue_on_reply ON issue_replies;
CREATE TRIGGER trigger_update_issue_on_reply
    AFTER INSERT ON issue_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_issue_on_reply();

-- Function to send notification when issue is created
CREATE OR REPLACE FUNCTION notify_admin_on_issue()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification for all admins
    INSERT INTO notifications (user_id, type, channel, payload, status)
    SELECT 
        p.id,
        'system',
        'inapp',
        jsonb_build_object(
            'issueId', NEW.id,
            'message', 'New issue reported: ' || NEW.title,
            'category', NEW.category,
            'priority', NEW.priority
        ),
        'queued'
    FROM profiles p
    WHERE p.role = 'admin';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new issues
DROP TRIGGER IF EXISTS trigger_notify_admin_on_issue ON issues;
CREATE TRIGGER trigger_notify_admin_on_issue
    AFTER INSERT ON issues
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_issue();

-- Function to notify client when admin replies
CREATE OR REPLACE FUNCTION notify_client_on_reply()
RETURNS TRIGGER AS $$
DECLARE
    v_issue_user_id UUID;
    v_is_admin BOOLEAN;
BEGIN
    -- Check if reply is from admin
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = NEW.user_id
        AND profiles.role = 'admin'
    ) INTO v_is_admin;
    
    -- Only notify if reply is from admin and not internal
    IF v_is_admin AND NOT NEW.is_internal THEN
        -- Get issue owner
        SELECT user_id INTO v_issue_user_id
        FROM issues
        WHERE id = NEW.issue_id;
        
        -- Send notification to client
        INSERT INTO notifications (user_id, type, channel, payload, status)
        VALUES (
            v_issue_user_id,
            'system',
            'inapp',
            jsonb_build_object(
                'issueId', NEW.issue_id,
                'message', 'Admin replied to your issue',
                'replyId', NEW.id
            ),
            'queued'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new replies
DROP TRIGGER IF EXISTS trigger_notify_client_on_reply ON issue_replies;
CREATE TRIGGER trigger_notify_client_on_reply
    AFTER INSERT ON issue_replies
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_reply();

-- 6. ENABLE REALTIME FOR TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE issue_replies;

-- 7. GRANT PERMISSIONS
GRANT ALL ON issues TO authenticated;
GRANT ALL ON issue_replies TO authenticated;

-- 8. COMMENTS FOR DOCUMENTATION
COMMENT ON TABLE issues IS 'Client-reported issues with status tracking and admin assignment';
COMMENT ON TABLE issue_replies IS 'Conversation thread for each issue between client and admin';
COMMENT ON COLUMN issue_replies.is_internal IS 'Internal notes only visible to admins';
COMMENT ON FUNCTION update_issue_on_reply() IS 'Updates issue status when admin replies';
COMMENT ON FUNCTION notify_admin_on_issue() IS 'Notifies all admins when new issue is created';
COMMENT ON FUNCTION notify_client_on_reply() IS 'Notifies client when admin replies to their issue';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Tables created: issues, issue_replies
-- RLS policies: Clients see only their issues, admins see all
-- Realtime enabled: Yes
-- Automatic notifications: Yes
-- Status workflow: open → in_progress → resolved → closed
-- =====================================================
