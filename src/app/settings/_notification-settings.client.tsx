"use client";
import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function NotificationSettings({
  userId,
  initialPreferences,
  onSaveStatus,
}: {
  userId: string;
  initialPreferences: any;
  onSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}) {
  const [emailBooking, setEmailBooking] = useState(initialPreferences?.email_booking_confirmation ?? true);
  const [emailShipment, setEmailShipment] = useState(initialPreferences?.email_shipment_updates ?? true);
  const [emailPayment, setEmailPayment] = useState(initialPreferences?.email_payment_reminders ?? true);
  const [emailWeekly, setEmailWeekly] = useState(initialPreferences?.email_weekly_summary ?? false);
  
  const [inappEnabled, setInappEnabled] = useState(initialPreferences?.inapp_enabled ?? true);
  const [inappSound, setInappSound] = useState(initialPreferences?.inapp_sound ?? true);
  const [inappDesktop, setInappDesktop] = useState(initialPreferences?.inapp_desktop ?? false);
  
  const [frequency, setFrequency] = useState(initialPreferences?.notification_frequency || 'instant');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    onSaveStatus('saving');

    try {
      const supabase = createClient();

      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          email_booking_confirmation: emailBooking,
          email_shipment_updates: emailShipment,
          email_payment_reminders: emailPayment,
          email_weekly_summary: emailWeekly,
          inapp_enabled: inappEnabled,
          inapp_sound: inappSound,
          inapp_desktop: inappDesktop,
          notification_frequency: frequency,
        }, { onConflict: 'user_id' });

      onSaveStatus('saved');
      setTimeout(() => onSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Save notification preferences error:', error);
      onSaveStatus('error');
      setTimeout(() => onSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2 className="section-title">🔔 Notification Preferences</h2>
        <p className="section-description">
          Control how and when you receive notifications
        </p>
      </div>

      <div className="settings-grid">
        {/* Email Notifications */}
        <div className="settings-card">
          <h3 className="card-title">📧 Email Notifications</h3>
          <p className="card-description">
            Choose which emails you want to receive
          </p>

          <div className="toggle-list">
            <div className="toggle-item">
              <div className="toggle-info">
                <div className="toggle-label">Booking Confirmations</div>
                <div className="toggle-description">
                  Get notified when bookings are confirmed
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={emailBooking}
                  onChange={(e) => setEmailBooking(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <div className="toggle-label">Shipment Updates</div>
                <div className="toggle-description">
                  Status updates for your shipments
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={emailShipment}
                  onChange={(e) => setEmailShipment(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <div className="toggle-label">Payment Reminders</div>
                <div className="toggle-description">
                  Reminders for pending payments
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={emailPayment}
                  onChange={(e) => setEmailPayment(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <div className="toggle-label">Weekly Summary</div>
                <div className="toggle-description">
                  Weekly digest of your activity
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={emailWeekly}
                  onChange={(e) => setEmailWeekly(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="settings-card">
          <h3 className="card-title">🔔 In-App Notifications</h3>
          <p className="card-description">
            Manage notifications within the app
          </p>

          <div className="toggle-list">
            <div className="toggle-item">
              <div className="toggle-info">
                <div className="toggle-label">Enable In-App Notifications</div>
                <div className="toggle-description">
                  Show notifications in the application
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={inappEnabled}
                  onChange={(e) => setInappEnabled(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <div className="toggle-label">Sound Effects</div>
                <div className="toggle-description">
                  Play sound for new notifications
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={inappSound}
                  onChange={(e) => setInappSound(e.target.checked)}
                  disabled={!inappEnabled}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <div className="toggle-label">Desktop Notifications</div>
                <div className="toggle-description">
                  Browser notifications even when tab is closed
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={inappDesktop}
                  onChange={(e) => setInappDesktop(e.target.checked)}
                  disabled={!inappEnabled}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Frequency */}
        <div className="settings-card">
          <h3 className="card-title">⏱️ Notification Frequency</h3>
          <p className="card-description">
            How often should we send notifications?
          </p>

          <div className="radio-list">
            <label className="radio-item">
              <input
                type="radio"
                name="frequency"
                value="instant"
                checked={frequency === 'instant'}
                onChange={(e) => setFrequency(e.target.value)}
              />
              <div className="radio-content">
                <div className="radio-label">Instant</div>
                <div className="radio-description">
                  Receive notifications immediately as they happen
                </div>
              </div>
            </label>

            <label className="radio-item">
              <input
                type="radio"
                name="frequency"
                value="hourly"
                checked={frequency === 'hourly'}
                onChange={(e) => setFrequency(e.target.value)}
              />
              <div className="radio-content">
                <div className="radio-label">Hourly Digest</div>
                <div className="radio-description">
                  Batch notifications and send once per hour
                </div>
              </div>
            </label>

            <label className="radio-item">
              <input
                type="radio"
                name="frequency"
                value="daily"
                checked={frequency === 'daily'}
                onChange={(e) => setFrequency(e.target.value)}
              />
              <div className="radio-content">
                <div className="radio-label">Daily Summary</div>
                <div className="radio-description">
                  One summary notification per day
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="btn-primary btn-large"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Notification Preferences'}
        </button>
      </div>
    </div>
  );
}
