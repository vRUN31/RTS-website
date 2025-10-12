-- =====================================================
-- INSTAGRAM-STYLE CHAT SYSTEM MIGRATION
-- =====================================================
-- Created: October 12, 2025
-- Purpose: Real-time chat between clients and admin
-- Features: 1:1 conversations, read receipts, typing indicators, image support
-- =====================================================

-- 1. CHAT ROOMS TABLE
-- Represents a conversation between a client and admin
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Metadata
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count_client INT DEFAULT 0,
    unread_count_admin INT DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one room per client
    UNIQUE(client_id)
);

-- 2. CHAT MESSAGES TABLE
-- Stores all messages in conversations
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Message content
    message_text TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    image_url TEXT,
    file_url TEXT,
    file_name TEXT,
    
    -- Message status
    status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Add constraint: message must have either text or attachment
    CONSTRAINT message_has_content CHECK (
        message_text IS NOT NULL OR 
        image_url IS NOT NULL OR 
        file_url IS NOT NULL OR
        message_type = 'system'
    )
);

-- 3. TYPING INDICATORS TABLE
-- Track who is currently typing in each room
CREATE TABLE IF NOT EXISTS chat_typing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one typing indicator per user per room
    UNIQUE(room_id, user_id)
);

-- 4. INDEXES FOR PERFORMANCE
-- Chat rooms indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_client_id ON chat_rooms(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_admin_id ON chat_rooms(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message_at ON chat_rooms(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);

-- Typing indicators indexes
CREATE INDEX IF NOT EXISTS idx_chat_typing_room_id ON chat_typing(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_typing_started_at ON chat_typing(started_at);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing ENABLE ROW LEVEL SECURITY;

-- Chat Rooms Policies
-- Clients can view their own room
CREATE POLICY "chat_rooms_client_select" ON chat_rooms
    FOR SELECT
    TO authenticated
    USING (
        client_id = auth.uid()
    );

-- Admins can view all rooms
CREATE POLICY "chat_rooms_admin_select" ON chat_rooms
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Clients can create their own room
CREATE POLICY "chat_rooms_client_insert" ON chat_rooms
    FOR INSERT
    TO authenticated
    WITH CHECK (
        client_id = auth.uid()
    );

-- Both clients and admins can update rooms
CREATE POLICY "chat_rooms_update" ON chat_rooms
    FOR UPDATE
    TO authenticated
    USING (
        client_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Chat Messages Policies
-- Users can view messages in their rooms
CREATE POLICY "chat_messages_select" ON chat_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = chat_messages.room_id
            AND (
                chat_rooms.client_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'admin'
                )
            )
        )
    );

-- Users can send messages in their rooms
CREATE POLICY "chat_messages_insert" ON chat_messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = chat_messages.room_id
            AND (
                chat_rooms.client_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'admin'
                )
            )
        )
    );

-- Users can update their own messages
CREATE POLICY "chat_messages_update" ON chat_messages
    FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid());

-- Users can delete their own messages (soft delete)
CREATE POLICY "chat_messages_delete" ON chat_messages
    FOR DELETE
    TO authenticated
    USING (sender_id = auth.uid());

-- Typing Indicators Policies
-- Users can view typing indicators in their rooms
CREATE POLICY "chat_typing_select" ON chat_typing
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = chat_typing.room_id
            AND (
                chat_rooms.client_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'admin'
                )
            )
        )
    );

-- Users can insert their own typing indicators
CREATE POLICY "chat_typing_insert" ON chat_typing
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own typing indicators
CREATE POLICY "chat_typing_delete" ON chat_typing
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- 6. TRIGGERS AND FUNCTIONS

-- Function to update chat room's last_message and updated_at
CREATE OR REPLACE FUNCTION update_chat_room_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the chat room
    UPDATE chat_rooms
    SET 
        last_message = CASE 
            WHEN NEW.message_type = 'text' THEN LEFT(NEW.message_text, 100)
            WHEN NEW.message_type = 'image' THEN '📷 Image'
            WHEN NEW.message_type = 'file' THEN '📎 ' || COALESCE(NEW.file_name, 'File')
            ELSE 'Message'
        END,
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at,
        -- Increment unread count for the recipient
        unread_count_client = CASE 
            WHEN NEW.sender_id != chat_rooms.client_id THEN unread_count_client + 1
            ELSE unread_count_client
        END,
        unread_count_admin = CASE 
            WHEN NEW.sender_id = chat_rooms.client_id THEN unread_count_admin + 1
            ELSE unread_count_admin
        END
    WHERE id = NEW.room_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new messages
DROP TRIGGER IF EXISTS trigger_update_chat_room_on_message ON chat_messages;
CREATE TRIGGER trigger_update_chat_room_on_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    WHEN (NEW.message_type != 'system' AND NEW.is_deleted = false)
    EXECUTE FUNCTION update_chat_room_on_message();

-- Function to auto-cleanup old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM chat_typing
    WHERE started_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_room_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Update message status
    UPDATE chat_messages
    SET status = 'read'
    WHERE room_id = p_room_id
    AND sender_id != p_user_id
    AND status != 'read'
    AND is_deleted = false;
    
    -- Reset unread count
    UPDATE chat_rooms
    SET 
        unread_count_client = CASE 
            WHEN client_id = p_user_id THEN 0
            ELSE unread_count_client
        END,
        unread_count_admin = CASE 
            WHEN client_id != p_user_id THEN 0
            ELSE unread_count_admin
        END
    WHERE id = p_room_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create a chat room for a client
CREATE OR REPLACE FUNCTION get_or_create_chat_room(p_client_id UUID)
RETURNS UUID AS $$
DECLARE
    v_room_id UUID;
BEGIN
    -- Try to get existing room
    SELECT id INTO v_room_id
    FROM chat_rooms
    WHERE client_id = p_client_id;
    
    -- If not found, create new room
    IF v_room_id IS NULL THEN
        INSERT INTO chat_rooms (client_id, status)
        VALUES (p_client_id, 'active')
        RETURNING id INTO v_room_id;
    END IF;
    
    RETURN v_room_id;
END;
$$ LANGUAGE plpgsql;

-- 7. ENABLE REALTIME FOR TABLES
-- This allows Supabase to broadcast changes in real-time

ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_typing;

-- 8. GRANT PERMISSIONS
GRANT ALL ON chat_rooms TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_typing TO authenticated;

-- 9. COMMENTS FOR DOCUMENTATION
COMMENT ON TABLE chat_rooms IS 'Stores 1:1 chat conversations between clients and admin';
COMMENT ON TABLE chat_messages IS 'Stores all messages in chat conversations with support for text, images, and files';
COMMENT ON TABLE chat_typing IS 'Tracks real-time typing indicators for active users';
COMMENT ON FUNCTION update_chat_room_on_message() IS 'Automatically updates chat room metadata when new messages arrive';
COMMENT ON FUNCTION mark_messages_as_read(UUID, UUID) IS 'Marks all unread messages in a room as read for a specific user';
COMMENT ON FUNCTION get_or_create_chat_room(UUID) IS 'Gets existing chat room for client or creates new one if not exists';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Tables created: chat_rooms, chat_messages, chat_typing
-- RLS policies: Clients see only their rooms, admins see all
-- Realtime enabled: Yes
-- Indexes: Optimized for performance
-- =====================================================
