# Guest User Trucks Showcase - Implementation Guide

## Overview
Guest users now see a dynamic trucks showcase instead of the live tracking map, displaying all available trucks with real-time updates.

## Changes Made

### 1. Database Migration (REQUIRED)
**File**: `supabase/migrations/2025-10-25-allow-public-trucks-read.sql`

This migration adds a public read policy to the `trucks` table, allowing unauthenticated (guest) users to view all trucks.

**⚠️ ACTION REQUIRED**: Run this migration in your Supabase SQL Editor:

```sql
-- Copy and paste this into Supabase SQL Editor and run it:

BEGIN;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "trucks public read" ON public.trucks;

-- Create policy to allow anyone (including unauthenticated users) to read trucks
CREATE POLICY "trucks public read" ON public.trucks
  FOR SELECT
  USING (true);

-- Enable realtime for trucks table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS trucks;

COMMIT;
```

### 2. Component Updates

#### TrucksShowcase Component
- **File**: `src/components/guest/TrucksShowcase.client.tsx`
- **Changes**: Updated to only query existing columns from trucks table:
  - `id`, `plate`, `display_code`, `vehicle_type`, `status`, `location`
  - Removed non-existent columns: `capacity_kg`, `model`, `year`
  
#### Customer Dashboard
- **File**: `src/app/dashboard/customer/page.tsx`
- **Changes**:
  1. Added dynamic import for `TrucksShowcase` component
  2. Conditional rendering based on `guestMode`:
     - Guests see: Trucks Showcase
     - Logged-in users see: Live Tracking Map
  3. Hidden for guest users:
     - KPI cards (Active Shipments, Pending Bookings, Revenue, etc.)
     - Shipments section
     - My Bookings section

### 3. What Guest Users See Now

✅ **Visible**:
- Welcome header
- 🚛 Our Fleet (Trucks Showcase with real-time updates)
- Place Order form
- Rate Calculator
- Support section
- Documents section
- About section

❌ **Hidden**:
- KPI cards dashboard
- Live Tracking map
- Shipments table
- My Bookings table

## Features

### Real-Time Updates
- Trucks showcase automatically updates when admin adds/edits/deletes trucks
- Uses Supabase Realtime subscriptions (INSERT, UPDATE, DELETE)

### Filter & Stats
- Filter tabs by vehicle type (All, Pickup, LCV, Truck 9T, Truck 16T, Trailer)
- Stats cards showing: Available, On Trip, Maintenance, Total Fleet
- Grouped display by vehicle category

### Truck Cards Display
Each truck card shows:
- 🚛 Truck icon (based on vehicle type)
- Status badge (Available, Running, Maintenance)
- Plate number / Display code
- Vehicle type
- Location (if available)
- Availability status with color-coded text

### Modern UI/UX
- Gradient backgrounds
- Smooth animations (fadeIn, slideIn, hover effects)
- Responsive design (mobile & desktop)
- Dark mode support
- Status-colored badges

## Testing Guide

### 1. Run the Migration
Open Supabase SQL Editor and execute the migration script above.

### 2. Test Guest User Experience
```
URL: http://localhost:3000/dashboard/customer?guest=true
```

**Expected Results**:
- ✅ See "🚛 Our Fleet" section with all 11 trucks
- ✅ Filter tabs working
- ✅ Stats cards showing correct counts
- ✅ All trucks visible (Available, Running, Maintenance)
- ❌ No KPI cards at top
- ❌ No Shipments section
- ❌ No My Bookings section

### 3. Test Logged-In User Experience
```
1. Login as a client
2. Visit: http://localhost:3000/dashboard/customer
```

**Expected Results**:
- ✅ See KPI cards (Active Shipments, etc.)
- ✅ See "Live Tracking" with map
- ✅ See Shipments section
- ✅ See My Bookings section

### 4. Test Real-Time Updates
```
1. Open guest dashboard: http://localhost:3000/dashboard/customer?guest=true
2. In another tab, login as admin
3. Go to Manage Trucks
4. Add/Edit/Delete a truck
5. Watch guest dashboard update automatically!
```

**Console Logs to Check**:
- `🚚 Loading trucks...`
- `✅ Trucks loaded successfully`
- `🚚 Setting up real-time trucks subscription`
- `✅ New truck added` / `✅ Truck updated` / `✅ Truck deleted`

## Troubleshooting

### Issue: "No trucks available"
**Cause**: RLS policy not applied or migration not run  
**Fix**: Run the migration SQL in Supabase SQL Editor

### Issue: Trucks not updating in real-time
**Cause**: Realtime not enabled for trucks table  
**Fix**: Check Supabase > Database > Replication and enable trucks table

### Issue: Column does not exist error
**Cause**: Trying to query non-existent columns  
**Fix**: Already fixed - component now only queries available columns

### Issue: Guest user sees logged-in sections
**Cause**: Not accessing with `?guest=true` parameter  
**Fix**: Ensure URL includes the guest parameter

## Database Schema

Current trucks table columns (as per schema.sql):
```sql
- id (uuid/text)
- plate (text)
- display_code (text)
- device_id (text)
- status (text)
- location (text)
- vehicle_type (text)
- last_lat (double precision)
- last_lng (double precision)
- speed (numeric)
- last_updated (timestamptz)
- driver_id (uuid)
- created_at (timestamptz)
```

## Next Steps

1. ✅ Run the migration in Supabase
2. ✅ Test guest user experience
3. ✅ Verify real-time updates work
4. ✅ Test on mobile devices
5. Consider adding:
   - Truck capacity data to database
   - Model/year information
   - Enhanced search/filter options
   - Booking directly from truck card

## Summary

Guest users now have an engaging, informative view of your entire fleet with real-time updates, encouraging them to sign up and book a truck. The UI is modern, responsive, and seamlessly integrates with the existing dashboard while maintaining clear separation between guest and authenticated user experiences.
