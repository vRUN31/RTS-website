# 🔧 Troubleshooting Empty Table Issue

## Problem: Table Shows Headers but No Data

### Why This Happens:
The table is working correctly, but **there are no drivers in your database yet**. The Driver Salary feature requires existing drivers to display and manage.

---

## ✅ Solution Steps

### Step 1: Check if Drivers Exist

**Run this in Supabase SQL Editor:**

```sql
-- Check driver count
SELECT COUNT(*) as total_drivers FROM public.drivers;
```

**Expected Results:**
- If result is `0` → No drivers exist (this is your issue!)
- If result is `> 0` → Drivers exist, but may have other issues

---

### Step 2: Add Sample Drivers (If None Exist)

**Copy and run this SQL in Supabase:**

```sql
-- Add 5 sample drivers
INSERT INTO public.drivers (name, phone, license_no, license_expiry, experience_years, address, emergency_contact)
VALUES 
  ('Rajesh Kumar', '+91-9876543210', 'DL12AB1234', '2026-12-31', 5, 'Mumbai, Maharashtra', '+91-9876543211'),
  ('Amit Patel', '+91-9876543220', 'GJ05CD5678', '2027-06-30', 8, 'Ahmedabad, Gujarat', '+91-9876543221'),
  ('Priya Sharma', '+91-9876543230', 'MH02EF9012', '2025-09-15', 3, 'Pune, Maharashtra', '+91-9876543231'),
  ('Vikram Singh', '+91-9876543240', 'RJ14GH3456', '2028-03-20', 10, 'Jaipur, Rajasthan', '+91-9876543241'),
  ('Sunita Verma', '+91-9876543250', 'UP32IJ7890', '2026-11-10', 6, 'Lucknow, Uttar Pradesh', '+91-9876543251');
```

---

### Step 3: Add Salary for Sample Drivers

**Run this to add salary data:**

```sql
-- Add salaries to 3 drivers
UPDATE public.drivers
SET 
  salary_amount = 30000,
  salary_currency = 'INR',
  salary_period = 'monthly',
  last_salary_update = NOW()
WHERE name = 'Rajesh Kumar';

UPDATE public.drivers
SET 
  salary_amount = 35000,
  salary_currency = 'INR',
  salary_period = 'monthly',
  last_salary_update = NOW()
WHERE name = 'Amit Patel';

UPDATE public.drivers
SET 
  salary_amount = 28000,
  salary_currency = 'INR',
  salary_period = 'monthly',
  last_salary_update = NOW()
WHERE name = 'Vikram Singh';
```

---

### Step 4: Refresh Your Browser

1. Go to: **http://localhost:3001/admin/fleet**
2. Click **Driver Salary** tab
3. Press **Ctrl+Shift+R** (hard refresh)

**You should now see:**
```
Statistics:
- Total Drivers: 5
- With Salary Set: 3
- Pending Setup: 2
- Total Monthly: ₹93.0K
- Avg Monthly: ₹31.0K
- Yearly Cost: ₹11.2L

Table:
✓ Rajesh Kumar | +91-9876... | DL12AB1234 | ₹30,000 | Monthly | [Edit Salary]
✓ Amit Patel   | +91-9876... | GJ05CD5678 | ₹35,000 | Monthly | [Edit Salary]
✗ Priya Sharma | +91-9876... | MH02EF9012 | Not Set |    —    | [Edit Salary]
✓ Vikram Singh | +91-9876... | RJ14GH3456 | ₹28,000 | Monthly | [Edit Salary]
✗ Sunita Verma | +91-9876... | UP32IJ7890 | Not Set |    —    | [Edit Salary]
```

---

## 🎯 Now Test the Features

### Test "Add Salary Details" Button:
1. Click green **"Add Salary Details"** button
2. Select "Priya Sharma" from dropdown
3. Enter amount: `26000`
4. Currency: `INR`
5. Period: `monthly`
6. Click **"Add Salary"**
7. ✅ Table updates, shows ₹26,000 for Priya

### Test "Edit Salary" Button:
1. Find "Rajesh Kumar" in table
2. Click **"Edit Salary"** on his row
3. Change amount from `30000` to `32000`
4. Add note: "Annual increment 2025"
5. Click **"Save Salary"**
6. ✅ Table updates, shows ₹32,000 for Rajesh

---

## 🐛 Other Potential Issues

### Issue 1: Migration Not Run
**Symptom:** Yellow warning message appears
**Solution:** Run the migration SQL (see DRIVER_SALARY_URGENT_FIX.md)

### Issue 2: Browser Cache
**Symptom:** Old data shows, changes don't appear
**Solution:** Hard refresh (Ctrl+Shift+R) or clear cache

### Issue 3: RLS Policies Blocking Access
**Symptom:** Data exists but table is empty
**Solution:** Check RLS policies in Supabase:
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'drivers';

-- Ensure admin can read
CREATE POLICY "admin_read_drivers" ON public.drivers
FOR SELECT TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);
```

### Issue 4: Console Errors
**Symptom:** Errors in browser DevTools (F12)
**Solution:** 
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check for "401 Unauthorized" or "403 Forbidden"
5. Verify you're logged in as admin

---

## 📊 Debug Checklist

Run this checklist to identify the issue:

- [ ] **Step 1:** Open browser DevTools (F12)
- [ ] **Step 2:** Go to Console tab
- [ ] **Step 3:** Refresh page
- [ ] **Step 4:** Look for log message: "✅ Loaded drivers: [...]"
- [ ] **Step 5:** Check the array length
  - If `[]` (empty array) → No drivers in database
  - If `null` or `undefined` → Database query failed
  - If has items → Data loaded successfully

**Console should show:**
```javascript
✅ Loaded drivers: Array(5)
  0: {id: "...", name: "Rajesh Kumar", phone: "+91-9876543210", ...}
  1: {id: "...", name: "Amit Patel", phone: "+91-9876543220", ...}
  ...
Total drivers found: 5
```

---

## 🔄 Complete Workflow

### From Scratch to Working Feature:

1. ✅ **Run Database Migration** (add salary columns)
   ```sql
   ALTER TABLE public.drivers 
   ADD COLUMN IF NOT EXISTS salary_amount numeric(10,2),
   ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'INR',
   ADD COLUMN IF NOT EXISTS salary_period text DEFAULT 'monthly',
   ADD COLUMN IF NOT EXISTS last_salary_update timestamptz;
   ```

2. ✅ **Add Sample Drivers** (if none exist)
   ```sql
   INSERT INTO public.drivers (name, phone, license_no, ...)
   VALUES (...);
   ```

3. ✅ **Add Some Salaries** (optional, to test)
   ```sql
   UPDATE public.drivers SET salary_amount = 30000, ... WHERE name = '...';
   ```

4. ✅ **Refresh Browser**
   - Go to http://localhost:3001/admin/fleet
   - Click Driver Salary tab
   - Press Ctrl+Shift+R

5. ✅ **Verify Display**
   - Statistics cards show numbers
   - Table shows driver rows
   - "Add Salary Details" button visible
   - "Edit Salary" buttons on each row

6. ✅ **Test Adding Salary**
   - Click "Add Salary Details"
   - Select driver
   - Fill form
   - Save
   - Check table updates

7. ✅ **Test Editing Salary**
   - Click "Edit Salary" on a row
   - Modify values
   - Save
   - Check table updates

---

## 💡 Quick Fixes

### Fix 1: Add Drivers Quickly
```sql
-- Single command to add 5 drivers with salaries
INSERT INTO public.drivers (name, phone, license_no, salary_amount, salary_currency, salary_period, last_salary_update)
VALUES 
  ('Driver One', '+91-9111111111', 'DL01', 30000, 'INR', 'monthly', NOW()),
  ('Driver Two', '+91-9222222222', 'DL02', 32000, 'INR', 'monthly', NOW()),
  ('Driver Three', '+91-9333333333', 'DL03', NULL, 'INR', 'monthly', NULL),
  ('Driver Four', '+91-9444444444', 'DL04', 28000, 'INR', 'monthly', NOW()),
  ('Driver Five', '+91-9555555555', 'DL05', NULL, 'INR', 'monthly', NULL);
```

### Fix 2: Reset Everything
```sql
-- Delete all drivers (CAREFUL!)
DELETE FROM public.drivers;

-- Re-add fresh sample data
-- (Then run the INSERT commands from Fix 1)
```

### Fix 3: Check Data Exists
```sql
-- Quick check
SELECT name, salary_amount, salary_currency FROM public.drivers;
```

---

## 📁 Helpful Files

- **Debug SQL**: `supabase/debug-drivers-table.sql` (comprehensive checks)
- **Migration**: `supabase/migrations/2025-01-15-add-driver-salary-fields.sql`
- **Feature Guide**: `ADD_SALARY_BUTTON_FEATURE.md`
- **Quick Fix Guide**: `DRIVER_SALARY_URGENT_FIX.md`

---

## 🆘 Still Not Working?

If table is still empty after following all steps:

1. **Check Authentication:**
   - Are you logged in as admin?
   - Try logging out and back in

2. **Check Supabase Connection:**
   - Verify `.env.local` has correct Supabase URL and key
   - Check Supabase dashboard shows your project is active

3. **Check Network:**
   - Open DevTools → Network tab
   - Refresh page
   - Look for API calls to Supabase
   - Check if they return 200 OK or errors

4. **Check Component Mount:**
   - Console should show "✅ Loaded drivers"
   - If not, component may not be loading

5. **Try Different Browser:**
   - Clear cache and cookies
   - Try incognito/private mode
   - Try different browser entirely

---

## ✅ Success Indicators

You'll know it's working when you see:

- ✅ Statistics cards show real numbers (not ₹0.0K)
- ✅ Table rows appear with driver names
- ✅ "Add Salary Details" button is clickable
- ✅ Clicking button opens modal with driver dropdown
- ✅ Dropdown lists actual driver names
- ✅ Saving salary updates the table
- ✅ "Edit Salary" buttons work on each row
- ✅ Search bar filters drivers
- ✅ Console shows "Total drivers found: X" (where X > 0)

---

**Most Common Solution:** Add sample drivers to your database!

Run the SQL from Step 2 above, refresh your browser, and the table will populate. 🎉
