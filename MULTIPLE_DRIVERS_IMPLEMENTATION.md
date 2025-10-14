# Multiple Drivers Per Truck - Implementation Guide

## Overview
This feature allows admins to assign multiple drivers to a single truck, with one marked as the primary driver.

## Database Changes

### New Table: `truck_drivers`
Junction table linking trucks to drivers with these columns:
- `id` (UUID, Primary Key)
- `truck_id` (UUID, Foreign Key → trucks)
- `driver_id` (UUID, Foreign Key → drivers)
- `is_primary` (Boolean) - Marks the primary driver
- `assigned_at` (Timestamp)
- `created_at`, `updated_at`

### Migration File
Location: `/supabase/migrations/2025-10-15-add-truck-drivers-junction.sql`

**Run this SQL in Supabase SQL Editor:**
```bash
Run the migration file to create the junction table
```

## UI Changes

### Add Truck Form
- Multiple driver input sections
- "Add Another Driver" button
- Primary driver checkbox for each driver
- Remove driver button (X)

### Edit Truck Form
- Shows existing drivers
- Ability to add/remove drivers
- Mark/unmark primary driver

### Truck Table
- Displays all drivers for each truck
- Primary driver shown with ⭐ icon
- Driver count badge

## Implementation Steps

### Step 1: Run Database Migration
```sql
-- In Supabase SQL Editor, run:
supabase/migrations/2025-10-15-add-truck-drivers-junction.sql
```

### Step 2: Update Component Files
The ManageTrucks.client.tsx component has been updated to support:
- Multiple driver forms
- Primary driver selection
- Driver management (add/remove)
- Loading drivers from junction table

### Step 3: Test the Feature

1. **Add New Truck with Multiple Drivers:**
   - Go to Manage Trucks
   - Click "Add New Truck"
   - Fill truck details
   - Fill first driver (check "Primary Driver")
   - Click "Add Another Driver"
   - Fill second driver details
   - Click "Add Truck"

2. **Edit Existing Truck:**
   - Click "Edit" on any truck
   - Add new drivers or remove existing ones
   - Change primary driver by checking/unchecking
   - Click "Save Changes"

3. **View Truck List:**
   - See all drivers listed for each truck
   - Primary driver marked with ⭐
   - Driver count shown

## API Endpoints

### POST `/api/drivers`
Creates a new driver and returns the driver ID.

**Request:**
```json
{
  "name": "John Doe",
  "phone": "+91-9876543210",
  "email": "john@example.com",
  "license_no": "DL12AB1234"
}
```

**Response:**
```json
{
  "id": "uuid-here",
  "name": "John Doe"
}
```

## Data Flow

### Adding a Truck with Drivers:
1. Admin fills truck form + multiple driver forms
2. Frontend creates each driver via `/api/drivers`
3. Frontend creates truck with `truck_id`
4. Frontend creates entries in `truck_drivers` junction table
5. Frontend reloads truck list with all drivers

### Editing Drivers:
1. Frontend loads existing `truck_drivers` for the truck
2. Admin adds/removes driver forms
3. On save:
   - Create new drivers if needed
   - Insert new `truck_drivers` entries
   - Delete removed `truck_drivers` entries
   - Update `is_primary` flags
4. Reload truck list

## UI Components

### Driver Form Entry
```tsx
{
  name: string;
  phone: string;
  email: string;
  license_no: string;
  is_primary: boolean;
  existing_id?: string; // For edit mode
}
```

### Add Driver Button
Adds a new empty driver form to the array.

### Remove Driver Button
Removes a driver form from the array.

### Primary Driver Checkbox
Only one driver can be primary per truck.
Automatically unchecks other drivers when one is checked.

## Styling

New CSS classes added to `manage-trucks.css`:
- `.driver-forms-container` - Wrapper for all driver forms
- `.driver-form-entry` - Individual driver form
- `.driver-form-header` - Header with "Driver 1", "Driver 2", etc.
- `.primary-badge` - Badge for primary driver indicator
- `.btn-add-driver` - Green "Add Another Driver" button
- `.btn-remove-driver` - Red "Remove" button

## Database Queries

### Load Trucks with Drivers
```sql
SELECT 
  t.*,
  json_agg(
    json_build_object(
      'id', d.id,
      'name', d.name,
      'phone', d.phone,
      'license_no', d.license_no,
      'is_primary', td.is_primary
    )
  ) as drivers
FROM trucks t
LEFT JOIN truck_drivers td ON td.truck_id = t.id
LEFT JOIN drivers d ON d.id = td.driver_id
GROUP BY t.id;
```

### Insert Truck-Driver Relationship
```sql
INSERT INTO truck_drivers (truck_id, driver_id, is_primary)
VALUES ($1, $2, $3);
```

### Update Primary Driver
```sql
-- First, unset all primary flags for this truck
UPDATE truck_drivers
SET is_primary = false
WHERE truck_id = $1;

-- Then set the new primary
UPDATE truck_drivers
SET is_primary = true
WHERE truck_id = $1 AND driver_id = $2;
```

## Benefits

1. **Flexibility**: Multiple drivers can be assigned to one truck
2. **Rotation**: Easily switch between drivers without recreating records
3. **Tracking**: See all drivers assigned to each truck
4. **Primary Assignment**: Always know who the main driver is
5. **History**: Can track when drivers were assigned via `assigned_at`

## Future Enhancements

- Driver assignment history
- Driver shift scheduling
- Driver performance per truck
- Automatic primary driver selection based on availability
- Driver rotation schedules

## Troubleshooting

### Issue: Drivers not showing in truck list
**Solution**: Run the migration SQL to create the junction table

### Issue: Can't save multiple drivers
**Solution**: Check RLS policies allow INSERT on `truck_drivers` table

### Issue: Primary driver not updating
**Solution**: Check the trigger `ensure_single_primary_driver` is created

## Testing Checklist

- [ ] Migration SQL executed successfully
- [ ] Can add truck with 1 driver
- [ ] Can add truck with multiple drivers (2-5)
- [ ] Primary driver checkbox works correctly
- [ ] Can remove driver from form before saving
- [ ] Can edit truck and add more drivers
- [ ] Can edit truck and remove drivers
- [ ] Can change primary driver
- [ ] Truck list shows all drivers
- [ ] Primary driver marked with ⭐
- [ ] Search filters work with multiple drivers
- [ ] Driver count shows correctly
- [ ] No TypeScript errors
- [ ] No console errors

## Complete!

After running the migration and updating the component, admins can now manage multiple drivers per truck! 🚀
