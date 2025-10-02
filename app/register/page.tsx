"use client";
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 48, minHeight: '100vh' }}>
      <div className="logo-text">RTS</div>
      <div className="card" style={{ width: 480, maxWidth: '95vw', marginTop: 24 }}>
        <div style={{ fontSize: '2.0rem', textAlign: 'center', marginBottom: 18, color: '#111' }}>Sign Up</div>
        <form action="/dashboard/customer" method="GET" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <input className="input-text" required placeholder="First Name*" style={{ flex: 1 }} />
            <input className="input-text" required placeholder="Last Name*" style={{ flex: 1 }} />
          </div>
          <input className="input-text" required type="email" placeholder="Email*" />
          <input className="input-text" required placeholder="Company Name (only for employees&HR)" />
          <input className="input-text" required placeholder="Username*" />
          <input className="input-text" required type="password" placeholder="Password*" />
          <input className="input-text" required type="password" placeholder="Confirm Password*" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#222' }}>Role*:</span>
            <label style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 16, padding: '4px 18px', cursor: 'pointer' }}>
              <input type="radio" name="role" value="admin" required style={{ display: 'none' }} /> Admin
            </label>
            <label style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 16, padding: '4px 18px', cursor: 'pointer' }}>
              <input type="radio" name="role" value="consumer" style={{ display: 'none' }} /> Consumer
            </label>
          </div>
          <button className="btn-submit" type="submit">Continue</button>
          <div style={{ textAlign: 'center', color: '#888' }}>By signing up, you agree to our <a href="/terms" style={{ color: '#ff4d00' }}>Terms</a> and <a href="/privacy" style={{ color: '#ff4d00' }}>Privacy</a>.</div>
        </form>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          Already have an account? <Link href="/login" style={{ color: '#ff4d00' }}>Login here</Link>.
        </div>
      </div>
    </main>
  );
}



