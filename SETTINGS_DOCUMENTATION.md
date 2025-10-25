# Settings Section Documentation

## Overview
The settings section provides a comprehensive configuration interface for both client and admin users. It includes profile management, notification preferences, appearance customization, admin pricing controls, and help & support resources.

## Features Implemented

### 1. **Profile Settings** 👤
- **Personal Information Management**
  - Full name editing
  - Phone number
  - Company name
  - Emergency contact
  - Email display (read-only, verified badge)
  
- **Password Management**
  - Change password functionality
  - Password strength validation (minimum 6 characters)
  - Confirmation matching
  - Success/error feedback
  
- **Profile Picture** (Coming Soon)
  - Avatar placeholder with user initial
  - Upload functionality planned for future

### 2. **Notification Preferences** 🔔
- **Email Notifications**
  - Booking confirmations
  - Shipment status updates
  - Payment reminders
  - Weekly summary digest
  
- **In-App Notifications**
  - Enable/disable toggle
  - Sound effects control
  - Desktop notifications (browser push)
  - Master toggle with dependent controls
  
- **Notification Frequency**
  - Instant delivery
  - Hourly digest batching
  - Daily summary

### 3. **Appearance Settings** 🎨
- **Theme Mode** ✨
  - ☀️ Light mode
  - 🌙 Dark mode
  - 🌗 Auto mode (follows system preference)
  - Real-time preview
  - Persists in localStorage
  - Applies immediately across the app
  
- **Accent Color** (Coming Soon)
  - 6 preset color options
  - Custom color picker
  - Hex code input
  - Visual preview swatches
  
- **Font Size**
  - Small (0.875rem) - Compact
  - Medium (1rem) - Default
  - Large (1.125rem) - Accessibility
  
- **View Density**
  - Compact - More content
  - Comfortable - Balanced spacing

### 4. **Admin Pricing Settings** 💰
**Admin Only Section**

- **Operational Costs**
  - Fuel price per liter (₹)
  - Time buffer percentage for ETA calculations
  
- **Customer Pricing**
  - GST percentage
  - Toll percentage
  - Loading/unloading charges
  
- **Vehicle Rates Configuration**
  - Expandable cards for each vehicle type
  - Per-vehicle settings:
    - Base rate (₹/km)
    - Minimum charge (₹)
    - Fuel efficiency (km/L)
    - Driver cost per day (₹)
    - Maintenance cost per km (₹)
  - Pre-configured for 5 vehicle types:
    - Truck (3T, 6T, 9T)
    - Trailer (18T, 25T)

### 5. **Help & Support** 💬
- **Quick Resources**
  - User Guide (documentation)
  - Video Tutorials
  - FAQs section
  - Email support
  
- **Contact Support Form**
  - Subject field
  - Priority selection (Low/Normal/High/Critical)
  - Message textarea
  - Success confirmation
  
- **FAQ Accordion**
  - 5 common questions with answers
  - Expandable/collapsible design
  - Topics: Booking, Tracking, Payments, Pricing, Cancellations
  
- **Contact Information**
  - Email, Phone, Business Hours, Website
  - Clickable links
  - Grid layout for easy scanning
  
- **System Information**
  - Account email
  - Account ID (truncated)
  - Version number
  - Last login date

## UI/UX Improvements

### Design System
- **Consistent Color Palette**
  - Brand orange: `#ff4d00`
  - Success green: `#10b981`
  - Error red: `#ef4444`
  - Warning yellow: `#f59e0b`
  - Info blue: `#3b82f6`
  
- **Gradient Backgrounds**
  - Subtle 135deg gradients throughout
  - Different shades for cards, buttons, badges
  
- **Smooth Animations**
  - `fadeIn` - Page load
  - `slideDown` - Headers
  - `slideInLeft/Right` - Sidebar/content
  - All transitions: `0.3s ease`
  
- **Interactive Elements**
  - Hover states with transform effects
  - Focus states with shadow rings
  - Active state highlighting
  - Disabled state opacity

### Component Styling

#### Navigation Sidebar
- Sticky positioning
- Active state with gradient background
- Icon + label + description layout
- User info footer with avatar
- Role badge (Admin/Client)

#### Settings Cards
- Rounded corners (12px-16px)
- Border on hover (brand color)
- Shadow elevation on hover
- Consistent padding (2rem)
- Section title with brand color

#### Form Elements
- Rounded inputs (10px)
- Focus ring effect (4px shadow)
- Hover border color change
- Disabled state styling
- Help text below inputs

#### Toggle Switches
- Custom CSS toggle slider
- Smooth slide animation
- Brand color when active
- Shadow effects
- Disabled state

#### Buttons
- Primary: Gradient orange
- Secondary: Gray
- Large variant: Bigger padding
- Hover: Lift effect (translateY)
- Disabled: Opacity 0.6

### Dark Mode Support
- Complete dark theme for all components
- Custom color variables for dark mode
- Automatic switching based on system preference
- Manual override via theme selector
- Persists user preference in localStorage

### Responsive Design
- **Desktop (>1024px)**: 2-column grid, sticky sidebar
- **Tablet (768px-1024px)**: Single column, static sidebar
- **Mobile (<768px)**: Stacked layout, full-width buttons

## Database Schema

### `user_settings` Table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- phone (text)
- company_name (text)
- emergency_contact (text)
- theme ('light' | 'dark' | 'auto')
- accent_color (text, hex code)
- font_size ('small' | 'medium' | 'large')
- view_density ('compact' | 'comfortable')
- created_at, updated_at (timestamptz)
```

### `notification_preferences` Table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- email_booking_confirmation (boolean)
- email_shipment_updates (boolean)
- email_payment_reminders (boolean)
- email_weekly_summary (boolean)
- inapp_enabled (boolean)
- inapp_sound (boolean)
- inapp_desktop (boolean)
- notification_frequency ('instant' | 'hourly' | 'daily')
- created_at, updated_at (timestamptz)
```

### `system_config` Table (Admin Only)
```sql
- id (uuid, primary key)
- config_key (text, unique)
- config_value (jsonb)
- config_type ('pricing' | 'operational' | 'system')
- description (text)
- updated_by (uuid, foreign key to auth.users)
- created_at, updated_at (timestamptz)
```

## Security (RLS Policies)

### User Settings & Notification Preferences
- **Read**: Users can only read their own settings
- **Insert**: Users can only insert their own settings
- **Update**: Users can only update their own settings

### System Config
- **Read**: Only admins can read
- **Insert**: Only admins can insert
- **Update**: Only admins can update

## Setup Instructions

### 1. Run Database Migration
```bash
# In Supabase SQL Editor, run:
supabase/migrations/2025-10-25-settings-tables.sql
```

This creates:
- `user_settings` table
- `notification_preferences` table
- `system_config` table
- RLS policies
- Default system configuration values
- Indexes for performance
- Triggers for updated_at columns

### 2. Verify Tables Created
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_settings', 'notification_preferences', 'system_config');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_settings', 'notification_preferences', 'system_config');
```

### 3. Test Settings
1. Navigate to `/settings`
2. Try changing profile information → Click "Save Profile"
3. Toggle notification preferences → Click "Save Notification Preferences"
4. Change theme to Dark → Should apply immediately
5. Try other font sizes and view density options
6. If admin, check the Pricing section
7. Submit a support request in Help & Support

## Future Enhancements

### Phase 1 (Immediate)
- [ ] Implement profile picture upload to Supabase Storage
- [ ] Add email verification flow for email changes
- [ ] Implement actual support ticket system
- [ ] Add two-factor authentication settings

### Phase 2 (Short-term)
- [ ] Accent color theme customization (apply brand color dynamically)
- [ ] Language/locale selection (i18n)
- [ ] Timezone preferences
- [ ] Export user data (GDPR compliance)

### Phase 3 (Long-term)
- [ ] Advanced notification filters by shipment/client
- [ ] Notification scheduling (quiet hours)
- [ ] Custom dashboard layout preferences
- [ ] Keyboard shortcuts configuration
- [ ] Accessibility settings (high contrast, screen reader support)

## Troubleshooting

### Theme Not Applying
- Check browser localStorage: `localStorage.getItem('theme')`
- Verify `data-theme` attribute on `<html>` element
- Clear cache and reload
- Check console for errors

### Settings Not Saving
- Check RLS policies in Supabase
- Verify user is authenticated
- Check network tab for API errors
- Ensure `user_id` matches `auth.uid()`

### Admin Pricing Section Not Showing
- Verify user role in `profiles` table
- Check `is_admin()` function returns true
- Ensure RLS policies allow admin reads

### Dark Mode Styles Missing
- Ensure `settings.css` is imported
- Check CSS selectors use `[data-theme="dark"]`
- Verify CSS file is loaded in browser

## File Structure
```
src/app/settings/
├── page.tsx                          # Server component (auth guard)
├── settings.css                      # Comprehensive styling
├── _settings-content.client.tsx      # Main client component
├── _profile-settings.client.tsx      # Profile & password
├── _notification-settings.client.tsx # Email & in-app notifications
├── _appearance-settings.client.tsx   # Theme, colors, fonts
├── _admin-pricing-settings.client.tsx # Admin pricing config
└── _help-support.client.tsx          # Support & FAQs

src/app/
├── _theme-init.client.tsx            # Theme initialization on mount
└── layout.tsx                        # Root layout with theme init

supabase/migrations/
└── 2025-10-25-settings-tables.sql    # Database schema
```

## API Integration Points

### Supabase Client Operations

#### Profile Update
```typescript
await supabase
  .from('profiles')
  .update({ name })
  .eq('id', user.id);
```

#### Settings Upsert
```typescript
await supabase
  .from('user_settings')
  .upsert({
    user_id: userId,
    theme,
    font_size,
    view_density,
  }, { onConflict: 'user_id' });
```

#### Password Change
```typescript
await supabase.auth.updateUser({
  password: newPassword,
});
```

## Performance Considerations

- **Lazy Loading**: Each settings section is a separate component
- **Optimistic UI**: Theme changes apply immediately
- **Debouncing**: Consider for text inputs in future
- **Caching**: Settings cached in component state
- **Indexes**: Database indexes on `user_id` for fast lookups

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Focus management for modals
- Keyboard navigation support
- Color contrast ratios meet WCAG AA
- Screen reader friendly labels
- Disabled state clear indication

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox
- localStorage API
- matchMedia API for system theme
- CSS custom properties (variables)

---

**Version**: 1.0.0  
**Last Updated**: October 25, 2025  
**Maintainer**: RTS Development Team
