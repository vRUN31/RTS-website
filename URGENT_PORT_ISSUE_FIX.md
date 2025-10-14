# 🚨 URGENT: Table Not Showing Data - Quick Fix Guide

## ⚠️ CRITICAL ISSUE IDENTIFIED

You're accessing: **http://localhost:3000/admin/fleet**
But the server is running on: **http://localhost:3001/admin/fleet**

### 🔴 Problem
Port 3000 is being used by another process, so your Next.js server started on port 3001 instead.

---

## ✅ IMMEDIATE SOLUTION

### Step 1: Access the Correct URL
**Open this URL in your browser:**
```
http://localhost:3001/admin/fleet
```
**NOT** localhost:3000

### Step 2: Check Debug Information
After opening the correct URL, you'll see a **yellow debug box** showing:
```
🐛 Debug Info:
Total Drivers Loaded: X
Filtered Drivers (visible): X
Will Render: ✅ TABLE or ❌ EMPTY STATE
First Driver Name: ...
```

### Step 3: Interpret the Debug Info

**Case A: "Total Drivers Loaded: 0"**
- No drivers in database
- **Solution:** Run the SQL to add sample drivers (see below)

**Case B: "Total Drivers Loaded: 1+" but "Filtered Drivers: 0"**
- Drivers exist but search filter is hiding them
- **Solution:** Clear the search box at the top

**Case C: "Total Drivers Loaded: 1+" and "Filtered Drivers: 1+"**
- Drivers should be visible in table
- If not visible: Check browser console (F12) for errors

---

## 🚀 Quick Commands

### 1. Stop Any Process on Port 3000
```powershell
# Find what's using port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Kill that process (replace PID with the number from above)
Stop-Process -Id PID -Force
```

### 2. Restart Server on Port 3000
```powershell
npm run dev
```

### 3. Add Sample Drivers (If None Exist)
**Run in Supabase SQL Editor:**
```sql
-- Add 5 sample drivers
INSERT INTO public.drivers (name, phone, license_no, license_expiry, experience_years)
VALUES 
  ('Rajesh Kumar', '+91-9876543210', 'DL12AB1234', '2026-12-31', 5),
  ('Amit Patel', '+91-9876543220', 'GJ05CD5678', '2027-06-30', 8),
  ('Priya Sharma', '+91-9876543230', 'MH02EF9012', '2025-09-15', 3),
  ('Vikram Singh', '+91-9876543240', 'RJ14GH3456', '2028-03-20', 10),
  ('Sunita Verma', '+91-9876543250', 'UP32IJ7890', '2026-11-10', 6);

-- Add salaries for 3 drivers
UPDATE public.drivers 
SET salary_amount = 30000, salary_currency = 'INR', salary_period = 'monthly', last_salary_update = NOW() 
WHERE name = 'Rajesh Kumar';

UPDATE public.drivers 
SET salary_amount = 35000, salary_currency = 'INR', salary_period = 'monthly', last_salary_update = NOW() 
WHERE name = 'Amit Patel';

UPDATE public.drivers 
SET salary_amount = 28000, salary_currency = 'INR', salary_period = 'monthly', last_salary_update = NOW() 
WHERE name = 'Vikram Singh';
```

---

## 🔍 Debugging Steps

### Open Browser DevTools (F12)
1. Press **F12** or right-click → Inspect
2. Go to **Console** tab
3. Look for these messages:
   ```
   ✅ Loaded drivers: Array(X)
   Total drivers found: X
   🔍 Filtered drivers: Array(X)
   Total drivers: X Filtered: X
   ```

4. If you see errors in red, copy them and check:
   - "401 Unauthorized" = Not logged in as admin
   - "403 Forbidden" = RLS policy blocking access
   - "column does not exist" = Migration not run
   - "null" or "undefined" = Supabase connection issue

---

## 📊 What You Should See

### On Correct URL (localhost:3001):

**Yellow Debug Box:**
```
🐛 Debug Info:
Total Drivers Loaded: 5
Filtered Drivers (visible): 5
Will Render: ✅ TABLE
First Driver Name: Amit Patel
Driver IDs: abc123de, def456gh, ...
```

**Statistics Cards:**
```
👨‍✈️ 5        ✓ 3         ⚠️ 2
Total Drivers  With Salary  Pending Setup

💰 ₹93.0K    📊 ₹31.0K   📈 ₹11.2L
Total Monthly Avg Monthly  Yearly Cost
```

**Table (5 rows visible):**
```
┌────────────────┬──────────────┬────────────┬──────────────┬─────────┬──────────────┬─────────────┐
│ DRIVER NAME    │ PHONE        │ LICENSE NO.│ CURRENT      │ PERIOD  │ LAST UPDATED │ ACTIONS     │
│                │              │            │ SALARY       │         │              │             │
├────────────────┼──────────────┼────────────┼──────────────┼─────────┼──────────────┼─────────────┤
│ 👨‍✈️ Amit Patel │ +91-9876...  │ GJ05CD5678 │ ₹35,000      │ Monthly │ 10/14/2025   │ [Edit]      │
│ 👨‍✈️ Priya...   │ +91-9876...  │ MH02EF9012 │ Not Set      │ —       │ —            │ [Edit]      │
│ 👨‍✈️ Rajesh...  │ +91-9876...  │ DL12AB1234 │ ₹30,000      │ Monthly │ 10/14/2025   │ [Edit]      │
│ 👨‍✈️ Sunita...  │ +91-9876...  │ UP32IJ7890 │ Not Set      │ —       │ —            │ [Edit]      │
│ 👨‍✈️ Vikram...  │ +91-9876...  │ RJ14GH3456 │ ₹28,000      │ Monthly │ 10/14/2025   │ [Edit]      │
└────────────────┴──────────────┴────────────┴──────────────┴─────────┴──────────────┴─────────────┘
```

---

## ⚡ Quick Test Checklist

- [ ] Access **localhost:3001** (not 3000)
- [ ] See yellow debug box
- [ ] Debug shows "Total Drivers: 5"
- [ ] Debug shows "Will Render: ✅ TABLE"
- [ ] Statistics show real numbers
- [ ] Table shows 5 rows with driver data
- [ ] "Add Salary Details" button visible
- [ ] "Edit Salary" buttons on each row
- [ ] Click "Add Salary Details" → Modal opens
- [ ] Select driver → Fill form → Save
- [ ] Table updates with new data

---

## 🆘 If Still Not Working

### Check 1: Verify Supabase Connection
```javascript
// Open browser console and run:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```
- Should show your Supabase URL and key
- If undefined: Check `.env.local` file

### Check 2: Verify Admin Login
```sql
-- Run in Supabase SQL Editor:
SELECT id, email, role FROM public.profiles;
```
- Find your user
- Verify `role = 'admin'`
- If not: Update role to 'admin'

### Check 3: Verify RLS Policies
```sql
-- Check if admin can read drivers:
SELECT * FROM pg_policies WHERE tablename = 'drivers' AND policyname LIKE '%admin%';
```
- Should see policies for admin read/write
- If missing: Create admin policies

---

## 📱 Alternative: Kill Port 3000 Process

If you want to use port 3000 instead of 3001:

### Windows PowerShell:
```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill it (replace 1234 with actual PID)
taskkill /PID 1234 /F

# Restart server
npm run dev
```

### Then access:
```
http://localhost:3000/admin/fleet
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. **URL**: You're on `localhost:3001/admin/fleet` (or 3000 if you fixed that)
2. **Debug Box**: Shows drivers loaded and will render table
3. **Statistics**: Show real numbers (not ₹0.0K)
4. **Table**: Has visible rows with driver names
5. **Console**: No red errors, shows "✅ Loaded drivers"
6. **Add Button**: Green button is visible and clickable
7. **Edit Buttons**: Orange buttons on each row
8. **Functionality**: Adding/editing salary updates the table

---

## 🎯 Most Likely Issue

Based on your screenshot showing "Showing 1 of 1 drivers" but empty table:

**You're on the WRONG PORT!**

✅ **Solution**: Use **http://localhost:3001/admin/fleet**

The server output earlier showed:
```
⚠ Port 3000 is in use, using available port 3001 instead.
```

So your app is actually running on port 3001, not 3000!

---

**TL;DR: Access `http://localhost:3001/admin/fleet` instead of `:3000`**

The table WILL show data on the correct port! 🎉
