'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import AdminChatInterface from '../../../components/admin/AdminChatInterface.client';

export default function AdminSupportPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function checkAuth() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();
                
                if (profile?.role !== 'admin') {
                    router.push('/dashboard/customer');
                    return;
                }

                setUserId(user.id);
            } catch (error) {
                console.error('Auth error:', error);
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        }

        checkAuth();
    }, [router, supabase]);

    if (isLoading) {
        return (
            <main className="dashboard-container" style={{ maxWidth: '1600px' }}>
                <div className="row-center mb-24">
                    <h1 className="admin-welcome" style={{ margin: 0 }}>
                        💬 Support Chat Management
                    </h1>
                </div>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div className="chat-spinner" style={{ margin: '0 auto 16px' }}></div>
                    <p className="text-muted">Loading...</p>
                </div>
            </main>
        );
    }

    if (!userId) {
        return null;
    }

    return (
        <main className="dashboard-container" style={{ maxWidth: '1600px' }}>
            <div className="row-center mb-24">
                <h1 className="admin-welcome" style={{ margin: 0 }}>
                    💬 Support Chat Management
                </h1>
            </div>
            <p className="text-muted text-center mb-32" style={{ fontSize: '1rem' }}>
                Manage all client conversations in real-time. Click a conversation to view and reply.
            </p>
            
            <AdminChatInterface userId={userId} />
        </main>
    );
}
