"use client";
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
const adminDomains = (process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);

export default function RegisterPage() {
    const [role, setRole] = useState<'admin' | 'client' | ''>('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    return (
        <main className="main-centered pos-relative">
            <Link href="/" className="back-btn no-underline row-align pos-abs back-link">
                <span className="back-pill">&larr;</span>
                <span className="back-text">Back</span>
            </Link>
            <div className="logo-text">RTS</div>
            <div className="card card-medium mt-16">
                <div className="title text-dark mb-18">Sign Up</div>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setError(null);
                        if (!supabaseUrl || !supabaseAnonKey) {
                            console.warn('Supabase env not configured; mocking sign-up flow.');
                            // No dashboard redirect for demo mode; just return
                            return;
                        }
                        try {
                            setLoading(true);
                            const supabase = createClient();
                            // Determine final role by domain; enforce gate if user attempts admin but domain not allowed
                            const emailDomain = email.split('@')[1]?.toLowerCase();
                            const domainSaysAdmin = !!emailDomain && adminDomains.includes(emailDomain);
                            const emailExplicitAdmin = adminEmails.includes(email.toLowerCase());
                            if (role === 'admin' && !(domainSaysAdmin || emailExplicitAdmin)) {
                                throw new Error('Admin signup is restricted to approved email domains.');
                            }
                            const { data, error } = await supabase.auth.signUp({ email, password });
                            if (error) throw error;
                            const userId = data.user?.id;
                            if (userId) {
                                const finalRole = (domainSaysAdmin || emailExplicitAdmin) ? 'admin' : 'client';
                                const displayName = (username?.trim()) || ([firstName, lastName].filter(Boolean).join(' ').trim()) || email;
                                await supabase
                                    .from('profiles')
                                    .upsert({ id: userId, role: finalRole, name: displayName, email })
                                    .throwOnError();
                                window.location.href = finalRole === 'admin' ? '/admin' : '/dashboard/customer';
                            } else {
                                // Email confirmation flow: show message and redirect to login
                                window.location.href = '/login';
                            }
                        } catch (err: any) {
                            setError(err?.message ?? 'Sign up failed');
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="form-vertical"
                >
                    <div className="row-gap-16">
                        <input className="input-text flex-1" required placeholder="First Name*" value={firstName} onChange={e=>setFirstName(e.target.value)} />
                        <input className="input-text flex-1" required placeholder="Last Name*" value={lastName} onChange={e=>setLastName(e.target.value)} />
                    </div>
                    <input className="input-text" required type="email" placeholder="Email*" value={email} onChange={e=>setEmail(e.target.value)} />
                    <input className="input-text" required placeholder="Username*" value={username} onChange={e=>setUsername(e.target.value)} />
                    <input className="input-text" required type="password" placeholder="Password*" value={password} onChange={e=>setPassword(e.target.value)} />
                    <input className="input-text" required type="password" placeholder="Confirm Password*" />
                                <div className="row-align">
                                    <span className="text-dark">Role*:</span>
                        <label className={`pill ${role==='admin' ? 'is-active' : ''}`}>
                            <input className="radio-hidden" type="radio" name="role" value="admin" required checked={role==='admin'} onChange={() => setRole('admin')} /> Admin
                        </label>
                        <label className={`pill ${role==='client' ? 'is-active' : ''}`}>
                            <input className="radio-hidden" type="radio" name="role" value="client" checked={role==='client'} onChange={() => setRole('client')} /> Client
                        </label>
                    </div>
                    {error && <div className="text-center text-dim" role="alert">{error}</div>}
                    <button className="btn-submit" type="submit" disabled={loading}>{loading ? 'Creating account\u2026' : 'Continue'}</button>
                    <div className="text-center text-muted">By signing up, you agree to our <a href="/terms" className="link-primary">Terms</a> and <a href="/privacy" className="link-primary">Privacy</a>.</div>
                </form>
                <div className="text-center mt-18">
                    Already have an account? <Link href="/login" className="link-primary">Login here</Link>.
                </div>
            </div>
        </main>
    );
}
