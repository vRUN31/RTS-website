# 🧪 Quick Test - Prevent Double Booking Feature

## ⚡ 5-Minute Test

### Pre-Test Setup
1. ✅ Server running: `npm run dev`
2. ✅ At least 3 trucks in system (2 will be busy, 1 available)
3. ✅ At least 2 approved bookings with active shipments

---

## Test Steps

### Step 1: Create Active Trips (Setup)

**Action**: Mark 2 trucks as busy
```sql
-- In Supabase SQL Editor:

-- 1. Get truck IDs
SELECT id, plate FROM trucks LIMIT 3;

-- 2. Create 2 active shipments (use actual truck IDs)
INSERT INTO shipments (client_id, truck_id, origin, destination, status)
VALUES 
  ((SELECT id FROM clients LIMIT 1), '<truck-id-1>', 'Mumbai', 'Delhi', 'in_transit'),
  ((SELECT id FROM clients LIMIT 1), '<truck-id-2>', 'Pune', 'Bangalore', 'in_transit');

-- 3. Verify
SELECT id, truck_id, destination, status FROM shipments WHERE status = 'in_transit';
```

**Expected**: 2 trucks now have active shipments

---

### Step 2: Test Assignment Modal

**Action**:
1. Login as admin: `http://localhost:3001/admin`
2. Scroll to "Pending Bookings"
3. Click "Approve" on any booking

**Expected UI**:
```
┌─────────────────────────────────────────┐
│ Assign a Truck                      [×] │
├─────────────────────────────────────────┤
│  📊 Stats:                              │
│  [1] Available  [2] On Active Trip      │
├─────────────────────────────────────────┤
│ ✅ Available Trucks (1)                 │
│ ○ TRK-003  MH-03-...  Running          │
│   Driver: Name • Phone • License       │
├─────────────────────────────────────────┤
│ 🚫 Unavailable - On Active Trip (2)    │
│ ⊗ TRK-001  MH-01-...  🚛 In Transit    │
│   Driver: Name                          │
│   🚨 Currently en route to: Delhi       │
│                              [BUSY]     │
│                                         │
│ ⊗ TRK-002  MH-02-...  🚛 In Transit    │
│   Driver: Name                          │
│   🚨 Currently en route to: Bangalore   │
│                              [BUSY]     │
└─────────────────────────────────────────┘
```

**Verify**:
- ✅ Stats show "1 Available, 2 On Active Trip"
- ✅ Available truck(s) in green section with selectable radio
- ✅ Busy trucks in red section with disabled radio
- ✅ Busy trucks show "🚨 Currently en route to: {destination}"
- ✅ Busy trucks show "BUSY" badge
- ✅ Busy trucks are grayed out (60% opacity)

---

### Step 3: Try Selecting Unavailable Truck

**Action**: Try clicking on a busy truck

**Expected**:
- ❌ Radio button doesn't respond (disabled)
- ❌ Cursor shows "not-allowed" icon
- ❌ Cannot select the truck

---

### Step 4: Select Available Truck

**Action**: Click on available truck

**Expected**:
- ✅ Radio button becomes selected
- ✅ Row highlights
- ✅ "Continue to Confirmation" button becomes enabled

---

### Step 5: Complete Assignment

**Action**: 
1. Click "Continue to Confirmation"
2. Verify trip details
3. Click "Confirm Assignment"

**Expected**:
- ✅ Assignment succeeds
- ✅ Booking status changes to "approved"
- ✅ New shipment created
- ✅ Now 3 trucks are busy (if we check again)

---

### Step 6: Test "All Trucks Busy" Scenario

**Action**:
```sql
-- Create one more active shipment for the 3rd truck
INSERT INTO shipments (client_id, truck_id, origin, destination, status)
VALUES 
  ((SELECT id FROM clients LIMIT 1), '<truck-id-3>', 'Chennai', 'Hyderabad', 'in_transit');
```

**Then**: Try to approve another booking

**Expected UI**:
```
┌─────────────────────────────────────────┐
│ Assign a Truck                      [×] │
├─────────────────────────────────────────┤
│  📊 Stats:                              │
│  [0] Available  [3] On Active Trip      │
├─────────────────────────────────────────┤
│ 🚫 Unavailable - On Active Trip (3)    │
│ (All trucks listed here as unavailable)│
│                                         │
│ ┌───────────────────────────────────┐  │
│ │ ⚠️  All trucks are currently on   │  │
│ │     active trips                   │  │
│ │                                    │  │
│ │ Please wait for a truck to complete│  │
│ │ its delivery before assigning new  │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Verify**:
- ✅ Yellow warning banner appears
- ✅ Stats show "0 Available"
- ✅ All trucks in red "Unavailable" section
- ✅ Cannot proceed with assignment
- ✅ "Continue" button disabled

---

### Step 7: Test Truck Release

**Action**:
```sql
-- Complete one trip to free up a truck
UPDATE shipments 
SET status = 'delivered', delivered_at = NOW()
WHERE truck_id = '<truck-id-1>';
```

**Then**: Click "Approve" on another booking

**Expected**:
- ✅ TRK-001 now appears in "Available" section
- ✅ Stats show "1 Available, 2 On Active Trip"
- ✅ Can select TRK-001 for new assignment

---

## 🎯 Success Criteria

All checks passed:
- [ ] ✅ Available vs unavailable trucks clearly separated
- [ ] ✅ Busy trucks cannot be selected
- [ ] ✅ Shows destination of active trips
- [ ] ✅ Stats display correctly
- [ ] ✅ Warning shown when all trucks busy
- [ ] ✅ Trucks become available after trip completion
- [ ] ✅ Visual design matches specification (colors, icons, badges)

---

## 🐛 Quick Debug Commands

### Check truck availability
```sql
SELECT 
  t.id,
  t.plate,
  t.status as truck_status,
  s.id as shipment_id,
  s.destination,
  s.status as shipment_status,
  CASE 
    WHEN s.id IS NOT NULL AND s.status NOT IN ('delivered', 'cancelled') 
    THEN 'BUSY' 
    ELSE 'AVAILABLE' 
  END as availability
FROM trucks t
LEFT JOIN shipments s ON t.id = s.truck_id 
  AND s.status NOT IN ('delivered', 'cancelled')
ORDER BY availability DESC, t.plate;
```

### Check active shipments
```sql
SELECT 
  id,
  truck_id,
  destination,
  status,
  created_at,
  age(NOW(), created_at) as trip_duration
FROM shipments
WHERE status NOT IN ('delivered', 'cancelled')
ORDER BY created_at DESC;
```

### Clear all active trips (reset)
```sql
-- Use with caution - marks all active trips as delivered
UPDATE shipments 
SET status = 'delivered', delivered_at = NOW()
WHERE status = 'in_transit';
```

---

## 📝 Test Results

**Date**: _______________
**Tester**: _______________

| Test Case | Status | Notes |
|-----------|--------|-------|
| Step 1: Setup active trips | ☐ Pass ☐ Fail | |
| Step 2: Modal shows correct stats | ☐ Pass ☐ Fail | |
| Step 3: Cannot select busy truck | ☐ Pass ☐ Fail | |
| Step 4: Can select available truck | ☐ Pass ☐ Fail | |
| Step 5: Assignment succeeds | ☐ Pass ☐ Fail | |
| Step 6: All busy warning | ☐ Pass ☐ Fail | |
| Step 7: Truck release works | ☐ Pass ☐ Fail | |

**Overall Result**: ☐ ALL PASS ☐ SOME FAIL

**Issues Found**: 
```
(Describe any issues encountered)
```

---

## ✨ Feature Status

If all tests pass:
**🎉 FEATURE IS WORKING CORRECTLY**

The truck double-booking prevention is now active and protecting your system from assignment conflicts!
