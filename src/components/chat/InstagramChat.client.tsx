"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import './instagram-chat.css';

type ChatMessage = {
    id: string;
    room_id: string;
    sender_id: string;
    message_text: string | null;
    message_type: 'text' | 'image' | 'file' | 'system';
    image_url: string | null;
    file_url: string | null;
    file_name: string | null;
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    is_edited: boolean;
    is_deleted: boolean;
    created_at: string;
};

type ChatRoom = {
    id: string;
    client_id: string;
    admin_id: string | null;
    last_message: string | null;
    last_message_at: string | null;
    unread_count_client: number;
    unread_count_admin: number;
    status: 'active' | 'archived' | 'closed';
};

type TypingIndicator = {
    user_id: string;
    started_at: string;
};

interface InstagramChatProps {
    userId: string;
    userRole: 'client' | 'admin';
    userName?: string;
    userAvatar?: string;
    roomIdProp?: string;  // For admin: pass room ID directly instead of creating one
}

export default function InstagramChat({ userId, userRole, userName, userAvatar, roomIdProp }: InstagramChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [roomId, setRoomId] = useState<string | null>(roomIdProp || null);
    const [messageText, setMessageText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const supabase = createClient();

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Initialize or get chat room
    useEffect(() => {
        let mounted = true;

        async function initializeChat() {
            try {
                setIsLoading(true);
                setError(null);

                // Admin: use provided roomIdProp
                if (userRole === 'admin' && roomIdProp) {
                    if (mounted) {
                        setRoomId(roomIdProp);
                    }
                } else if (userRole === 'client') {
                    // Client: get or create room
                    const { data, error: rpcError } = await supabase
                        .rpc('get_or_create_chat_room', { p_client_id: userId });
                    
                    if (rpcError) throw rpcError;
                    if (mounted && data) {
                        setRoomId(data);
                    }
                } else {
                    if (mounted) setError('Invalid chat configuration');
                }
            } catch (err: any) {
                console.error('Failed to initialize chat:', err);
                if (mounted) setError(err.message || 'Failed to load chat');
            } finally {
                if (mounted) setIsLoading(false);
            }
        }

        initializeChat();

        return () => {
            mounted = false;
        };
    }, [userId, userRole, roomIdProp, supabase]);

    // Load messages when room is ready
    useEffect(() => {
        if (!roomId) return;

        let mounted = true;

        async function loadMessages() {
            try {
                const { data, error: fetchError } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('room_id', roomId)
                    .eq('is_deleted', false)
                    .order('created_at', { ascending: true })
                    .limit(100);

                if (fetchError) throw fetchError;
                if (mounted && data) {
                    setMessages(data as ChatMessage[]);
                    setTimeout(scrollToBottom, 100);
                }
            } catch (err: any) {
                console.error('Failed to load messages:', err);
                if (mounted) setError(err.message || 'Failed to load messages');
            }
        }

        loadMessages();

        return () => {
            mounted = false;
        };
    }, [roomId, supabase, scrollToBottom]);

    // Subscribe to real-time messages
    useEffect(() => {
        if (!roomId) return;

        const channel = supabase
            .channel(`chat-room-${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    const newMessage = payload.new as ChatMessage;
                    if (!newMessage.is_deleted) {
                        setMessages((prev) => [...prev, newMessage]);
                        setTimeout(scrollToBottom, 100);
                        
                        // Mark as read if not sent by current user
                        if (newMessage.sender_id !== userId) {
                            markMessagesAsRead();
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    const updatedMessage = payload.new as ChatMessage;
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === updatedMessage.id ? updatedMessage : msg
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, userId, supabase, scrollToBottom]);

    // Subscribe to typing indicators
    useEffect(() => {
        if (!roomId) return;

        const channel = supabase
            .channel(`typing-${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_typing',
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    const typing = payload.new as TypingIndicator;
                    if (typing.user_id !== userId) {
                        setIsTyping(true);
                        // Auto-hide after 5 seconds
                        setTimeout(() => setIsTyping(false), 5000);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'chat_typing',
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    const typing = payload.old as TypingIndicator;
                    if (typing.user_id !== userId) {
                        setIsTyping(false);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, userId, supabase]);

    // Mark messages as read
    const markMessagesAsRead = useCallback(async () => {
        if (!roomId) return;

        try {
            await supabase.rpc('mark_messages_as_read', {
                p_room_id: roomId,
                p_user_id: userId,
            });
        } catch (err) {
            console.error('Failed to mark messages as read:', err);
        }
    }, [roomId, userId, supabase]);

    // Mark messages as read when chat opens or becomes visible
    useEffect(() => {
        if (roomId) {
            markMessagesAsRead();
        }
    }, [roomId, markMessagesAsRead]);

    // Handle typing indicator
    const handleTyping = useCallback(async () => {
        if (!roomId) return;

        try {
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Insert or update typing indicator
            await supabase
                .from('chat_typing')
                .upsert({
                    room_id: roomId,
                    user_id: userId,
                    started_at: new Date().toISOString(),
                });

            // Auto-remove after 3 seconds
            typingTimeoutRef.current = setTimeout(async () => {
                await supabase
                    .from('chat_typing')
                    .delete()
                    .eq('room_id', roomId)
                    .eq('user_id', userId);
            }, 3000);
        } catch (err) {
            console.error('Failed to update typing indicator:', err);
        }
    }, [roomId, userId, supabase]);

    // Send message
    const sendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const text = messageText.trim();
        if (!text || !roomId || isSending) return;

        try {
            setIsSending(true);

            // Remove typing indicator
            await supabase
                .from('chat_typing')
                .delete()
                .eq('room_id', roomId)
                .eq('user_id', userId);

            // Insert message
            const { error: insertError } = await supabase
                .from('chat_messages')
                .insert({
                    room_id: roomId,
                    sender_id: userId,
                    message_text: text,
                    message_type: 'text',
                    status: 'sent',
                });

            if (insertError) throw insertError;

            setMessageText('');
            if (inputRef.current) {
                inputRef.current.style.height = 'auto';
            }
        } catch (err: any) {
            console.error('Failed to send message:', err);
            setError(err.message || 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !roomId) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        try {
            setUploadingImage(true);
            setError(null);

            // Upload to Supabase Storage
            const fileName = `${roomId}/${Date.now()}-${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('chat-images')
                .getPublicUrl(fileName);

            // Insert message with image
            const { error: insertError } = await supabase
                .from('chat_messages')
                .insert({
                    room_id: roomId,
                    sender_id: userId,
                    message_type: 'image',
                    image_url: urlData.publicUrl,
                    status: 'sent',
                });

            if (insertError) throw insertError;
        } catch (err: any) {
            console.error('Failed to upload image:', err);
            setError(err.message || 'Failed to upload image');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessageText(e.target.value);
        handleTyping();
        
        // Auto-resize
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Format time
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sending':
                return '○';
            case 'sent':
                return '✓';
            case 'delivered':
                return '✓✓';
            case 'read':
                return '✓✓';
            default:
                return '';
        }
    };

    if (isLoading) {
        return (
            <div className="instagram-chat">
                <div className="chat-loading">
                    <div className="chat-spinner" />
                </div>
            </div>
        );
    }

    if (error && !roomId) {
        return (
            <div className="instagram-chat">
                <div className="chat-empty">
                    <div className="chat-empty-icon">⚠️</div>
                    <h3>Unable to Load Chat</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="instagram-chat">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-left">
                    <div className="chat-avatar">
                        {userAvatar ? (
                            <img src={userAvatar} alt="Admin" />
                        ) : (
                            '👨‍💼'
                        )}
                    </div>
                    <div className="chat-header-info">
                        <h3>{userName || 'Support Team'}</h3>
                        <div className="chat-online-status">
                            <div className="online-dot" />
                            <span>Online</span>
                        </div>
                    </div>
                </div>
                <div className="chat-header-actions">
                    <button className="chat-action-btn" title="More options">
                        ⋮
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">💬</div>
                        <h3>Start a Conversation</h3>
                        <p>Send a message to begin chatting with our support team</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, index) => {
                            const isSent = msg.sender_id === userId;
                            const showDate =
                                index === 0 ||
                                new Date(msg.created_at).toDateString() !==
                                    new Date(messages[index - 1].created_at).toDateString();

                            return (
                                <div key={msg.id}>
                                    {showDate && (
                                        <div className="chat-date-separator">
                                            <div className="chat-date-line" />
                                            <div className="chat-date-text">
                                                {new Date(msg.created_at).toDateString() === new Date().toDateString()
                                                    ? 'Today'
                                                    : new Date(msg.created_at).toLocaleDateString('en-US', {
                                                          month: 'short',
                                                          day: 'numeric',
                                                          year: 'numeric',
                                                      })}
                                            </div>
                                            <div className="chat-date-line" />
                                        </div>
                                    )}
                                    <div className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
                                        <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
                                            {msg.message_text && (
                                                <p className="message-text">{msg.message_text}</p>
                                            )}
                                            {msg.image_url && (
                                                <img
                                                    src={msg.image_url}
                                                    alt="Shared image"
                                                    className="message-image"
                                                    onClick={() => setSelectedImage(msg.image_url)}
                                                    loading="lazy"
                                                />
                                            )}
                                            <div className="message-meta">
                                                <span>{formatTime(msg.created_at)}</span>
                                                {isSent && (
                                                    <span
                                                        className={`message-status status-${msg.status}`}
                                                        title={msg.status}
                                                    >
                                                        {getStatusIcon(msg.status)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isTyping && (
                            <div className="typing-indicator">
                                <div className="typing-dots">
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                    <div className="typing-dot" />
                                </div>
                                <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '4px' }}>
                                    typing...
                                </span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
                <div className="chat-input-wrapper">
                    <div className="chat-input-actions">
                        <button
                            className="chat-input-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            title="Upload image"
                        >
                            {uploadingImage ? '⏳' : '🖼️'}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                    </div>
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        placeholder="Message..."
                        value={messageText}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={isSending}
                    />
                </div>
                <button
                    className="chat-send-btn"
                    onClick={() => sendMessage()}
                    disabled={!messageText.trim() || isSending}
                    title="Send message"
                >
                    {isSending ? '⏳' : '➤'}
                </button>
            </div>

            {/* Error Display */}
            {error && roomId && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '80px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#ef4444',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        animation: 'slideInMessage 0.3s ease',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Image Preview Modal */}
            {selectedImage && (
                <div className="image-preview-modal" onClick={() => setSelectedImage(null)}>
                    <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
                        <button className="image-preview-close" onClick={() => setSelectedImage(null)}>
                            ✕
                        </button>
                        <img src={selectedImage} alt="Preview" className="image-preview-img" />
                    </div>
                </div>
            )}
        </div>
    );
}
