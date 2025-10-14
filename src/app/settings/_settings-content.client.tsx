"use client";
import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ProfileSettings from './_profile-settings.client';
import NotificationSettings from './_notification-settings.client';
import AppearanceSettings from './_appearance-settings.client';
import AdminPricingSettings from './_admin-pricing-settings.client';
import HelpSupport from './_help-support.client';

type Section = 'profile' | 'notifications' | 'appearance' | 'pricing' | 'help';

export default function SettingsContent({
  user,
  profile,
  isAdmin,
  initialSettings,
  initialNotificationPrefs,
  initialSystemConfig,
}: {
  user: any;
  profile: any;
  isAdmin: boolean;
  initialSettings: any;
  initialNotificationPrefs: any;
  initialSystemConfig: any;
}) {
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const sections = [
    { id: 'profile' as Section, icon: '👤', label: 'Profile', description: 'Personal information' },
    { id: 'notifications' as Section, icon: '🔔', label: 'Notifications', description: 'Email & alerts' },
    { id: 'appearance' as Section, icon: '🎨', label: 'Appearance', description: 'Theme & display' },
    ...(isAdmin ? [{ id: 'pricing' as Section, icon: '💰', label: 'Pricing', description: 'Admin: Rates & costs' }] : []),
    { id: 'help' as Section, icon: '💬', label: 'Help & Support', description: 'Get assistance' },
  ];

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <div className="settings-header-content">
            <h1 className="settings-title">⚙️ Settings</h1>
            <p className="settings-subtitle">
              Manage your account preferences and configuration
            </p>
          </div>
          {saveStatus === 'saved' && (
            <div className="save-status success">
              <span className="status-icon">✓</span>
              Changes saved successfully
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="save-status error">
              <span className="status-icon">✗</span>
              Failed to save changes
            </div>
          )}
        </div>

        <div className="settings-layout">
          {/* Sidebar Navigation */}
          <aside className="settings-sidebar">
            <nav className="settings-nav">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="nav-icon">{section.icon}</span>
                  <div className="nav-content">
                    <div className="nav-label">{section.label}</div>
                    <div className="nav-description">{section.description}</div>
                  </div>
                </button>
              ))}
            </nav>

            <div className="sidebar-footer">
              <div className="user-info">
                <div className="user-avatar">
                  {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="user-details">
                  <div className="user-name">{profile?.name || 'User'}</div>
                  <div className="user-email">{user?.email}</div>
                  <div className="user-role">{isAdmin ? 'Admin' : 'Client'}</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <main className="settings-content">
            {activeSection === 'profile' && (
              <ProfileSettings
                user={user}
                profile={profile}
                initialSettings={initialSettings}
                onSaveStatus={setSaveStatus}
              />
            )}
            
            {activeSection === 'notifications' && (
              <NotificationSettings
                userId={user.id}
                initialPreferences={initialNotificationPrefs}
                onSaveStatus={setSaveStatus}
              />
            )}
            
            {activeSection === 'appearance' && (
              <AppearanceSettings
                userId={user.id}
                initialSettings={initialSettings}
                onSaveStatus={setSaveStatus}
              />
            )}
            
            {activeSection === 'pricing' && isAdmin && (
              <AdminPricingSettings
                userId={user.id}
                initialConfig={initialSystemConfig}
                onSaveStatus={setSaveStatus}
              />
            )}
            
            {activeSection === 'help' && (
              <HelpSupport user={user} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
