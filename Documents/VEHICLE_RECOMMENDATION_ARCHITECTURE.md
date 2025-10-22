# Vehicle Recommendation System - Architecture Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT BOOKING FORM                             │
│                     (EnhancedBookingForm.tsx)                            │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ User Inputs:
                             │ • Weight (MT)
                             │ • Source City
                             │ • Destination City
                             │ • Material (optional)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    VEHICLE RECOMMENDATION ENGINE                         │
│                  (VehicleRecommendation.client.tsx)                      │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  STEP 1: WEIGHT ANALYSIS                                        │    │
│  │  • Parse weight input                                           │    │
│  │  • Map to vehicle capacity ranges                              │    │
│  │  • Apply 90% safety buffer                                     │    │
│  │  • Generate ranked recommendations                             │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                             │                                             │
│                             ▼                                             │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  STEP 2: CAPACITY VALIDATION                                    │    │
│  │  • Calculate utilization percentage                            │    │
│  │  • Assign status (Optimal/Under/Near/Over)                    │    │
│  │  • Generate color-coded warnings                              │    │
│  │  • Display capacity metrics                                   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                             │                                             │
│                             ▼                                             │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  STEP 3: LANE AVAILABILITY CHECK                                │    │
│  │  • Query Supabase for active contracts                         │    │
│  │  • Check truck availability (not on active trips)              │    │
│  │  • Estimate delivery days                                      │    │
│  │  • Identify preferred vehicle types                            │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Outputs:
                             │ • Ranked vehicle list
                             │ • Validation statuses
                             │ • Lane availability data
                             │ • Selection callback
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          UI RENDERING LAYER                              │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Header     │  │ Recommended  │  │   Vehicle    │                  │
│  │   Summary    │  │    Banner    │  │    Cards     │                  │
│  │   (Metrics)  │  │   (🎯 Icon)  │  │  (Detailed)  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                           │
│  Each Card Contains:                                                     │
│  • Icon & Name                                                           │
│  • Badge (Best Choice / Selected)                                       │
│  • Price per km                                                          │
│  • Capacity, Dimensions, Utilization                                    │
│  • Color-coded validation status                                        │
│  • Ideal use cases (tags)                                               │
│  • Click handler → onVehicleSelect()                                    │
│                                                                           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ User Action:
                             │ Click vehicle card
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FORM STATE UPDATE                                   │
│  setForm({ ...form, vehicle_type: selectedVehicle })                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    MANUAL OVERRIDE (Optional)                            │
│  <details> collapsible dropdown for custom selection                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FORM SUBMISSION                                     │
│  Submit booking with selected vehicle_type                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Query Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                                │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             │
            ┌────────────────┴────────────────┐
            │                                  │
            ▼                                  ▼
┌───────────────────────┐          ┌───────────────────────┐
│    contracts TABLE    │          │     trucks TABLE      │
│                       │          │                       │
│ • id                  │          │ • id                  │
│ • start_at            │          │ • vehicle_type        │
│ • end_at              │          │ • status              │
│ • lanes (JSONB)       │          │ • registration        │
│                       │          │                       │
│ Query:                │          │ Query:                │
│ WHERE start_at <= NOW │          │ WHERE status !=       │
│   AND end_at >= NOW   │          │   'maintenance'       │
│   AND lanes @> route  │          │                       │
└───────────────────────┘          └───────────────────────┘
            │                                  │
            │                                  │
            └────────────────┬─────────────────┘
                             │
                             ▼
                   ┌───────────────────────┐
                   │  shipments TABLE      │
                   │                       │
                   │ • id                  │
                   │ • truck_id            │
                   │ • status              │
                   │                       │
                   │ Query:                │
                   │ WHERE status NOT IN   │
                   │   ('delivered',       │
                   │    'cancelled')       │
                   └───────────────────────┘
                             │
                             │
                             ▼
            ┌─────────────────────────────────┐
            │  AVAILABILITY CALCULATION       │
            │                                 │
            │  Available Trucks =             │
            │    ALL trucks                   │
            │    - (trucks on active trips)   │
            │    - (trucks in maintenance)    │
            │                                 │
            │  Preferred Vehicles =           │
            │    Top 3 most available types   │
            └─────────────────────────────────┘
                             │
                             ▼
            ┌─────────────────────────────────┐
            │   RETURN TO COMPONENT           │
            │                                 │
            │   LaneAvailability {            │
            │     hasActiveContract: bool     │
            │     availableTrucks: number     │
            │     preferredVehicles: string[] │
            │     estimatedDeliveryDays: int  │
            │   }                             │
            └─────────────────────────────────┘
```

---

## Validation Logic Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      INPUT: Cargo Weight (MT)                            │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
            ┌─────────────────────────────────┐
            │  FOR EACH Vehicle Type:         │
            │  • Pickup (1.5T)                │
            │  • LCV (3.5T)                   │
            │  • Truck (9T)                   │
            │  • Truck (16T)                  │
            │  • Trailer (25T)                │
            └────────────┬────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │  Calculate Utilization:            │
        │  utilization = (weight / maxCap)   │
        │  safeUtilization = weight /        │
        │                    (maxCap * 0.9)  │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  Validation Decision Tree:         │
        │                                    │
        │  IF weight > maxCapacity           │
        │    → 🔴 OVERWEIGHT                 │
        │    → Status: "Exceeds capacity"    │
        │    → Color: Red (#ef5350)          │
        │    → Action: Show warning          │
        │                                    │
        │  ELSE IF safeUtilization > 100%    │
        │    → 🟠 NEAR CAPACITY              │
        │    → Status: "Handle with care"    │
        │    → Color: Orange (#ff9800)       │
        │    → Action: Caution message       │
        │                                    │
        │  ELSE IF utilization < 30%         │
        │    → 🔵 UNDER-UTILIZED             │
        │    → Status: "Consider smaller"    │
        │    → Color: Blue (#2196f3)         │
        │    → Action: Cost optimization     │
        │                                    │
        │  ELSE                              │
        │    → 🟢 OPTIMAL                    │
        │    → Status: "Optimal capacity"    │
        │    → Color: Green (#4caf50)        │
        │    → Action: Recommend             │
        │                                    │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  Sort Recommendations:             │
        │  • Filter suitable vehicles        │
        │  • Rank by capacity (smallest 1st) │
        │  • Attach validation status        │
        │  • Mark best choice (index 0)      │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  RETURN:                           │
        │  recommendations[] with:           │
        │  • vehicle specs                   │
        │  • validation status               │
        │  • utilization percentage          │
        │  • color codes                     │
        │  • action messages                 │
        └────────────────────────────────────┘
```

---

## Component Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PARENT: EnhancedBookingForm.tsx                       │
│                                                                           │
│  State Management:                                                       │
│  • form.weight_mt                                                        │
│  • form.source_city                                                      │
│  • form.destination_city                                                 │
│  • form.vehicle_type                                                     │
│  • form.material                                                         │
│                                                                           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Props Down ⬇
                             │
                    ┌────────┴────────┐
                    │                 │
                    │  Props Passed:  │
                    │                 │
                    ▼                 │
    weight={parseFloat(form.weight_mt) || 0}
    sourceCity={form.source_city}    │
    destCity={form.destination_city} │
    material={form.material}         │
    onVehicleSelect={(type) => ...}  │
    selectedVehicle={form.vehicle_type}
                    │                 │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              CHILD: VehicleRecommendation.client.tsx                     │
│                                                                           │
│  Internal State:                                                         │
│  • recommendations: VehicleType[]                                        │
│  • laneInfo: LaneAvailability | null                                    │
│  • loading: boolean                                                      │
│                                                                           │
│  Effects:                                                                │
│  • useEffect(() => calculateRecommendations(), [weight])                │
│  • useEffect(() => checkLaneAvailability(), [sourceCity, destCity])    │
│                                                                           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Callback Up ⬆
                             │
                    ┌────────┴────────┐
                    │                 │
                    │  User clicks:   │
                    │  Vehicle Card   │
                    │                 │
                    ▼                 │
        onVehicleSelect(vehicleType) │
                    │                 │
                    └────────┬────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PARENT: State Update                                  │
│                                                                           │
│  setForm({ ...form, vehicle_type: vehicleType })                        │
│                                                                           │
│  Effects:                                                                │
│  • Selected vehicle highlights (re-render)                              │
│  • Manual override dropdown shows                                       │
│  • Form validation passes                                               │
│  • Submit button enables                                                │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Decision Tree: User Journey

```
                    ┌──────────────────┐
                    │  User Opens      │
                    │  Booking Form    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Enter Weight?   │
                    └────┬─────────┬───┘
                         │         │
                    YES  │         │  NO
                         ▼         ▼
            ┌────────────────┐   ┌──────────────────┐
            │ Show           │   │ Show Placeholder │
            │ Recommendations│   │ "Enter weight"   │
            └────────┬───────┘   └──────────────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ Weight > 25 MT?    │
            └────┬───────────┬───┘
                 │           │
            YES  │           │  NO
                 ▼           ▼
    ┌─────────────────┐  ┌──────────────────────┐
    │ Show Split      │  │ Calculate            │
    │ Shipment Error  │  │ Recommendations      │
    └─────────────────┘  └──────────┬───────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │ Display Ranked Cards   │
                        │ • Optimal (Green)      │
                        │ • Near-Cap (Orange)    │
                        │ • Under-Used (Blue)    │
                        │ • Overweight (Red)     │
                        └────────┬───────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Enter Source/Dest?     │
                    └────┬───────────────┬───┘
                         │               │
                    YES  │               │  NO
                         ▼               ▼
            ┌────────────────────┐   ┌──────────────┐
            │ Query Database     │   │ Skip Lane    │
            │ • Contracts        │   │ Check        │
            │ • Trucks           │   └──────────────┘
            │ • Shipments        │
            └────────┬───────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ Show Lane Info:    │
            │ • Active Contract  │
            │ • Available Trucks │
            │ • Est. Delivery    │
            └────────┬───────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ User Clicks Card   │
            └────────┬───────────┘
                     │
                     ▼
            ┌────────────────────┐
            │ Validation OK?     │
            └────┬───────────┬───┘
                 │           │
            YES  │           │  NO
                 ▼           ▼
    ┌─────────────────┐  ┌────────────────┐
    │ Highlight Card  │  │ Show Warning   │
    │ "✓ SELECTED"    │  │ "Overweight"   │
    │ Enable Submit   │  │ Block Submit   │
    └─────────┬───────┘  └────────────────┘
              │
              ▼
    ┌─────────────────┐
    │ Optional:       │
    │ Manual Override │
    │ (Details menu)  │
    └─────────┬───────┘
              │
              ▼
    ┌─────────────────┐
    │ Submit Booking  │
    └─────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       ERROR SCENARIOS                                    │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────────┐   ┌───────────────┐
│ Database     │   │ Invalid Input    │   │ Network       │
│ Query Error  │   │ Data             │   │ Timeout       │
└──────┬───────┘   └────────┬─────────┘   └───────┬───────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────┐   ┌──────────────────┐   ┌───────────────┐
│ try/catch    │   │ Input            │   │ Loading       │
│ console.error│   │ Validation       │   │ Timeout       │
│ setLaneInfo  │   │ Fallback to 0    │   │ Retry Button  │
│ (null)       │   │ Show Placeholder │   │ Error Message │
└──────┬───────┘   └────────┬─────────┘   └───────┬───────┘
       │                    │                     │
       └────────────────────┼─────────────────────┘
                            │
                            ▼
            ┌────────────────────────────────┐
            │  GRACEFUL DEGRADATION:         │
            │  • Hide lane info section      │
            │  • Still show recommendations  │
            │  • User can proceed with       │
            │    booking (limited info)      │
            │  • Admin reviews later         │
            └────────────────────────────────┘
```

---

This architecture ensures:
- ✅ **Separation of Concerns**: Each component handles specific logic
- ✅ **Real-time Updates**: Reactive data flow with useEffect hooks
- ✅ **Database Efficiency**: Optimized queries with proper filtering
- ✅ **Error Resilience**: Graceful fallbacks for all failure modes
- ✅ **User Feedback**: Clear visual indicators at every step
