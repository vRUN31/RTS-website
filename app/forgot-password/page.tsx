"use client";
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  function sendOtp() {
    if (!email) return;
    setOtpSent(true);
  }

  function verifyOtp() {
    if (otp.join('').length === 4) setOtpVerified(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otpVerified && newPass && newPass === confirmPass) {
      window.location.href = '/login';
    }
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 48, minHeight: '100vh' }}>
      <div className="logo-text">RTS</div>
      <div className="card" style={{ width: 480, maxWidth: '95vw', marginTop: 24 }}>
        <h3 style={{ textAlign: 'center', margin: 0 }}>Reset Password</h3>
        <div style={{ textAlign: 'center', color: '#666', marginBottom: 16 }}>Enter your registered email address to reset your password</div>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <input className="input-text" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="Email" style={{ flex: 1 }} />
            <button type="button" onClick={sendOtp} style={{ background: '#1a2b1a', color: '#fff', border: 'none', borderRadius: 12, padding: '0 24px', cursor: 'pointer' }}>Verify</button>
          </div>
          {otpSent && (
            <div>
              <div>Enter OTP:</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '12px 0' }}>
                {otp.map((d, i) => (
                  <input key={i} value={d} onChange={e=>{
                    const v = e.target.value.replace(/[^0-9]/g,'').slice(0,1);
                    setOtp(prev=> prev.map((x,idx)=> idx===i? v : x));
                  }} style={{ width: 50, height: 50, textAlign: 'center', fontSize: '1.5rem', borderRadius: 8, border: 'none', background: '#e3e3e3' }} />
                ))}
              </div>
              <button type="button" onClick={verifyOtp} style={{ background: '#1a2b1a', color: '#fff', border: 'none', borderRadius: 12, padding: '8px 16px', cursor: 'pointer' }}>Verify OTP</button>
            </div>
          )}
          {otpVerified && (
            <div>
              <div>New Password:</div>
              <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} required style={{ width: '100%', padding: '14px 18px', borderRadius: 12, background: '#e3e3e3', border: 'none' }} />
              <div style={{ marginTop: 8 }}>Confirm New Password:</div>
              <input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} required style={{ width: '100%', padding: '14px 18px', borderRadius: 12, background: '#e3e3e3', border: 'none' }} />
            </div>
          )}
          <button type="submit" disabled={!otpVerified || !newPass || newPass !== confirmPass} style={{ background: '#ff4d00', color: '#fff', border: 'none', borderRadius: '2rem', padding: '.8rem 0', fontSize: '1.3rem', cursor: 'pointer', marginTop: 10 }}>Reset Password</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>Remember your password? <Link href="/login" style={{ color: '#ff4d00' }}>Back to Login</Link></div>
      </div>
    </main>
  );
}



