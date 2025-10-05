"use client";
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export default function RegisterPage() {
	const [role, setRole] = useState<'admin' | 'consumer' | ''>('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	return (
		<main className="main-centered">
			<div className="logo-text">RTS</div>
			<div className="card card-medium mt-16">
				<div className="title text-dark mb-18">Sign Up</div>
				<form
					onSubmit={async (e) => {
						e.preventDefault();
						setError(null);
						if (!supabaseUrl || !supabaseAnonKey) {
							console.warn('Supabase env not configured; mocking sign-up flow.');
							window.location.href = role === 'admin' ? '/admin' : '/dashboard/customer';
							return;
						}
						try {
							setLoading(true);
							const supabase = createClient();
							const { error } = await supabase.auth.signUp({ email, password });
							if (error) throw error;
							window.location.href = role === 'admin' ? '/admin' : '/dashboard/customer';
						} catch (err: any) {
							setError(err?.message ?? 'Sign up failed');
						} finally {
							setLoading(false);
						}
					}}
					className="form-vertical"
				>
					<div className="row-gap-16">
						<input className="input-text flex-1" required placeholder="First Name*" />
						<input className="input-text flex-1" required placeholder="Last Name*" />
					</div>
					<input className="input-text" required type="email" placeholder="Email*" value={email} onChange={e=>setEmail(e.target.value)} />
					<input className="input-text" required placeholder="Company Name (only for employees&HR)" />
					<input className="input-text" required placeholder="Username*" />
					<input className="input-text" required type="password" placeholder="Password*" value={password} onChange={e=>setPassword(e.target.value)} />
					<input className="input-text" required type="password" placeholder="Confirm Password*" />
								<div className="row-align">
									<span className="text-dark">Role*:</span>
						<label className={`pill ${role==='admin' ? 'is-active' : ''}`}>
							<input className="radio-hidden" type="radio" name="role" value="admin" required checked={role==='admin'} onChange={() => setRole('admin')} /> Admin
						</label>
						<label className={`pill ${role==='consumer' ? 'is-active' : ''}`}>
							<input className="radio-hidden" type="radio" name="role" value="consumer" checked={role==='consumer'} onChange={() => setRole('consumer')} /> Consumer
						</label>
					</div>
					{error && <div className="text-center text-dim" role="alert">{error}</div>}
					<button className="btn-submit" type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Continue'}</button>
					<div className="text-center text-muted">By signing up, you agree to our <a href="/terms" className="link-primary">Terms</a> and <a href="/privacy" className="link-primary">Privacy</a>.</div>
				</form>
				<div className="text-center mt-18">
					Already have an account? <Link href="/login" className="link-primary">Login here</Link>.
				</div>
			</div>
		</main>
	);
}
