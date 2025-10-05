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

  const isAdmin = role === 'admin';

  const dashboardHref = isAdmin ? '/admin' : (guest ? '/dashboard/customer?guest=true' : '/dashboard/customer');

  return (
    <nav className="mainnav" aria-label="Primary">
      <a href="/contracts" data-transition>Contracts</a>
      <a href={dashboardHref} data-transition>Dashboard</a>
      {isAdmin && <a href="/admin" data-transition>Admin</a>}
    </nav>
  );
}
