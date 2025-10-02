"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [role, setRole] = useState<'admin' | 'customer'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = '/dashboard/customer';
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 48, minHeight: '100vh' }}>
      <div className="logo-text">RTS</div>
      <div className="card" style={{ background: 'linear-gradient(120deg, #f6f6f6 80%, #e3e3e3 100%)', width: 440, maxWidth: '95vw' }}>
        <h4 style={{ fontSize: '2.1rem', textAlign: 'center', margin: 0 }}>Login</h4>
        <h4 style={{ fontSize: '1.05rem', textAlign: 'center', margin: '8px 0 24px 0', color: '#666' }}>{role === 'admin' ? 'Login for administrators and staff' : 'Login for customers and users'}</h4>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '10px 0' }}>
            <label style={{ background: role==='admin'? '#e3e3e3' : '#fff', border: role==='admin' ? '2px solid #ff4d00' : '1.5px solid #ccc', borderRadius: 16, padding: '7px 22px', cursor: 'pointer', color: role==='admin' ? '#ff4d00' : '#222' }}>
              <input type="radio" name="role" value="admin" checked={role==='admin'} onChange={() => setRole('admin')} style={{ display: 'none' }} />
              Admin
            </label>
            <label style={{ background: role==='customer'? '#e3e3e3' : '#fff', border: role==='customer' ? '2px solid #ff4d00' : '1.5px solid #ccc', borderRadius: 16, padding: '7px 22px', cursor: 'pointer', color: role==='customer' ? '#ff4d00' : '#222' }}>
              <input type="radio" name="role" value="customer" checked={role==='customer'} onChange={() => setRole('customer')} style={{ display: 'none' }} />
              Customer
            </label>
          </div>
          <input className="input-text" type="email" placeholder="Email" required value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input-text" type="password" placeholder="Password" required value={password} onChange={e=>setPassword(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666' }}>
              <input type="checkbox" /> Remember Me
            </label>
            <Link href="/forgot-password" style={{ color: '#ff4d00', textDecoration: 'none' }}>Forgot Password?</Link>
          </div>
          <button className="btn-submit" type="submit">Continue</button>
          <div style={{ textAlign: 'center', color: '#666', marginTop: 8 }}>
            Don't have an account? <Link href="/register" style={{ color: '#ff4d00' }}>Sign Up</Link>
          </div>
        </form>
      </div>
    </main>
  );
}



