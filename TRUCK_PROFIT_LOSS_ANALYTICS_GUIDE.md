# ✅ Profit & Loss Per Truck Analytics - Implementation Guide

## 🎯 Overview

This feature provides **dynamic, real-time** profit and loss analysis for each truck in your fleet. The graphs automatically update when:
- Admin enters shipment information
- Shipments are successfully completed
- Costs/revenues are modified
- New trucks are added

---

## 📊 What's Included

### 1. **Performance Summary Cards**
- Total Trucks count
- Profitable trucks (green ✅)
- Loss-making trucks (red ⚠️)
- Net Profit/Loss total

### 2. **Profit/Loss Per Truck Chart**
- Horizontal bar chart
- Green bars = Profit
- Red bars = Loss
- Sorted by profit (highest to lowest)
- Hover for details:
  - Revenue
  - Cost
  - Shipment count

### 3. **Real-Time Updates**
- Auto-refreshes when shipments change
- Auto-refreshes when trucks are updated
- No page reload needed

---

## 🚀 Installation Steps

### Step 1: Run Database Migration

Open **Supabase SQL Editor** and execute:
```
File: supabase/migrations/2025-10-15-truck-profit-loss-analytics.sql
```

This creates 6 new SQL functions:
1. `profit_loss_per_truck()` - Overall truck performance
2. `profit_loss_per_truck_range()` - Performance within date range
3. `truck_profit_loss_monthly()` - Monthly trend for specific truck
4. `top_profitable_trucks()` - Top N performers
5. `loss_making_trucks()` - Trucks needing attention
6. `truck_performance_summary()` - Fleet-wide summary

### Step 2: Hard Refresh Browser

```
Press: Ctrl + Shift + R
```

### Step 3: Navigate to Analytics

```
Go to: http://localhost:3000/admin/analytics
```

---

## 📈 Features

### A. Summary Cards

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   🚚        │    ✅       │    ⚠️       │    💰       │
│   10        │     7       │     3       │  ₹145.2K    │
│ Total       │ Profitable  │ Loss Making │ Net P/L     │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### B. Profit/Loss Chart

```
TRK-001 ████████████████ ₹45,000  (Profit - Green)
TRK-003 ██████████████   ₹35,000  (Profit - Green)
TRK-005 ███████████      ₹28,000  (Profit - Green)
TRK-002 ███████          ₹18,000  (Profit - Green)
TRK-004 ████ -₹12,000            (Loss - Red)
TRK-006 ███ -₹8,000              (Loss - Red)
```

### C. Hover Tooltip Shows:
- **Profit/Loss**: ₹45,000
- **Revenue**: ₹150,000
- **Cost**: ₹105,000
- **Shipments**: 12

---

## 🔄 How It Updates Dynamically

### Trigger 1: New Shipment Created
```
Admin creates shipment → 
Analytics detects change → 
Fetches updated data → 
Chart redraws automatically
```

### Trigger 2: Shipment Status Updated
```
Shipment marked "delivered" → 
Costs finalized → 
Profit/loss recalculated → 
Chart updates
```

### Trigger 3: Cost Modified
```
Admin edits operational_cost → 
Database triggers analytics refresh → 
Chart shows new values
```

---

## 💾 Data Structure

### Shipments Table (Required Fields):
- `cost` - Revenue from client
- `operational_cost` - Expenses (fuel, driver, maintenance)
- `truck_id` - Which truck handled this shipment
- `status` - Current status
- `created_at` - Timestamp

### Calculation:
```
Profit/Loss = SUM(cost) - SUM(operational_cost)
```

---

## 🎨 Visual Design

### Light Mode:
- White cards with subtle shadows
- Green bars for profit
- Red bars for loss
- Black text
- Orange accents

### Dark Mode:
- Dark gray (#1a1a1a) cards
- Same colors but brighter
- Light text
- Orange highlights

---

## 📊 Database Functions Usage

### Get All Truck Performance:
```sql
SELECT * FROM profit_loss_per_truck();
```

Returns:
```
truck_id | truck_code | plate | total_revenue | total_cost | profit_loss | shipment_count
---------|------------|-------|---------------|------------|-------------|---------------
uuid-1   | TRK-001    | MH... | 150000        | 105000     | 45000       | 12
uuid-2   | TRK-002    | GJ... | 80000         | 62000      | 18000       | 8
```

### Get Performance for Date Range:
```sql
SELECT * FROM profit_loss_per_truck_range('2025-01-01', '2025-10-15');
```

### Get Top 5 Profitable Trucks:
```sql
SELECT * FROM top_profitable_trucks(5);
```

### Get Loss-Making Trucks:
```sql
SELECT * FROM loss_making_trucks();
```

### Get Fleet Summary:
```sql
SELECT * FROM truck_performance_summary();
```

Returns:
```
total_trucks | profitable_trucks | loss_making_trucks | net_profit_loss
-------------|-------------------|-------------------|----------------
10           | 7                 | 3                 | 145200
```

---

## 🧪 Testing

### Test 1: Create Shipment
1. Go to Admin → Create Shipment
2. Fill in:
   - Truck: TRK-001
   - Cost: ₹50,000
   - Operational Cost: ₹30,000
3. Save
4. Go to Analytics
5. **Expected**: TRK-001 shows ₹20,000 profit

### Test 2: Update Cost
1. Edit existing shipment
2. Change operational_cost from ₹30,000 to ₹35,000
3. Save
4. **Expected**: Chart updates, profit decreases to ₹15,000

### Test 3: Multiple Shipments
1. Create 3 shipments for TRK-002
   - Shipment 1: Revenue ₹40k, Cost ₹25k (Profit: ₹15k)
   - Shipment 2: Revenue ₹35k, Cost ₹20k (Profit: ₹15k)
   - Shipment 3: Revenue ₹30k, Cost ₹45k (Loss: -₹15k)
2. **Expected**: TRK-002 shows total profit ₹15k (15+15-15)

### Test 4: Real-Time Update
1. Open Analytics in one tab
2. Open Shipments in another tab
3. Create/edit shipment in second tab
4. Switch back to Analytics tab
5. **Expected**: Chart updates within 1-2 seconds

---

## 🐛 Troubleshooting

### Issue: Charts not showing

**Solution**:
1. Check browser console (F12)
2. Look for errors
3. Ensure migration SQL ran successfully
4. Hard refresh (Ctrl + Shift + R)

### Issue: Data not updating

**Solution**:
1. Check if shipments have `truck_id` assigned
2. Verify `cost` and `operational_cost` are set
3. Check RLS policies allow reading data
4. Restart dev server

### Issue: Wrong calculations

**Solution**:
1. Run SQL query directly:
   ```sql
   SELECT * FROM profit_loss_per_truck();
   ```
2. Compare with expected values
3. Check if all shipments have proper cost data

### Issue: Empty chart

**Solution**:
- No trucks or no shipments yet
- Create test data:
  ```sql
  -- Create test truck
  INSERT INTO trucks (display_code, plate, status, location)
  VALUES ('TEST-001', 'TEST-PLATE', 'running', 'Test Location');
  
  -- Create test shipment (get truck_id from above)
  INSERT INTO shipments (truck_id, cost, operational_cost, status)
  VALUES ('<truck-id>', 50000, 30000, 'delivered');
  ```

---

## 🎯 Next Steps (Optional Enhancements)

### 1. **Monthly Trend Per Truck**
Add a line chart showing profit/loss over time for selected truck.

### 2. **Efficiency Score**
Show profit margin percentage:
```
Efficiency = (Profit / Cost) × 100
```

### 3. **Alerts**
Notify admin when truck becomes loss-making.

### 4. **Comparison**
Compare two trucks side-by-side.

### 5. **Export**
Download profit/loss report as CSV/PDF.

### 6. **Date Range Filter**
Allow admin to select custom date range for analysis.

---

## ✅ Checklist

- [ ] SQL migration executed in Supabase
- [ ] Browser hard-refreshed
- [ ] Analytics page opens without errors
- [ ] Summary cards display correctly
- [ ] Profit/Loss chart renders
- [ ] Hover tooltips show details
- [ ] Create test shipment
- [ ] Chart updates automatically
- [ ] Dark mode works
- [ ] Mobile responsive (charts scale)
- [ ] No console errors

---

## 🎉 You're Done!

Your analytics now shows:
✅ Real-time profit/loss per truck
✅ Dynamic updates on data changes
✅ Visual performance comparison
✅ Fleet-wide summary metrics
✅ Hover details for each truck

**Navigate to Analytics to see it in action!** 🚀
