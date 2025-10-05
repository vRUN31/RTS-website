import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function SettingsPage() {
  const supa = createClient(cookies() as any);
  const { data: { user } } = await supa.auth.getUser();

  return (
    <div className="dashboard-container card">
      <h1 className="dashboard-header">Settings</h1>
      {!user && (
        <p className="text-center">Please <a className="link-primary" href="/login">login</a> to access settings.</p>
      )}
      {user && (
        <div className="col-gap-32 mt-18">
          <div className="panel">
            <div className="panel-title">Account</div>
            <p className="text-dim">Email: <strong>{user.email}</strong></p>
            <p className="text-muted">More settings coming soon (profile, notifications, preferences).</p>
          </div>
        </div>
      )}
    </div>
  );
}
