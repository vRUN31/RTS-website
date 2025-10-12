"use client";
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ThemeToggle from '@/src/components/ThemeToggle.client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export default function ForgotPasswordPage() {
	const [emailSent, setEmailSent] = useState(false);
	const [email, setEmail] = useState('');
	const [error, setError] = useState<string | null>(null);
	return (
		<>
			<ThemeToggle />
			<main className="main-centered">
				<div className="logo-text">RTS</div>
			<div className="card card-medium mt-16">
				<div className="title text-dark mb-18">Reset your password</div>
				{!emailSent ? (
								<form
									onSubmit={async (e) => {
										e.preventDefault();
										setError(null);
										if (!supabaseUrl || !supabaseAnonKey) {
											console.warn('Supabase env not configured; mocking reset flow.');
											setEmailSent(true);
											return;
										}
										const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
										const redirectTo = `${siteUrl}/login`;
										const supabase = createClient();
										const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
										if (error) setError(error.message);
										else setEmailSent(true);
									}}
									className="form-vertical"
								>
									<p className="text-dim">
										Enter the email address associated with your account and we'll send you a link to reset your password.
									</p>
									<input className="input-text" required type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} />
									{error && <div className="text-center text-dim" role="alert">{error}</div>}
									<button className="btn-submit" type="submit">Send reset link</button>
						<div className="text-center">
							<Link href="/login" className="link-primary">Back to login</Link>
						</div>
					</form>
				) : (
					<div className="text-center">
						<p className="text-dim">If an account exists for that email, we've sent a reset link.</p>
						<p className="text-muted">Please check your inbox and follow the instructions to set a new password.</p>
						<div className="mt-16">
							<Link href="/login" className="link-primary">Return to login</Link>
						</div>
					</div>
				)}
			</div>
		</main>
		</>
	);
}
