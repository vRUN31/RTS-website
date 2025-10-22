# Developer Quick Reference - Vehicle Recommendation System

## Quick Start

### Import the Component
```tsx
import VehicleRecommendation from '@/src/components/booking/VehicleRecommendation.client';
```

### Basic Usage
```tsx
<VehicleRecommendation 
  weight={7} // MT
  sourceCity="Mumbai"
  destCity="Delhi"
  onVehicleSelect={(vehicleType) => console.log(vehicleType)}
  selectedVehicle="Truck (9T)"
/>
```

---

## Props API Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `weight` | `number` | ✅ | Cargo weight in Metric Tons (MT) |
| `sourceCity` | `string` | ✅ | Origin city name |
| `destCity` | `string` | ✅ | Destination city name |
| `material` | `string` | ❌ | Optional material type for future enhancements |
| `onVehicleSelect` | `(type: string) => void` | ✅ | Callback when user selects a vehicle |
| `selectedVehicle` | `string` | ❌ | Currently selected vehicle type |

---

## Vehicle Specifications

```typescript
const VEHICLE_SPECS = {
  'Pickup (1.5T)': {
    maxWeight: 1.5,      // MT
    minWeight: 0,        // MT
    pricePerKm: 12,      // INR
    icon: '🚐'
  },
  'LCV (3.5T)': {
    maxWeight: 3.5,
    minWeight: 1.5,
    pricePerKm: 18,
    icon: '🚙'
  },
  'Truck (9T)': {
    maxWeight: 9,
    minWeight: 3.5,
    pricePerKm: 25,
    icon: '🚚'
  },
  'Truck (16T)': {
    maxWeight: 16,
    minWeight: 9,
    pricePerKm: 35,
    icon: '🚛'
  },
  'Trailer (25T)': {
    maxWeight: 25,
    minWeight: 16,
    pricePerKm: 45,
    icon: '🚜'
  }
}
```

---

## Validation Status Types

```typescript
type ValidationStatus = {
  status: 'optimal' | 'near-capacity' | 'underutilized' | 'overweight';
  message: string;
  color: string;     // Hex color code
  bgColor: string;   // Hex background color
};
```

### Status Conditions

| Status | Condition | Color | Action |
|--------|-----------|-------|--------|
| **Optimal** | 30% ≤ utilization ≤ 90% | 🟢 Green | ✅ Recommend |
| **Under-Utilized** | utilization < 30% | 🔵 Blue | 💡 Suggest smaller |
| **Near Capacity** | 90% < utilization ≤ 100% | 🟠 Orange | ⚡ Caution |
| **Overweight** | utilization > 100% | 🔴 Red | ⚠️ Block/warn |

---

## Lane Availability Interface

```typescript
interface LaneAvailability {
  hasActiveContract: boolean;      // Contract exists for this route?
  availableTrucks: number;         // Free trucks count
  preferredVehicles: string[];     // Top 3 available vehicle types
  estimatedDeliveryDays: number;   // Days to deliver
}
```

---

## Database Queries Used

### 1. Check Active Contracts
```sql
SELECT id, lanes 
FROM contracts
WHERE start_at <= CURRENT_DATE
  AND end_at >= CURRENT_DATE
  AND lanes IS NOT NULL
```

### 2. Find Available Trucks
```sql
SELECT t.id, t.vehicle_type, t.status
FROM trucks t
LEFT JOIN shipments s ON t.id = s.truck_id
WHERE t.status != 'maintenance'
  AND (s.status IN ('delivered', 'cancelled') OR s.truck_id IS NULL)
```

### 3. Get Active Shipments
```sql
SELECT truck_id
FROM shipments
WHERE status NOT IN ('delivered', 'cancelled')
  AND truck_id IS NOT NULL
```

---

## Key Functions

### `getRecommendedVehicles(weight: number): VehicleType[]`
**Purpose**: Calculate suitable vehicles based on cargo weight

**Algorithm**:
1. Check each vehicle's capacity range
2. Apply 90% safety buffer (effective capacity)
3. Filter vehicles where: `minWeight ≤ weight ≤ effectiveCapacity`
4. Sort by capacity (smallest suitable first)
5. Fallback: If no suitable vehicle, recommend smallest that can handle it

**Example**:
```typescript
getRecommendedVehicles(7) 
// Returns: ['Truck (9T)', 'Truck (16T)', 'Trailer (25T)']
```

---

### `getValidationStatus(vehicleType: VehicleType): ValidationStatus`
**Purpose**: Validate capacity and return color-coded status

**Logic**:
```typescript
const utilization = (weight / maxCapacity) * 100;
const safeUtilization = (weight / (maxCapacity * 0.9)) * 100;

if (weight > maxCapacity) return 'overweight';
if (safeUtilization > 100) return 'near-capacity';
if (utilization < 30) return 'underutilized';
return 'optimal';
```

---

### `checkLaneAvailability(): Promise<void>`
**Purpose**: Query database for route and fleet information

**Steps**:
1. Fetch active contracts with matching lanes
2. Get all trucks and filter out busy/maintenance ones
3. Calculate available truck count by vehicle type
4. Estimate delivery days based on route
5. Update `laneInfo` state with results

**Triggers**: Runs when `sourceCity` or `destCity` changes

---

### `estimateDeliveryDays(source: string, dest: string): number`
**Purpose**: Estimate delivery time based on common routes

**Logic**:
- Maintains a lookup table of major Indian routes
- Checks both directions (bidirectional matching)
- Returns days estimate (1-3 days typically)
- Default fallback: 2 days for unknown routes

---

## Styling Guide

### Color Palette
```css
/* Primary Colors */
--optimal-green: #4caf50;
--optimal-green-bg: #e8f5e9;

--warning-orange: #ff9800;
--warning-orange-bg: #fff3e0;

--error-red: #ef5350;
--error-red-bg: #ffebee;

--info-blue: #2196f3;
--info-blue-bg: #e3f2fd;

/* Accent Colors */
--best-choice-gradient: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
--selected-green: #4caf50;
--header-purple: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
```

### Card States
```css
/* Default Card */
border: 1px solid #e0e0e0;
box-shadow: 0 2px 8px rgba(0,0,0,0.08);

/* Hover Card */
transform: scale(1.02);
box-shadow: 0 6px 16px rgba(0,0,0,0.15);

/* Selected Card */
border: 3px solid #4caf50;
background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
box-shadow: 0 6px 16px rgba(76, 175, 80, 0.3);
```

---

## Testing Examples

### Test Case 1: Optimal Load
```tsx
<VehicleRecommendation 
  weight={7}
  sourceCity="Mumbai"
  destCity="Delhi"
  onVehicleSelect={handleSelect}
/>
// Expected: Truck (9T) as "BEST CHOICE" with green ✅ status
```

### Test Case 2: Overweight
```tsx
<VehicleRecommendation 
  weight={30}
  sourceCity="Bangalore"
  destCity="Chennai"
  onVehicleSelect={handleSelect}
/>
// Expected: Error message "Weight Exceeds Maximum Capacity"
```

### Test Case 3: Under-Utilized
```tsx
<VehicleRecommendation 
  weight={0.5}
  sourceCity="Pune"
  destCity="Mumbai"
  onVehicleSelect={handleSelect}
/>
// Expected: Pickup (1.5T) with blue 💡 "Consider smaller" status
```

### Test Case 4: Near Capacity
```tsx
<VehicleRecommendation 
  weight={8.5}
  sourceCity="Kolkata"
  destCity="Patna"
  onVehicleSelect={handleSelect}
/>
// Expected: Truck (9T) with orange ⚡ "Handle with care" status
```

---

## Performance Optimization Tips

### 1. Debounce Weight Input
```tsx
import { useMemo } from 'react';

const debouncedWeight = useMemo(() => {
  return parseFloat(form.weight_mt) || 0;
}, [form.weight_mt]);

<VehicleRecommendation weight={debouncedWeight} />
```

### 2. Memoize Recommendations
```tsx
const recommendations = useMemo(
  () => getRecommendedVehicles(weight),
  [weight]
);
```

### 3. Lazy Load Lane Data
```tsx
useEffect(() => {
  if (!sourceCity || !destCity) return;
  
  const timer = setTimeout(() => {
    checkLaneAvailability();
  }, 500); // Debounce by 500ms
  
  return () => clearTimeout(timer);
}, [sourceCity, destCity]);
```

---

## Common Pitfalls & Solutions

### ❌ Problem: Recommendations not updating
**Cause**: Weight prop is string, not number  
**Solution**: Parse to float
```tsx
weight={parseFloat(form.weight_mt) || 0}
```

### ❌ Problem: Lane availability not loading
**Cause**: Supabase RLS policies blocking read  
**Solution**: Check policies on `contracts`, `trucks`, `shipments` tables
```sql
-- Allow authenticated users to read contracts
CREATE POLICY "contracts_read" ON contracts
  FOR SELECT USING (auth.role() = 'authenticated');
```

### ❌ Problem: Cards not clickable
**Cause**: Missing `onVehicleSelect` callback  
**Solution**: Always provide callback
```tsx
onVehicleSelect={(type) => setForm({ ...form, vehicle_type: type })}
```

### ❌ Problem: Loading spinner stuck
**Cause**: Database query timeout or error  
**Solution**: Add timeout and error handling
```tsx
const timeout = setTimeout(() => {
  setLoading(false);
  console.error('Lane availability check timed out');
}, 10000); // 10 second timeout

try {
  await checkLaneAvailability();
} catch (error) {
  console.error('Lane check error:', error);
} finally {
  clearTimeout(timeout);
  setLoading(false);
}
```

---

## Integration with Existing Forms

### Step 1: Import Component
```tsx
import VehicleRecommendation from '@/src/components/booking/VehicleRecommendation.client';
```

### Step 2: Replace Dropdown
```tsx
// BEFORE
<select value={form.vehicle_type} onChange={handleChange}>
  <option value="Pickup (1.5T)">Pickup</option>
  ...
</select>

// AFTER
<VehicleRecommendation 
  weight={parseFloat(form.weight_mt) || 0}
  sourceCity={form.source_city}
  destCity={form.destination_city}
  onVehicleSelect={(type) => setForm({ ...form, vehicle_type: type })}
  selectedVehicle={form.vehicle_type}
/>
```

### Step 3: Add Manual Override (Optional)
```tsx
{form.vehicle_type && (
  <details>
    <summary>🔧 Manual Override</summary>
    <select value={form.vehicle_type} onChange={handleChange}>
      ...
    </select>
  </details>
)}
```

---

## Debugging Tips

### Enable Verbose Logging
```tsx
useEffect(() => {
  console.log('[VehicleRec] Weight changed:', weight);
  console.log('[VehicleRec] Recommendations:', recommendations);
}, [weight, recommendations]);

useEffect(() => {
  console.log('[VehicleRec] Cities:', { sourceCity, destCity });
  console.log('[VehicleRec] Lane Info:', laneInfo);
}, [sourceCity, destCity, laneInfo]);
```

### Test with Mock Data
```tsx
// Bypass database and use mock data
const mockLaneInfo: LaneAvailability = {
  hasActiveContract: true,
  availableTrucks: 12,
  preferredVehicles: ['Truck (9T)', 'LCV (3.5T)', 'Pickup (1.5T)'],
  estimatedDeliveryDays: 2
};

// Use mock instead of querying
setLaneInfo(mockLaneInfo);
```

### Check Supabase Connection
```tsx
const testConnection = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.from('contracts').select('count');
  console.log('Supabase test:', { data, error });
};
```

---

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Browser Compatibility

✅ **Supported**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

⚠️ **Partially Supported**:
- IE 11 (requires polyfills for `?.` optional chaining)

---

## Accessibility

### ARIA Labels
```tsx
<div role="region" aria-label="Vehicle Recommendations">
  <div role="list" aria-label="Available Vehicles">
    {recommendations.map(vehicle => (
      <div 
        role="listitem" 
        aria-label={`${vehicle} - ${validation.message}`}
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && onVehicleSelect(vehicle)}
      >
        ...
      </div>
    ))}
  </div>
</div>
```

### Keyboard Navigation
- Tab through vehicle cards
- Enter/Space to select
- Arrow keys for navigation (future enhancement)

---

## Version History

**v1.0.0** (Current)
- Initial release
- Weight-based recommendations
- Capacity validation
- Lane availability checking
- Real-time database queries

**Planned v1.1.0**
- Material-specific recommendations
- Advanced filtering options
- Historical data analytics
- Performance optimizations

---

## Support

For issues or questions:
1. Check console for error logs
2. Verify Supabase connection and RLS policies
3. Test with mock data to isolate issues
4. Review this quick reference for common pitfalls

---

**Happy Coding! 🚀**
