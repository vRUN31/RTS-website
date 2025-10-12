"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import InstagramChat from '@/src/components/chat/InstagramChat.client';
import '@/src/app/admin/support/admin-chat.css';

type ChatRoom = {
    id: string;
    client_id: string;
    admin_id: string | null;
    last_message: string | null;
    last_message_at: string | null;
    unread_count_admin: number;
    status: 'active' | 'archived' | 'closed';
    created_at: string;
    updated_at: string;
};

type ClientProfile = {
    id: string;
    name: string | null;
    email: string | null;
};

type RoomWithClient = ChatRoom & {
    client_name: string;
    client_email: string;
};

interface AdminChatInterfaceProps {
    userId: string;
}

export default function AdminChatInterface({ userId }: AdminChatInterfaceProps) {
    const [rooms, setRooms] = useState<RoomWithClient[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedClientEmail, setSelectedClientEmail] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');

    const supabase = createClient();

    // Load all chat rooms
    const loadRooms = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch all chat rooms
            let query = supabase
                .from('chat_rooms')
                .select('*')
                .order('last_message_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data: roomsData, error: roomsError } = await query;
            if (roomsError) throw roomsError;

            if (!roomsData || roomsData.length === 0) {
                setRooms([]);
                return;
            }

            // Fetch client profiles
            const clientIds = roomsData.map((r: ChatRoom) => r.client_id);
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', clientIds);

            if (profilesError) throw profilesError;

            // Map profiles to rooms
            const profileMap = new Map<string, ClientProfile>();
            (profilesData || []).forEach((p: ClientProfile) => {
                profileMap.set(p.id, p);
            });

            const roomsWithClients: RoomWithClient[] = roomsData.map((room: ChatRoom) => {
                const profile = profileMap.get(room.client_id);
                return {
                    ...room,
                    client_name: profile?.name || profile?.email || 'Unknown Client',
                    client_email: profile?.email || 'No email',
                };
            });

            setRooms(roomsWithClients);
        } catch (err: any) {
            console.error('Failed to load rooms:', err);
            setError(err.message || 'Failed to load conversations');
        } finally {
            setIsLoading(false);
        }
    }, [supabase, filterStatus]);

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    // Subscribe to room updates
    useEffect(() => {
        const channel = supabase
            .channel('admin-chat-rooms')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_rooms',
                },
                () => {
                    loadRooms();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, loadRooms]);

    // Filter rooms by search query
    const filteredRooms = rooms.filter((room) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            room.client_name.toLowerCase().includes(query) ||
            room.client_email.toLowerCase().includes(query) ||
            room.last_message?.toLowerCase().includes(query)
        );
    });

    // Format time
    const formatTime = (dateString: string | null) => {
        if (!dateString) return 'No messages';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get initials from email
    const getInitials = (email: string) => {
        if (!email || email === 'No email') return '?';
        const parts = email.split('@')[0].split('.');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return email.slice(0, 2).toUpperCase();
    };

    // Handle room selection
    const handleRoomSelect = (room: RoomWithClient) => {
        setSelectedRoomId(room.id);
        setSelectedClientEmail(room.client_email);
    };

    // Total unread count
    const totalUnread = rooms.reduce((sum, room) => sum + room.unread_count_admin, 0);

    if (error) {
        return (
            <div className="admin-chat-container">
                <div className="admin-chat-error">
                    <div className="error-icon">⚠️</div>
                    <h3>Unable to Load Conversations</h3>
                    <p>{error}</p>
                    <button className="btn-dark" onClick={loadRooms}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-chat-container">
            {/* Rooms List Sidebar */}
            <div className="admin-chat-sidebar">
                {/* Search and Filter */}
                <div className="chat-sidebar-header">
                    <div className="chat-search-wrapper">
                        <span className="chat-search-icon">🔍</span>
                        <input
                            type="text"
                            className="chat-search-input"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="chat-search-clear"
                                onClick={() => setSearchQuery('')}
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    
                    <div className="chat-filter-tabs">
                        <button
                            className={`chat-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('all')}
                        >
                            All
                            {filterStatus === 'all' && totalUnread > 0 && (
                                <span className="tab-badge">{totalUnread}</span>
                            )}
                        </button>
                        <button
                            className={`chat-filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('active')}
                        >
                            Active
                        </button>
                        <button
                            className={`chat-filter-tab ${filterStatus === 'archived' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('archived')}
                        >
                            Archived
                        </button>
                    </div>
                </div>

                {/* Rooms List */}
                <div className="chat-rooms-list">
                    {isLoading ? (
                        <div className="chat-loading-state">
                            <div className="chat-spinner" />
                            <p>Loading conversations...</p>
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        <div className="chat-empty-state">
                            <div className="empty-icon">💬</div>
                            <h3>No Conversations</h3>
                            <p>
                                {searchQuery
                                    ? 'No conversations match your search'
                                    : 'Client conversations will appear here'}
                            </p>
                        </div>
                    ) : (
                        filteredRooms.map((room) => (
                            <div
                                key={room.id}
                                className={`chat-room-item ${selectedRoomId === room.id ? 'active' : ''}`}
                                onClick={() => handleRoomSelect(room)}
                            >
                                <div className="room-avatar">
                                    {getInitials(room.client_email)}
                                    {room.unread_count_admin > 0 && (
                                        <div className="avatar-badge pulse">
                                            {room.unread_count_admin}
                                        </div>
                                    )}
                                </div>
                                <div className="room-info">
                                    <div className="room-header">
                                        <h4 className="room-client-name">{room.client_email}</h4>
                                        <span className="room-time">{formatTime(room.last_message_at)}</span>
                                    </div>
                                    <div className="room-preview">
                                        <p className="room-last-message">
                                            {room.last_message || 'No messages yet'}
                                        </p>
                                        {room.unread_count_admin > 0 && (
                                            <span className="room-unread-badge pulse">
                                                {room.unread_count_admin}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="admin-chat-main">
                {!selectedRoomId ? (
                    <div className="admin-chat-placeholder">
                        <div className="placeholder-icon">💬</div>
                        <h2>Select a Conversation</h2>
                        <p>Choose a client from the list to view and reply to their messages</p>
                        {totalUnread > 0 && (
                            <div className="placeholder-stats">
                                <span className="stat-badge pulse">
                                    {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="admin-chat-wrapper">
                        <InstagramChat
                            userId={userId}
                            userRole="admin"
                            userName={selectedClientEmail || 'Client'}
                            roomIdProp={selectedRoomId}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
