"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import './chat-notification-badge.css';

type ChatNotificationBadgeProps = {
    userId: string;
    userRole: 'client' | 'admin';
    style?: React.CSSProperties;
};

export default function ChatNotificationBadge({ userId, userRole, style }: ChatNotificationBadgeProps) {
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        if (!userId) return;

        // Initial load
        loadUnreadCount();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('chat_rooms_unread')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_rooms',
                },
                () => {
                    loadUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, userRole]);

    async function loadUnreadCount() {
        if (!userId) return;

        try {
            if (userRole === 'client') {
                // Client: Get their own room's unread count
                const { data, error } = await supabase
                    .from('chat_rooms')
                    .select('unread_count_client')
                    .eq('client_id', userId)
                    .single();

                if (error) {
                    console.error('Error loading client unread count:', error);
                    return;
                }

                setUnreadCount(data?.unread_count_client || 0);
            } else {
                // Admin: Count rooms with unread messages
                const { data, error } = await supabase
                    .from('chat_rooms')
                    .select('unread_count_admin')
                    .gt('unread_count_admin', 0);

                if (error) {
                    console.error('Error loading admin unread count:', error);
                    return;
                }

                // Count how many clients have sent unread messages
                const totalUnreadRooms = data?.length || 0;
                setUnreadCount(totalUnreadRooms);
            }
        } catch (err) {
            console.error('Error loading unread count:', err);
        }
    }

    // Don't show badge if no unread messages (Instagram behavior)
    if (unreadCount === 0) return null;

    // For client, max display is 1
    const displayCount = userRole === 'client' ? Math.min(unreadCount, 1) : unreadCount;

    return (
        <span className="chat-notification-badge" style={style}>
            {displayCount > 99 ? '99+' : displayCount}
        </span>
    );
}
