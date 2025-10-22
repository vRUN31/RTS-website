# Quick Setup Guide: Advanced Truck Status Management

## Prerequisites
- Supabase project set up
- Admin authentication working
- Trucks table exists in database

## Step 1: Run Database Migration

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the entire contents of `supabase/migrations/2025-01-22-truck-status-history.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`

**Expected Output:**
```
✓ CREATE TABLE truck_status_history
✓ ALTER TABLE trucks ADD COLUMN...
✓ CREATE FUNCTION log_truck_status_change()
✓ CREATE TRIGGER truck_status_change_trigger
✓ CREATE VIEW trucks_with_status_info
✓ CREATE FUNCTION get_truck_status_summary()
✓ CREATE FUNCTION get_trucks_needing_maintenance()
✓ RLS policies created
```

## Step 2: Verify Migration

1. Go to **Table Editor** in Supabase
2. Check that `truck_status_history` table appears
3. Click on `trucks` table
4. Verify new columns exist:
   - `status_updated_at`
   - `status_updated_by`
   - `status_reason`
   - `odometer_reading`
   - `last_maintenance_date`
   - `next_maintenance_due`

## Step 3: Test the Feature

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Login as an admin user

3. Navigate to: `http://localhost:3000/admin/truck-status`

4. You should see:
   - Status summary cards at the top
   - Bulk update section
   - Filterable truck table
   - Working status dropdowns
   - History buttons

## Step 4: Update a Status (Test)

1. Find any truck in the table
2. Click **"Change Status ▼"**
3. Select a different status (e.g., "Maintenance")
4. When prompted, enter a reason: "Testing status system"
5. Click OK

**Expected Result:**
- Status badge should update immediately
- "Last Updated" column shows current time

## Step 5: View Status History

1. Click **"📋 History"** button on the same truck
2. Modal should open showing:
   - Timeline of status changes
   - Your recent test change
   - Timestamp and reason displayed

**If history is empty:**
- Make another status change first
- The trigger logs changes only when status actually changes

## Step 6: Test Bulk Update

1. Check the checkboxes for 2-3 trucks
2. Selection count should update: "3 trucks selected"
3. Select new status from "New Status" dropdown
4. Enter reason: "Bulk test - scheduled maintenance"
5. Click **"Update 3 Trucks"** button
6. Confirm the action

**Expected Result:**
- All selected trucks update to new status
- History is created for each truck
- Success message appears

## Step 7: Test Filters

### Search
1. Type a truck code (e.g., "TRK001") in search box
2. Table should filter to matching trucks only

### Status Filter
1. Select "Running" from status filter dropdown
2. Only running trucks should appear
3. Summary cards still show total fleet stats

## Troubleshooting

### Error: "Failed to load trucks"
**Solution:**
- Check browser console for detailed error
- Verify RLS policies allow admin to read trucks table
- Ensure you're logged in as admin

### Error: "Cannot find function get_truck_status_summary"
**Solution:**
- Migration didn't complete successfully
- Re-run the migration SQL
- Check Supabase logs for errors

### History Modal Shows Empty
**Solution:**
- Status changes are only logged when status CHANGES
- Update a truck to a different status first
- Then view history

### Bulk Update Not Working
**Solution:**
- Ensure trucks are selected (checkboxes checked)
- Status must be selected from dropdown
- Check browser console for errors
- Verify you have admin role

## Next Steps

Once everything works:

1. **Add Navigation Link**
   - Add link to `/admin/truck-status` in your admin navigation menu
   - Use icon: 🚛 or 📊

2. **Customize Status Options**
   - Edit `statusOptions` array in `TruckStatusManager.client.tsx`
   - Add/remove/rename statuses as needed
   - Update colors and icons

3. **Set Up Maintenance Alerts**
   - Use `get_trucks_needing_maintenance()` function
   - Create scheduled task to check daily
   - Send email alerts to fleet manager

4. **Export Status Reports**
   - Add CSV export functionality
   - Include status history in reports
   - Create monthly status summaries

## Common Customizations

### Change Status Colors
Edit `statusOptions` in `TruckStatusManager.client.tsx`:
```typescript
const statusOptions = [
  { value: 'running', label: 'Running', icon: '🚚', color: '#10b981' }, // Green
  { value: 'halt', label: 'Halt', icon: '⏸️', color: '#f59e0b' },       // Orange
  // ... modify colors here
];
```

### Add Custom Status
1. Add to `statusOptions` array
2. Update database enum if using ENUM type
3. Test status transitions

### Modify History Limit
In `viewStatusHistory()` function:
```typescript
.limit(50)  // Change to 100, 200, etc.
```

## Performance Tips

1. **Large Fleets (> 500 trucks)**
   - Add pagination to truck table
   - Use status filter to reduce load
   - Consider server-side pagination

2. **History Storage**
   - History table grows over time
   - Consider archiving old records (> 1 year)
   - Add indexes if queries slow down

3. **Real-time Updates**
   - Use Supabase Realtime subscriptions
   - Auto-refresh when other admins make changes
   - Show live status updates

## Security Checklist

- ✅ RLS policies enabled on `truck_status_history`
- ✅ Admin-only access to status management page
- ✅ User authentication verified
- ✅ Audit trail captures all changes
- ✅ No direct SQL injection vectors

## Support Resources

- **Full Documentation**: `docs/TRUCK_STATUS_MANAGEMENT.md`
- **Migration File**: `supabase/migrations/2025-01-22-truck-status-history.sql`
- **Component**: `src/components/admin/TruckStatusManager.client.tsx`
- **Styles**: `src/components/admin/TruckStatusManager.css`
- **Page**: `src/app/admin/truck-status/page.tsx`

## Quick Reference

### Status Values
- `running` - Truck is on the road
- `halt` - Temporarily stopped
- `maintenance` - Under repair
- `offline` - Not in service
- `available` - Ready for assignment

### Key Functions
- `loadTrucks()` - Fetch all trucks
- `loadStatusSummary()` - Get status analytics
- `handleBulkStatusUpdate()` - Update multiple trucks
- `handleStatusChange()` - Update single truck
- `viewStatusHistory()` - Show history modal

### Database Functions
- `get_truck_status_summary(days_back)` - Status analytics
- `get_trucks_needing_maintenance()` - Maintenance alerts

---

**Ready to Go!** 🚀

Your Advanced Truck Status Management system is now ready to use. Start by logging in as an admin and navigating to `/admin/truck-status`.
