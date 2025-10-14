"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ProfileSettings({
  user,
  profile,
  initialSettings,
  onSaveStatus,
}: {
  user: any;
  profile: any;
  initialSettings: any;
  onSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}) {
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(initialSettings?.phone || '');
  const [companyName, setCompanyName] = useState(initialSettings?.company_name || '');
  const [emergencyContact, setEmergencyContact] = useState(initialSettings?.emergency_contact || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  async function handleSaveProfile() {
    setSaving(true);
    onSaveStatus('saving');
    setPasswordError('');

    try {
      const supabase = createClient();

      // Update profile name
      await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id);

      // Upsert user settings
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          phone,
          company_name: companyName,
          emergency_contact: emergencyContact,
        }, { onConflict: 'user_id' });

      onSaveStatus('saved');
      setTimeout(() => onSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Save profile error:', error);
      onSaveStatus('error');
      setTimeout(() => onSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword) {
      setPasswordError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setSaving(true);
    onSaveStatus('saving');
    setPasswordError('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      onSaveStatus('saved');
      setTimeout(() => onSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Change password error:', error);
      setPasswordError(error.message || 'Failed to change password');
      onSaveStatus('error');
      setTimeout(() => onSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2 className="section-title">👤 Profile Management</h2>
        <p className="section-description">
          Update your personal information and account details
        </p>
      </div>

      <div className="settings-grid">
        {/* Personal Information */}
        <div className="settings-card">
          <h3 className="card-title">Personal Information</h3>
          
          <div className="form-group">
            <label className="form-label">
              Full Name
              <span className="label-required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Email Address
              <span className="label-badge">Verified</span>
            </label>
            <input
              type="email"
              className="form-input"
              value={user.email}
              disabled
              title="Email cannot be changed"
            />
            <p className="form-help">Email address cannot be modified</p>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              className="form-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company or organization"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Emergency Contact</label>
            <input
              type="tel"
              className="form-input"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Emergency contact number"
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Change Password */}
        <div className="settings-card">
          <h3 className="card-title">Change Password</h3>
          <p className="card-description">
            Update your password to keep your account secure
          </p>

          {passwordError && (
            <div className="alert alert-error">
              {passwordError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              New Password
              <span className="label-required">*</span>
            </label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              minLength={6}
            />
            <p className="form-help">Minimum 6 characters</p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Confirm Password
              <span className="label-required">*</span>
            </label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={6}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleChangePassword}
            disabled={saving || !newPassword || !confirmPassword}
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        {/* Profile Picture */}
        <div className="settings-card">
          <h3 className="card-title">Profile Picture</h3>
          <p className="card-description">
            Upload a profile photo (coming soon)
          </p>

          <div className="profile-picture-preview">
            <div className="avatar-large">
              {name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>

          <button className="btn-secondary" disabled>
            Upload Photo (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}
