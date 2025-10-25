"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AppearanceSettings({
  userId,
  initialSettings,
  onSaveStatus,
}: {
  userId: string;
  initialSettings: any;
  onSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}) {
  const [theme, setTheme] = useState(initialSettings?.theme || 'light');
  const [accentColor, setAccentColor] = useState(initialSettings?.accent_color || '#ff4d00');
  const [fontSize, setFontSize] = useState(initialSettings?.font_size || 'medium');
  const [viewDensity, setViewDensity] = useState(initialSettings?.view_density || 'comfortable');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Apply theme on mount and when it changes
    applyTheme(theme);
    
    // Listen for system theme changes in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('auto');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  function applyTheme(themeValue: string) {
    if (themeValue === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else if (themeValue === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    } else {
      // Auto mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      localStorage.setItem('theme', 'auto');
    }
  }

  useEffect(() => {
    // Apply font size
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    // Apply view density
    document.documentElement.setAttribute('data-density', viewDensity);
  }, [viewDensity]);

  async function handleSave() {
    setSaving(true);
    onSaveStatus('saving');

    try {
      const supabase = createClient();

      await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          theme,
          accent_color: accentColor,
          font_size: fontSize,
          view_density: viewDensity,
        }, { onConflict: 'user_id' });

      onSaveStatus('saved');
      setTimeout(() => onSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Save appearance settings error:', error);
      onSaveStatus('error');
      setTimeout(() => onSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }

  const colorPresets = [
    { name: 'RTS Orange', value: '#ff4d00' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
  ];

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2 className="section-title">🎨 Appearance Settings</h2>
        <p className="section-description">
          Customize how the application looks and feels
        </p>
      </div>

      <div className="settings-grid">
        {/* Theme Selection */}
        <div className="settings-card">
          <h3 className="card-title">🌓 Theme Mode</h3>
          <p className="card-description">
            Choose your preferred color theme
          </p>

          <div className="theme-selector">
            <div
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <div className="theme-preview light-preview">
                <div className="preview-header"></div>
                <div className="preview-body">
                  <div className="preview-box"></div>
                  <div className="preview-box"></div>
                </div>
              </div>
              <div className="theme-label">
                <span className="theme-icon">☀️</span>
                Light
              </div>
            </div>

            <div
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <div className="theme-preview dark-preview">
                <div className="preview-header"></div>
                <div className="preview-body">
                  <div className="preview-box"></div>
                  <div className="preview-box"></div>
                </div>
              </div>
              <div className="theme-label">
                <span className="theme-icon">🌙</span>
                Dark
              </div>
            </div>

            <div
              className={`theme-option ${theme === 'auto' ? 'active' : ''}`}
              onClick={() => setTheme('auto')}
            >
              <div className="theme-preview auto-preview">
                <div className="preview-header"></div>
                <div className="preview-body">
                  <div className="preview-box"></div>
                  <div className="preview-box"></div>
                </div>
              </div>
              <div className="theme-label">
                <span className="theme-icon">🌗</span>
                Auto
              </div>
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div className="settings-card">
          <h3 className="card-title">🎨 Accent Color</h3>
          <p className="card-description">
            Choose a primary accent color (Coming Soon)
          </p>

          <div className="color-grid">
            {colorPresets.map((preset) => (
              <button
                key={preset.value}
                className={`color-option ${accentColor === preset.value ? 'active' : ''}`}
                style={{ backgroundColor: preset.value }}
                onClick={() => setAccentColor(preset.value)}
                title={preset.name}
              >
                {accentColor === preset.value && <span className="check-icon">✓</span>}
              </button>
            ))}
          </div>

          <div className="form-group mt-16">
            <label className="form-label">Custom Color</label>
            <div className="color-picker-group">
              <input
                type="color"
                className="color-picker"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#ff4d00"
              />
            </div>
          </div>

          <div className="alert alert-info mt-16">
            <span className="alert-icon">ℹ️</span>
            Accent color customization will be fully implemented in a future update
          </div>
        </div>

        {/* Font Size */}
        <div className="settings-card">
          <h3 className="card-title">🔤 Font Size</h3>
          <p className="card-description">
            Adjust text size for better readability
          </p>

          <div className="radio-list">
            <label className="radio-item">
              <input
                type="radio"
                name="fontSize"
                value="small"
                checked={fontSize === 'small'}
                onChange={(e) => setFontSize(e.target.value)}
              />
              <div className="radio-content">
                <div className="radio-label" style={{ fontSize: '0.875rem' }}>Small</div>
                <div className="radio-description">Compact text for more content</div>
              </div>
            </label>

            <label className="radio-item">
              <input
                type="radio"
                name="fontSize"
                value="medium"
                checked={fontSize === 'medium'}
                onChange={(e) => setFontSize(e.target.value)}
              />
              <div className="radio-content">
                <div className="radio-label" style={{ fontSize: '1rem' }}>Medium</div>
                <div className="radio-description">Default comfortable size</div>
              </div>
            </label>

            <label className="radio-item">
              <input
                type="radio"
                name="fontSize"
                value="large"
                checked={fontSize === 'large'}
                onChange={(e) => setFontSize(e.target.value)}
              />
              <div className="radio-content">
                <div className="radio-label" style={{ fontSize: '1.125rem' }}>Large</div>
                <div className="radio-description">Larger text for easier reading</div>
              </div>
            </label>
          </div>
        </div>

        {/* View Density */}
        <div className="settings-card">
          <h3 className="card-title">📐 View Density</h3>
          <p className="card-description">
            Control spacing and padding in the interface
          </p>

          <div className="radio-list">
            <label className="radio-item">
              <input
                type="radio"
                name="density"
                value="compact"
                checked={viewDensity === 'compact'}
                onChange={(e) => setViewDensity(e.target.value)}
              />
              <div className="radio-content">
                <div className="radio-label">Compact</div>
                <div className="radio-description">
                  More content visible at once with tighter spacing
                </div>
              </div>
            </label>

            <label className="radio-item">
              <input
                type="radio"
                name="density"
                value="comfortable"
                checked={viewDensity === 'comfortable'}
                onChange={(e) => setViewDensity(e.target.value)}
              />
              <div className="radio-content">
                <div className="radio-label">Comfortable</div>
                <div className="radio-description">
                  Balanced spacing for optimal readability
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
          {saving ? 'Saving...' : 'Save Appearance Settings'}
        </button>
      </div>
    </div>
  );
}
