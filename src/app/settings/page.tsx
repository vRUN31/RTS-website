"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ThemeToggle from '@/src/components/ThemeToggle.client';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <ThemeToggle />
      <div className="dashboard-container card">
        <h1 className="dashboard-header">Settings</h1>
        {loading && <p className="text-center">Loading...</p>}
        {!loading && !user && (
          <p className="text-center">Please <a className="link-primary" href="/login">login</a> to access settings.</p>
        )}
        {!loading && user && (
          <div className="col-gap-32 mt-18">
            <div className="panel">
              <div className="panel-title">Account</div>
              <p className="text-dim">Email: <strong>{user.email}</strong></p>
              <p className="text-muted">More settings coming soon (profile, notifications, preferences).</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
