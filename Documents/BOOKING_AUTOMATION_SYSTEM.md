# Booking Automation System

This document describes the automated booking system implementation for RTS-website.

## Overview

The booking automation system streamlines the entire booking process from submission to approval, reducing manual intervention and improving efficiency.

## Components

### 1. Routing Utility (`src/utils/routing.ts`)

Provides route calculation using the free OSRM (Open Source Routing Machine) API.

**Features:**
- Geocoding (city name → coordinates)
- Route calculation between two points
- Distance and duration estimation
- Toll estimation
- ETA calculation based on vehicle type

**Example Usage:**
```typescript
import { calculateRouteBetweenCities, estimateTolls } from '@/src/utils/routing';

const route = await calculateRouteBetweenCities('Mumbai', 'Delhi');
// Returns: { distance_km, duration_seconds, duration_formatted, eta, polyline }

const tolls = estimateTolls(route.distance_km, 'Truck (9T)');
// Returns estimated toll cost in ₹
```

### 2. Vehicle Recommendation (`src/utils/vehicle-recommendation.ts`)

Automatically recommends the best vehicle based on shipment weight and material type.

**Features:**
- Weight-based vehicle matching
- Material type consideration
- Capacity utilization scoring (60-90% optimal)
- Available truck lookup from database
- Proximity-based truck selection (if GPS data available)

**Vehicle Types:**
| Vehicle | Capacity | Ideal Weight Range |
|---------|----------|-------------------|
| Pickup (1.5T) | 1.5 MT | 0.1 - 1.35 MT |
| LCV (3.5T) | 3.5 MT | 1.0 - 3.15 MT |
| Truck (9T) | 9 MT | 3.0 - 8.1 MT |
| Truck (16T) | 16 MT | 8.0 - 14.4 MT |
| Trailer (25T) | 25 MT | 15.0 - 22.5 MT |

### 3. Auto-Assign API (`src/app/api/bookings/auto-assign/route.ts`)

REST API endpoint for automated truck assignment.

**Endpoints:**

- `GET /api/bookings/auto-assign?bookingId=xxx` - Preview auto-assignment
- `POST /api/bookings/auto-assign` - Execute auto-assignment

**POST Body:**
```json
{
  "bookingId": "uuid",
  "autoApprove": true  // Optional: auto-approve if criteria met
}
```

**Response:**
```json
{
  "success": true,
  "recommendation": {
    "vehicleType": "Truck (9T)",
    "truckId": "uuid",
    "truckPlate": "MH12AB1234",
    "driverName": "John Doe",
    "reason": "Optimal capacity utilization (75%)",
    "score": 85
  },
  "routeInfo": {
    "distance_km": 1400,
    "duration_formatted": "28 hr 30 min",
    "eta": "2025-12-18T10:00:00Z",
    "estimatedCost": 45000,
    "tollEstimate": 2100
  },
  "autoApproved": true,
  "message": "Auto-approved and assigned to MH12AB1234"
}
```

### 4. Database Triggers (`supabase/migrations/2025-12-16-booking-automation.sql`)

PostgreSQL functions and triggers for automated status management.

**Triggers:**
- `trg_sync_booking_status` - Syncs booking status from shipment updates
- `trg_booking_status_notification` - Creates notifications on status change
- `trg_manage_truck_status` - Updates truck status on shipment changes
- `trg_validate_booking` - Validates booking data before insert/update
- `trg_check_double_booking` - Warns about potential conflicts

**Helper Functions:**
- `recommend_vehicle_type(weight_mt)` - SQL-based vehicle recommendation
- `find_best_available_truck(vehicle_type)` - Find available trucks
- `check_geofence(lat, lng, target_lat, target_lng, radius_km)` - Geofencing

### 5. Booking Automation Service (`src/utils/booking-automation.ts`)

Orchestrates all automation components.

**Key Functions:**
- `calculateBookingAutomation()` - Full automation calculation
- `calculateBookingPreview()` - Client-side preview (no DB access)
- `autoApproveBooking()` - Execute auto-approval workflow
- `checkExpressEligibility()` - Check if booking qualifies for express processing

### 6. React Hook (`src/hooks/useBookingAutoCalc.ts`)

Client-side hook for real-time calculations as user fills the booking form.

**Features:**
- Debounced API calls (800ms default)
- Auto route calculation
- Auto vehicle recommendation
- Real-time price estimation

**Usage:**
```tsx
const { route, vehicle, pricing, loading } = useBookingAutoCalc({
  sourceCity: 'Mumbai',
  destinationCity: 'Delhi',
  weight_mt: 5,
  material: 'Steel'
});
```

### 7. Admin UI Component (`src/components/booking/AutoAssignButton.client.tsx`)

Auto-assign button with preview modal for admin dashboard.

**Features:**
- Preview recommendation before assignment
- One-click auto-approval
- Success/error toasts
- Loading states

## Automation Workflow

```
Client Submits Booking
        ↓
[Trigger] Validate booking data (pickup date, weight, cities)
        ↓
[Admin UI] Auto-Assign Button shows preview
        ↓
[API] Calculate route (OSRM) + Recommend vehicle + Find trucks
        ↓
[Decision] Score >= 70 AND trucks available?
        ↓
    ┌───Yes───┐                    ┌───No───┐
    ↓         ↓                    ↓        ↓
Auto-Approve    Manual Review Required
    ↓
[Trigger] Create shipment
[Trigger] Update booking status → 'approved'
[Trigger] Update truck status → 'assigned'
[Trigger] Send notifications (email + in-app)
        ↓
[Realtime] Client sees status update
```

## Auto-Approval Criteria

Booking qualifies for auto-approval when ALL conditions are met:

1. **Route calculated** - Both cities geocoded successfully
2. **High confidence score** - Vehicle recommendation score ≥ 70%
3. **Trucks available** - At least one truck of recommended type available
4. **Safe capacity** - Capacity utilization ≤ 95%

## Configuration

### Environment Variables

```env
# Optional: Custom OSRM server (defaults to public demo)
NEXT_PUBLIC_OSRM_URL=https://router.project-osrm.org
```

### Running the Migration

Apply the database triggers:

```sql
-- Run in Supabase SQL Editor
\i supabase/migrations/2025-12-16-booking-automation.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

## Monitoring

### Logs
- API logs: Check `/api/bookings/auto-assign` console output
- Notification logs: Check `notifications` table for queued/sent status
- Trigger logs: Check PostgreSQL logs for function execution

### Metrics to Track
- Auto-approval rate (bookings auto-approved / total bookings)
- Average recommendation score
- Time from submission to approval
- Failed geocoding rate

## Future Enhancements

1. **Scheduled Auto-Processing** - Cron job to auto-reject stale bookings
2. **GPS Geofencing** - Auto status transitions based on truck location
3. **Smart Scheduling** - Consider driver schedules and truck maintenance
4. **Route Optimization** - Multi-stop routing for efficient deliveries
5. **Price Negotiation** - Dynamic pricing based on demand and availability
