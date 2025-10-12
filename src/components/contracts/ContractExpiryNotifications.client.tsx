"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import './contract-components.css';

type ContractNotification = {
    id: string;
    contract_id: string;
    notification_type: string;
    title: string;
    message: string;
    sent_at: string;
    read_at: string | null;
    is_read: boolean;
    priority: string;
    metadata: any;
};

type ContractExpiryNotificationsProps = {
    clientId?: string;
    isAdmin?: boolean;
    compact?: boolean;
};

export default function ContractExpiryNotifications({ 
    clientId, 
    isAdmin = false,
    compact = false 
}: ContractExpiryNotificationsProps) {
    const [notifications, setNotifications] = useState<ContractNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load notifications
    const loadNotifications = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const supabase = createClient();
            let query = supabase
                .from('contract_notifications')
                .select('*')
                .order('sent_at', { ascending: false });

            if (!isAdmin && clientId) {
                query = query.eq('client_id', clientId);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.is_read).length || 0);
        } catch (err: any) {
            setError(err.message || 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('contract_notifications')
                .update({ 
                    is_read: true, 
                    read_at: new Date().toISOString() 
                })
                .eq('id', notificationId);

            if (error) throw error;

            // Update local state
            setNotifications(prev => 
                prev.map(n => n.id === notificationId 
                    ? { ...n, is_read: true, read_at: new Date().toISOString() }
                    : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err: any) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const supabase = createClient();
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            
            if (unreadIds.length === 0) return;

            const { error } = await supabase
                .from('contract_notifications')
                .update({ 
                    is_read: true, 
                    read_at: new Date().toISOString() 
                })
                .in('id', unreadIds);

            if (error) throw error;

            // Update local state
            setNotifications(prev => 
                prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (err: any) {
            console.error('Failed to mark all as read:', err);
        }
    };

    // Subscribe to realtime updates
    useEffect(() => {
        loadNotifications();

        const supabase = createClient();
        const channel = supabase
            .channel('contract-notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'contract_notifications',
                    filter: clientId ? `client_id=eq.${clientId}` : undefined,
                },
                (payload) => {
                    console.log('Notification update:', payload);
                    loadNotifications(); // Reload on any change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [clientId]);

    // Get priority badge
    const getPriorityBadge = (priority: string) => {
        const badges: Record<string, { icon: string; class: string }> = {
            urgent: { icon: '🔴', class: 'priority-urgent' },
            high: { icon: '🟠', class: 'priority-high' },
            medium: { icon: '🟡', class: 'priority-medium' },
            low: { icon: '🟢', class: 'priority-low' },
        };
        return badges[priority] || badges.medium;
    };

    // Get notification type label
    const getNotificationTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            expiry_90: 'Expiring in 90 days',
            expiry_60: 'Expiring in 60 days',
            expiry_30: 'Expiring in 30 days',
            expiry_7: 'Expiring in 7 days',
            expired: 'Contract Expired',
            renewal_due: 'Renewal Due',
            amendment: 'Contract Amendment',
            payment_due: 'Payment Due',
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="notifications-loading">
                <div className="spinner-small"></div>
                <span>Loading notifications...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="notifications-error">
                ⚠️ {error}
            </div>
        );
    }

    if (compact) {
        // Compact badge view for navigation
        return (
            <div className="notification-badge-compact">
                {unreadCount > 0 && (
                    <span className="notification-count">{unreadCount}</span>
                )}
            </div>
        );
    }

    return (
        <div className="contract-notifications-section">
            <div className="notifications-header">
                <h4>🔔 Contract Notifications</h4>
                <div className="notifications-actions">
                    {unreadCount > 0 && (
                        <>
                            <span className="unread-badge">{unreadCount} unread</span>
                            <button 
                                className="btn-mark-all-read"
                                onClick={markAllAsRead}
                                title="Mark all as read"
                            >
                                ✓ Mark all read
                            </button>
                        </>
                    )}
                    <button 
                        className="btn-refresh-notifications"
                        onClick={loadNotifications}
                        title="Refresh"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="empty-notifications">
                    <div className="empty-icon">🔕</div>
                    <p>No notifications yet</p>
                    <small>You'll be notified when contracts are expiring</small>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map((notification) => {
                        const priorityBadge = getPriorityBadge(notification.priority);
                        const daysUntilExpiry = notification.metadata?.days_until_expiry;
                        
                        return (
                            <div 
                                key={notification.id} 
                                className={`notification-card ${notification.is_read ? 'read' : 'unread'} ${priorityBadge.class}`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                            >
                                <div className="notification-priority">
                                    {priorityBadge.icon}
                                </div>
                                <div className="notification-content">
                                    <div className="notification-title">
                                        {notification.title}
                                        {!notification.is_read && <span className="new-badge">NEW</span>}
                                    </div>
                                    <div className="notification-message">
                                        {notification.message}
                                    </div>
                                    <div className="notification-meta">
                                        <span className="notification-type">
                                            {getNotificationTypeLabel(notification.notification_type)}
                                        </span>
                                        {daysUntilExpiry !== undefined && (
                                            <>
                                                <span>•</span>
                                                <span className="days-remaining">
                                                    {daysUntilExpiry} days remaining
                                                </span>
                                            </>
                                        )}
                                        <span>•</span>
                                        <span className="notification-time">
                                            {new Date(notification.sent_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                                {!notification.is_read && (
                                    <button 
                                        className="btn-mark-read"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                        }}
                                        title="Mark as read"
                                    >
                                        ✓
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
