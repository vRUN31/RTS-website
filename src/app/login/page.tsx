"use client";
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const adminDomains = (process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);

export default function LoginPage() {
    const [role, setRole] = useState<'admin' | 'client'>('admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function isAdminEmailAllowed(mail: string) {
        const domain = mail.split('@')[1]?.toLowerCase();
        const domainOk = !!domain && adminDomains.includes(domain);
        const emailOk = adminEmails.includes(mail.toLowerCase());
        return domainOk || emailOk;
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn('Supabase env not configured; skipping real auth.');
            // No dashboard redirect for demo mode; just return
            return;
        }
        try {
            setLoading(true);
            // If user is attempting admin login, enforce email domain gate before auth
            if (role === 'admin' && !isAdminEmailAllowed(email)) {
                throw new Error('Admin login is restricted to approved email domains.');
            }
            const supabase = createClient();
            const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // Fetch profile to determine role if available
            const userId = signInData?.user?.id;
            if (!userId) throw new Error('Missing user id after login');
            // Determine intended role based on UI toggle + allowlist. UI can only elevate to admin when allowed.
            const intendedRole: 'admin' | 'client' = (role === 'admin' && isAdminEmailAllowed(email)) ? 'admin' : 'client';
            let target = '/dashboard/customer';
            let finalRole: 'admin' | 'client' = 'client';
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (!existingProfile) {
                // Bootstrap a profile when missing using intended role
                finalRole = intendedRole;
                await supabase
                    .from('profiles')
                    .upsert({ id: userId, role: finalRole })
                    .throwOnError();
            } else {
                // If user selected Admin (and is allowed), ensure profile is marked admin
                if (intendedRole === 'admin' && existingProfile.role !== 'admin') {
                    await supabase
                        .from('profiles')
                        .update({ role: 'admin' })
                        .eq('id', userId)
                        .throwOnError();
                    finalRole = 'admin';
                } else {
                    finalRole = (existingProfile.role === 'admin') ? 'admin' : 'client';
                }
            }

            target = finalRole === 'admin' ? '/admin' : '/dashboard/customer';
            window.location.href = target;
        } catch (err: any) {
            setError(err?.message ?? 'Login failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="main-centered" style={{ position: 'relative' }}>
            <Link href="/" className="back-btn" style={{ position: 'absolute', top: 24, left: 24, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 18, boxShadow: '0 2px 8px rgba(255,77,0,0.10)' }}>&larr;</span>
                <span style={{ color: 'var(--brand)', fontWeight: 600, fontSize: 16 }}>Back</span>
            </Link>
            <div className="logo-text">RTS</div>
            <div className="card card-gradient card-compact">
                <h4 className="title">Login</h4>
                <h4 className="subtitle">{role === 'admin' ? 'Login for administrators and staff' : 'Login for clients and users'}</h4>
                <form onSubmit={onSubmit} className="form-vertical">
                    <div className="row-center">
                        <label className={`pill ${role==='admin' ? 'is-active' : ''}`}>
                            <input className="radio-hidden" type="radio" name="role" value="admin" checked={role==='admin'} onChange={() => setRole('admin')} />
                            Admin
                        </label>
                        <label className={`pill ${role==='client' ? 'is-active' : ''}`}>
                            <input className="radio-hidden" type="radio" name="role" value="client" checked={role==='client'} onChange={() => setRole('client')} />
                            Client
                        </label>
                    </div>
                    <input className="input-text" type="email" placeholder="Email" required value={email} onChange={e=>setEmail(e.target.value)} />
                    <input className="input-text" type="password" placeholder="Password" required value={password} onChange={e=>setPassword(e.target.value)} />
                    <div className="row-between">
                        <label className="text-muted row-align">
                            <input type="checkbox" /> Remember Me
                        </label>
                        <Link href="/forgot-password" className="link-primary">Forgot Password?</Link>
                    </div>
                    {error && <div className="text-center text-dim" role="alert">{error}</div>}
                    <button className="btn-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Continue'}</button>
                    <div className="text-center text-muted mt-16">
                        Don't have an account? <Link href="/register" className="link-primary">Sign Up</Link>
                    </div>
                </form>
            </div>
        </main>
    );
}
