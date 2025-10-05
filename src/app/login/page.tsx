"use client";
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export default function LoginPage() {
	const [role, setRole] = useState<'admin' | 'customer'>('admin');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		// If Supabase is not configured, fallback to demo redirect
		if (!supabaseUrl || !supabaseAnonKey) {
			console.warn('Supabase env not configured; skipping real auth.');
			window.location.href = role === 'admin' ? '/admin' : '/dashboard/customer';
			return;
		}
		try {
			setLoading(true);
			const supabase = createClient();
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) throw error;
			window.location.href = role === 'admin' ? '/admin' : '/dashboard/customer';
		} catch (err: any) {
			setError(err?.message ?? 'Login failed');
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="main-centered">
			<div className="logo-text">RTS</div>
			<div className="card card-gradient card-compact">
				<h4 className="title">Login</h4>
				<h4 className="subtitle">{role === 'admin' ? 'Login for administrators and staff' : 'Login for customers and users'}</h4>
				<form onSubmit={onSubmit} className="form-vertical">
					<div className="row-center">
						<label className={`pill ${role==='admin' ? 'is-active' : ''}`}>
							<input className="radio-hidden" type="radio" name="role" value="admin" checked={role==='admin'} onChange={() => setRole('admin')} />
							Admin
						</label>
						<label className={`pill ${role==='customer' ? 'is-active' : ''}`}>
							<input className="radio-hidden" type="radio" name="role" value="customer" checked={role==='customer'} onChange={() => setRole('customer')} />
							Customer
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
