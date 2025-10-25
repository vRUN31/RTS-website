# Fix: Trucks Showing as Busy Even After Completing Trips

## Problem
Even though all shipments show as "delivered" and "✓ Completed" in the Recent Shipments table, the "Assign a Truck" modal shows trucks as "In Transit" and "On Active Trip", preventing new assignments.

## Root Cause
The truck status was not being automatically updated when:
1. A trip starts (shipment created/started)
2. A trip completes (shipment marked as delivered)
3. A trip is cancelled

This caused trucks to remain in their old status even after completing deliveries.

## Solution
Created an automatic database trigger that updates truck status based on shipment status changes:

- **Shipment starts** (`status: 'in_transit'`) → Truck status = `Running`
- **Shipment delivered** (`status: 'delivered'`) → Truck status = `Available`
- **Shipment cancelled** (`status: 'cancelled'`) → Truck status = `Available`

## How to Fix

### Step 1: Run the Database Migration

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy the entire content of this file: `supabase/migrations/2025-10-25-auto-update-truck-status.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)

### Step 2: Verify the Fix

After running the migration:

1. **Check truck statuses in database:**
   ```sql
   SELECT id, plate, display_code, status, status_updated_at, status_reason 
   FROM trucks 
   ORDER BY status_updated_at DESC;
   ```

2. **Check shipments:**
   ```sql
   SELECT id, truck_id, origin, destination, status, created_at 
   FROM shipments 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Refresh your admin dashboard** and try assigning trucks again

### Step 3: Test the Automatic Updates

1. Go to admin dashboard
2. Approve a booking and assign a truck
3. Check the truck status → Should change to "Running" when trip starts
4. Mark the shipment as "Delivered"
5. Check the truck status → Should change back to "Available"

## What the Migration Does

### 1. Creates Trigger Function
The `auto_update_truck_status()` function automatically:
- Sets truck to "Running" when shipment starts
- Sets truck to "Available" when shipment is delivered/cancelled
- Logs the reason for status change in `status_reason` field

### 2. Creates Database Trigger
The trigger `trigger_auto_update_truck_status` runs automatically whenever:
- A new shipment is created (INSERT)
- A shipment status is updated (UPDATE)

### 3. One-Time Fix
The migration includes a one-time UPDATE query that:
- Finds all trucks whose most recent shipment is delivered/cancelled
- Sets their status back to "Available"
- **Does NOT override manual statuses** like "Maintenance" or "Offline"

## Expected Results

### Before Fix:
- ❌ Truck shows "In Transit" even after delivery complete
- ❌ Cannot assign truck to new booking
- ❌ Admin sees "All Truck (9T) trucks are currently on active trips"

### After Fix:
- ✅ Truck automatically becomes "Available" when delivery completes
- ✅ Can assign truck to new bookings immediately
- ✅ Truck status updates automatically when trip starts/ends

## Files Modified

- **Created**: `supabase/migrations/2025-10-25-auto-update-truck-status.sql`
  - Database trigger for automatic truck status updates
  - One-time fix for existing completed trips

## Technical Details

### Trigger Logic:
```sql
-- When shipment starts
UPDATE trucks SET status = 'Running' WHERE id = shipment.truck_id;

-- When shipment delivered/cancelled
UPDATE trucks SET status = 'Available' WHERE id = shipment.truck_id;
```

### Safety Features:
- Only updates when `truck_id` is not null
- Preserves manual status changes (Maintenance, Offline)
- Logs status change reason in `status_reason` field
- Updates `status_updated_at` timestamp

## Troubleshooting

### Issue: Migration fails with "column status_updated_at does not exist"
**Solution**: Run this first:
```sql
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS status_reason TEXT;
```

### Issue: Trucks still showing as busy after migration
**Solution**: Manually reset truck status:
```sql
-- Check which trucks are still busy
SELECT t.id, t.plate, t.status, s.status as shipment_status
FROM trucks t
LEFT JOIN shipments s ON s.truck_id = t.id
WHERE t.status = 'Running'
ORDER BY s.created_at DESC;

-- Reset specific truck to Available
UPDATE trucks SET status = 'Available', status_reason = 'Manual reset' WHERE id = 'YOUR_TRUCK_ID';
```

### Issue: Need to manually update specific truck
**Solution**:
```sql
UPDATE trucks 
SET status = 'Available',
    status_updated_at = NOW(),
    status_reason = 'Manual reset after delivery completion'
WHERE plate = 'YOUR_TRUCK_PLATE';
```

## Future Enhancements

This migration sets up the foundation for:
1. **Real-time status tracking** - Trucks automatically update as trips progress
2. **Status history** - Track all status changes in `truck_status_history` table
3. **Smart assignment** - Only show truly available trucks in assignment modal
4. **Maintenance scheduling** - Prevent assignments during scheduled maintenance

## Support

If you encounter any issues:
1. Check the Supabase SQL Editor for error messages
2. Verify your database has the necessary columns
3. Check console logs for trigger execution
4. Ensure RLS policies allow truck status updates

---

**Migration created**: October 25, 2025  
**Status**: ✅ Ready to deploy  
**Impact**: Low risk - only affects truck status field
