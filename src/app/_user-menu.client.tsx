"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type Profile = { id: string; role: 'admin' | 'client' | null };

export default function UserMenu() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guest, setGuest] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(user?.email ?? null);
      if (user?.id) {
        const { data } = await supabase.from('profiles').select('id, role').eq('id', user.id).maybeSingle();
        if (!mounted) return;
        if (data) setProfile({ id: data.id, role: (data as any).role });
      }
    })();
    return () => { mounted = false; };
  }, [supabase]);

  // Detect guest mode from URL query (?guest=true)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setGuest(params.get('guest') === 'true');
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  if (!email) {
    if (guest) {
      return (
        <div className="user-menu user-guest" ref={menuRef}>
          <button className="user-avatar guest" aria-haspopup="menu" onClick={() => setOpen((v) => !v)}>
            <span className="avatar-circle" aria-hidden>G</span>
            <span className="email">Guest</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open && (
            <div className="user-dropdown" role="menu">
              <a className="dropdown-item" href="/login" role="menuitem">Login</a>
              <a className="dropdown-item" href="/register" role="menuitem">Sign up</a>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="user-menu">
        <a className="btn-login" href="/login">Login</a>
        <a className="btn-signup" href="/register">Sign up</a>
      </div>
    );
  }

  // Show styled avatar+email button and dropdown for real users only
  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-avatar" aria-haspopup="menu" onClick={() => setOpen((v) => !v)}>
        <span className="avatar-circle" aria-hidden>{email[0]?.toUpperCase() ?? 'U'}</span>
        <span className="email">{email}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="user-dropdown" role="menu">
          {profile?.role === 'admin' ? (
            <>
              <a className="dropdown-item" href="/admin" role="menuitem">Admin Dashboard</a>
              <a className="dropdown-item" href="/contracts" role="menuitem">Contracts</a>
              <a className="dropdown-item" href="/settings" role="menuitem">Settings</a>
            </>
          ) : profile?.role === 'client' ? (
            <>
              <a className="dropdown-item" href="/dashboard/customer" role="menuitem">My Dashboard</a>
              <a className="dropdown-item" href="/bookings" role="menuitem">My Bookings</a>
              <a className="dropdown-item" href="/settings" role="menuitem">Settings</a>
            </>
          ) : (
            <>
              <a className="dropdown-item" href="/settings" role="menuitem">Settings</a>
            </>
          )}
          <button className="dropdown-item danger" role="menuitem" onClick={async () => {
            try {
              // Sign out from Supabase backend
              await supabase.auth.signOut();
              
              // Clear local state immediately to prevent UI inconsistency
              setEmail(null);
              setProfile(null);
              setOpen(false);
              
              // Force redirect to home page
              window.location.href = '/';
            } catch (error) {
              console.error('Logout error:', error);
              // Even if logout fails, clear local state and redirect
              setEmail(null);
              setProfile(null);
              setOpen(false);
              window.location.href = '/';
            }
          }}>Logout</button>
        </div>
      )}
    </div>
  );
}
