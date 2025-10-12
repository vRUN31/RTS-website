"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatNotificationBadge from '@/src/components/chat/ChatNotificationBadge.client';

type AdminDashboardLinksProps = {
    userId: string;
};

export default function AdminDashboardLinks({ userId }: AdminDashboardLinksProps) {
    const [openIssuesCount, setOpenIssuesCount] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        if (!userId) return;

        const fetchOpenIssues = async () => {
            const { data, error } = await supabase
                .from('issues')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'open');

            if (!error && data !== null) {
                setOpenIssuesCount(data as any as number);
            }
        };

        fetchOpenIssues();

        // Subscribe to real-time updates
        const channel = supabase
            .channel('admin-issues-count')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'issues',
                },
                () => {
                    fetchOpenIssues();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    return (
        <div className="text-center my-32" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="btn-dark no-underline btn-lg" href="/admin/analytics">
                View Analytics & Charts
            </a>
            <a className="btn-dark no-underline btn-lg" href="/admin/fleet">
                Fleet Management
            </a>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <a className="btn-dark no-underline btn-lg" href="/admin/support">
                    Support Chat
                </a>
                {userId && (
                    <ChatNotificationBadge
                        userId={userId}
                        userRole="admin"
                    />
                )}
            </div>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <a className="btn-dark no-underline btn-lg" href="/admin/issues">
                    ⚠️ Issue Management
                </a>
                {openIssuesCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '12px',
                        minWidth: '24px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                        animation: 'pulse 2s infinite'
                    }}>
                        {openIssuesCount > 99 ? '99+' : openIssuesCount}
                    </span>
                )}
            </div>
        </div>
    );
}
