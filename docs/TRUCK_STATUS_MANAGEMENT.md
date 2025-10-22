# Advanced Truck Status Management System

## Overview
The Advanced Truck Status Management system provides a comprehensive interface for administrators to manage truck statuses with rich features including bulk updates, status history tracking, and real-time analytics.

## Features

### 1. Rich Status Model
Five distinct status types with visual indicators:
- **Running** 🚚 (Green) - Truck is actively on the road
- **Halt** ⏸️ (Yellow) - Truck is temporarily stopped
- **Maintenance** 🔧 (Red) - Truck is undergoing maintenance
- **Offline** ⚫ (Gray) - Truck is not in service
- **Available** ✅ (Blue) - Truck is ready for assignment

### 2. Status Summary Dashboard
- Total fleet count
- Distribution across all statuses with percentages
- Average duration in each status
- Real-time KPI cards with visual indicators

### 3. Bulk Status Updates
- Select multiple trucks using checkboxes
- Update status for all selected trucks at once
- Add optional reason for bulk changes
- Automatic history logging for all updates

### 4. Status History Tracking
- Complete audit trail for every status change
- Timeline view showing:
  - Previous status → New status transition
  - Timestamp of change
  - User who made the change
  - Reason for change
  - Additional notes and location
- Accessible via "History" button on each truck row

### 5. Advanced Filtering
- Search by truck code, plate number, or vehicle type
- Filter by current status
- Real-time search results

## Database Schema

### Migration: `2025-01-22-truck-status-history.sql`

#### New Table: `truck_status_history`
```sql
CREATE TABLE truck_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  previous_status TEXT,
  reason TEXT,
  notes TEXT,
  location TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Enhanced Trucks Table
New columns added:
- `status_updated_at` - Timestamp of last status change
- `status_updated_by` - UUID of user who changed status
- `status_reason` - Reason for current status
- `odometer_reading` - Current odometer value (km)
- `last_maintenance_date` - Date of last maintenance
- `next_maintenance_due` - Date when next maintenance is due

#### Automatic Trigger
```sql
CREATE TRIGGER truck_status_change_trigger
  BEFORE UPDATE ON trucks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_truck_status_change();
```

#### Helper Functions

**`get_truck_status_summary(days_back INTEGER)`**
Returns status distribution and average duration for the specified period:
```sql
SELECT 
  status,
  COUNT(*) as truck_count,
  AVG(duration_hours) as avg_duration_hours
FROM status_changes
GROUP BY status;
```

**`get_trucks_needing_maintenance()`**
Returns trucks that need maintenance based on:
- Overdue maintenance (next_maintenance_due < today)
- High odometer reading (> 90% of maintenance interval)

#### Analytics View
```sql
CREATE VIEW trucks_with_status_info AS
SELECT 
  t.*,
  COUNT(h.id) as status_change_count
FROM trucks t
LEFT JOIN truck_status_history h ON t.id = h.truck_id
GROUP BY t.id;
```

## How to Use

### Setup

1. **Run the Migration**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of `supabase/migrations/2025-01-22-truck-status-history.sql`
   - Execute the migration
   - Verify: Check if `truck_status_history` table appears in Table Editor

2. **Access the Feature**
   - Navigate to `/admin/truck-status`
   - Admin authentication required

### Managing Truck Status

#### Individual Status Change
1. Locate the truck in the table
2. Click "Change Status ▼" dropdown
3. Select new status from dropdown
4. Enter reason when prompted
5. Click OK to confirm

#### Bulk Status Update
1. Use checkboxes to select multiple trucks
   - Or click "Select All" to select all filtered trucks
2. Choose new status from "New Status" dropdown
3. (Optional) Enter reason in the reason field
4. Click "Update X Trucks" button
5. Confirm the action

#### Viewing Status History
1. Click the "📋 History" button on any truck row
2. Modal displays complete timeline of status changes
3. View details:
   - Previous status → New status transitions
   - Date/time of each change
   - Reason and notes
   - Location at time of change
   - User who made the change

### Filtering and Search

#### Search
- Type in search box to filter by:
  - Truck code (e.g., "TRK001")
  - Plate number
  - Vehicle type

#### Status Filter
- Use "Filter by Status" dropdown
- Select specific status or "All Statuses"
- Results update instantly

### Understanding Status Summary Cards

Each status card shows:
- **Icon** - Visual identifier
- **Count** - Number of trucks in that status
- **Percentage** - Portion of total fleet
- **Avg Duration** - Average time trucks spend in that status (last 30 days)

### Best Practices

1. **Always Provide Reasons**
   - Helps maintain clear audit trail
   - Useful for reporting and analysis
   - Examples: "Scheduled maintenance", "Driver break", "Breakdown on Highway 1"

2. **Regular Status Updates**
   - Update status as soon as truck state changes
   - Don't leave trucks in stale statuses

3. **Use Bulk Updates for Scheduled Actions**
   - Fleet-wide maintenance
   - End-of-day status updates
   - Emergency situations

4. **Review History for Patterns**
   - Identify trucks with frequent maintenance
   - Analyze status duration trends
   - Audit compliance requirements

## API Integration

### Programmatic Status Updates

```typescript
import { createClient } from '@/utils/supabase/client';

async function updateTruckStatus(
  truckId: string,
  newStatus: string,
  reason: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('trucks')
    .update({
      status: newStatus,
      status_updated_at: new Date().toISOString(),
      status_updated_by: user?.id,
      status_reason: reason,
    })
    .eq('id', truckId);

  if (error) throw error;
}
```

### Query Status History

```typescript
const { data: history } = await supabase
  .from('truck_status_history')
  .select('*')
  .eq('truck_id', truckId)
  .order('changed_at', { ascending: false })
  .limit(50);
```

### Get Status Summary

```typescript
const { data: summary } = await supabase
  .rpc('get_truck_status_summary', { days_back: 30 });
```

### Get Maintenance Alerts

```typescript
const { data: alerts } = await supabase
  .rpc('get_trucks_needing_maintenance');
```

## Security

### Row Level Security (RLS)
- `truck_status_history` table has admin-only policies
- Only authenticated admins can read/write status history
- Automatic user tracking via `changed_by` field

### Permissions
- Admin role required for all status management operations
- Clients cannot access status history
- Guest users have no access

## Troubleshooting

### Migration Errors
**Problem**: Migration fails to run
**Solution**: 
1. Check if tables already exist
2. Verify foreign key constraints (trucks and auth.users tables must exist)
3. Ensure user has CREATE permission

### Status Not Updating
**Problem**: Status change doesn't reflect
**Solution**:
1. Check browser console for errors
2. Verify RLS policies allow the operation
3. Ensure user is authenticated as admin

### History Not Showing
**Problem**: Status history modal is empty
**Solution**:
1. Check if trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'truck_status_change_trigger'`
2. Update a truck status to generate history
3. Verify RLS policies on truck_status_history table

### Performance Issues
**Problem**: Slow loading with many trucks
**Solution**:
1. Migration includes indexes on frequently queried columns
2. Consider pagination for fleets > 500 trucks
3. Use status filters to reduce result set

## Future Enhancements

Potential additions:
1. **Scheduled Status Changes** - Auto-transition at specific times
2. **Status Alerts** - Email/SMS when status changes
3. **Geofencing** - Auto-status based on location
4. **Mobile App** - Driver-initiated status updates
5. **Integration with GPS** - Real-time status from telematics
6. **Advanced Analytics** - ML-based anomaly detection
7. **Export Reports** - PDF/Excel reports of status history
8. **Custom Statuses** - Allow clients to define custom statuses
9. **Status Workflows** - Define allowed transitions (e.g., running → halt, not running → offline)
10. **Bulk Import** - CSV upload for status updates

## Component Files

- **Component**: `src/components/admin/TruckStatusManager.client.tsx`
- **Styles**: `src/components/admin/TruckStatusManager.css`
- **Page**: `src/app/admin/truck-status/page.tsx`
- **Migration**: `supabase/migrations/2025-01-22-truck-status-history.sql`

## Support

For issues or feature requests, contact the development team or check the project documentation.

---

**Version**: 1.0  
**Last Updated**: January 22, 2025  
**Author**: RTS Development Team
