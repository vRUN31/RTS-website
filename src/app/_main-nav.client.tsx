"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Role = 'admin' | 'client' | null;

export default function MainNav() {
  const [role, setRole] = useState<Role>(null);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (mounted) setRole(null); return; }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (mounted) setRole((profile?.role as Role) ?? null);
      } catch {
        if (mounted) setRole(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Preserve ?guest=true across routes where applicable
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setGuest(params.get('guest') === 'true');
    } catch { /* ignore */ }
  }, []);

  const dashboardHref = role === 'admin' ? '/admin' : (guest ? '/dashboard/customer?guest=true' : '/dashboard/customer');

  async function handleHomeClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  }

  return (
    <nav className="mainnav" aria-label="Primary">
      {role !== 'admin' && <a href="/" onClick={handleHomeClick} data-transition>Home</a>}
      <a href={dashboardHref} data-transition>Dashboard</a>
    {role === 'admin' && <a href="/admin/analytics" data-transition>Analytics</a>}
    {role === 'admin' && <a href="/admin/manage-trucks" data-transition>Manage Trucks</a>}
    </nav>
  );
}
