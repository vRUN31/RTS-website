# Driver Salary - Add & Edit Functionality Guide

## 🎯 Feature Overview

The admin can **both ADD and EDIT** driver salary details through a unified modal interface.

---

## 📋 How It Works

### 1️⃣ **Adding Salary (First Time Setup)**

When a driver doesn't have a salary set:

**Steps:**
1. Navigate to **Fleet Management** → Select a truck → Click **"💰 Driver Salary"** tab
2. Find the driver in the table (shows "Not Set" in red under Current Salary)
3. Click **"Edit Salary"** button on that driver's row
4. Modal opens with empty form:
   ```
   💰 Update Salary - [Driver Name]
   
   💵 Salary Amount: ___________ (e.g., 25000)
   
   🌍 Currency: [INR ▼]  📅 Payment Period: [Monthly ▼]
   
   📝 Notes (Optional): _______________________
   
   [💾 Save Salary]  [✖ Cancel]
   ```
5. Fill in the amount (required) and select currency/period
6. Click **"Save Salary"**
7. Salary is saved and table updates immediately

**Result:**
- Driver's row now shows salary amount in green: **₹25,000**
- Statistics update: "With Salary Set" count increases
- Total Monthly and Yearly Cost recalculate

---

### 2️⃣ **Editing Salary (Updating Existing Salary)**

When a driver already has a salary:

**Steps:**
1. Navigate to the Driver Salary tab
2. Find the driver in the table (shows current salary in green)
3. Click **"Edit Salary"** button on that driver's row
4. Modal opens **pre-filled** with current values:
   ```
   💰 Update Salary - [Driver Name]
   
   💵 Salary Amount: 25000 ← (current value)
   
   🌍 Currency: [INR ▼]  📅 Payment Period: [Monthly ▼]
   
   📝 Notes (Optional): Annual increment applied
   
   🕒 Last updated: 10/14/2025, 2:30:45 PM
   
   [💾 Save Salary]  [✖ Cancel]
   ```
5. Modify any field (amount, currency, period, or notes)
6. Click **"Save Salary"**
7. Updated salary saves and table refreshes

**Result:**
- Driver's row shows new salary amount
- "Last Updated" timestamp updates to current time
- Statistics recalculate with new values

---

## 🔍 Key Features

### **Same Button for Both Actions**
- The **"Edit Salary"** button serves both purposes:
  - ➕ **Add** salary if none exists (empty form)
  - ✏️ **Edit** salary if already set (pre-filled form)

### **Form Intelligence**
- Automatically detects if driver has existing salary
- Pre-fills form with current values for editing
- Shows "Last updated" info if salary was previously set
- Validates amount (must be non-negative number)

### **Real-Time Updates**
- No page refresh needed
- Statistics recalculate instantly
- Table updates immediately after save
- Success alert confirms save

---

## 💡 Usage Scenarios

### Scenario A: New Driver Onboarding
```
Driver: Rajesh Kumar
Current Status: No salary set
Action: Click "Edit Salary" → Enter ₹30,000 → Save
Result: Salary added, driver ready for assignment
```

### Scenario B: Annual Increment
```
Driver: Priya Sharma
Current Salary: ₹28,000/month
Action: Click "Edit Salary" → Change to ₹32,000 → Save
Result: Salary updated, history tracked via timestamp
```

### Scenario C: Payment Structure Change
```
Driver: Amit Patel
Current: ₹25,000/month
Action: Click "Edit Salary" → Change period to "Weekly" → Amount to ₹6,000 → Save
Result: Payment structure changed, monthly calculations adjust
```

### Scenario D: Currency Conversion
```
Driver: International hire
Current: ₹50,000/month (INR)
Action: Click "Edit Salary" → Change currency to USD → Amount to $600 → Save
Result: Currency updated, displayed with $ symbol
```

---

## 🎨 Visual Indicators

### In the Table:
| Status | Display | Color |
|--------|---------|-------|
| **No Salary** | "Not Set" | 🔴 Red (italic) |
| **Has Salary** | "₹25,000" | 🟢 Green (bold) |
| **Last Updated** | "10/14/2025" | ⚫ Gray |

### In the Modal:
| Element | When Adding | When Editing |
|---------|-------------|--------------|
| **Title** | "💰 Update Salary - [Name]" | "💰 Update Salary - [Name]" |
| **Amount Field** | Empty | Pre-filled with current |
| **Currency** | Default: INR | Current currency selected |
| **Period** | Default: Monthly | Current period selected |
| **Last Updated** | Not shown | "🕒 Last updated: [date]" |

---

## 🔒 Validation & Constraints

### Database Level:
- ✅ Salary amount must be ≥ 0 (or NULL)
- ✅ Payment period must be: 'monthly', 'weekly', or 'daily'
- ✅ Currency stored as text (any valid code)

### Form Level:
- ✅ Amount field is **required** (can't save empty)
- ✅ Must be a valid number with up to 2 decimal places
- ✅ Currency auto-defaults to INR if not changed
- ✅ Period auto-defaults to monthly if not changed

### Business Logic:
- ✅ Statistics auto-convert weekly/daily to monthly for totals
- ✅ Weekly: amount × 4.33 = monthly equivalent
- ✅ Daily: amount × 30 = monthly equivalent

---

## 📊 Statistics Dashboard

After adding/editing salaries, statistics auto-update:

```
┌─────────────────┬─────────────────┬─────────────────┐
│ 👨‍✈️ Total Drivers │ ✓ With Salary   │ ⚠️ Pending      │
│      12         │       8         │       4         │
└─────────────────┴─────────────────┴─────────────────┘

┌─────────────────┬─────────────────┬─────────────────┐
│ 💰 Total Monthly│ 📊 Avg Monthly  │ 📈 Yearly Cost  │
│   ₹2.4L         │   ₹30.0K        │   ₹28.8L        │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## 🚀 Database Migration Required

**Before using this feature**, execute the migration:

### Option 1: Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project → SQL Editor
3. Copy contents of: `supabase/migrations/2025-01-15-add-driver-salary-fields.sql`
4. Paste and click **"Run"**
5. Verify success ✅

### Option 2: Direct SQL (Quick)
Run these in SQL Editor one by one:

```sql
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS salary_amount numeric(10, 2) DEFAULT NULL;

ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'INR';

ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS salary_period text DEFAULT 'monthly';

ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS last_salary_update timestamptz DEFAULT NULL;

ALTER TABLE public.drivers
ADD CONSTRAINT salary_period_check 
CHECK (salary_period IN ('monthly', 'weekly', 'daily'));

ALTER TABLE public.drivers
ADD CONSTRAINT salary_amount_check 
CHECK (salary_amount IS NULL OR salary_amount >= 0);
```

---

## 🎬 Demo Workflow

### Complete Add & Edit Flow:

```
1. Login as Admin
   ↓
2. Navigate to Fleet Management
   ↓
3. Select Truck from Modal (e.g., "Truck-001")
   ↓
4. Click "💰 Driver Salary" Tab
   ↓
5. See driver table (some with salary, some without)
   ↓
6. ADDING SALARY:
   - Find driver with "Not Set" (red)
   - Click "Edit Salary"
   - Fill amount: 25000
   - Select currency: INR
   - Select period: Monthly
   - Click "Save Salary"
   - ✅ Success alert appears
   - Table shows ₹25,000 in green
   ↓
7. EDITING SALARY:
   - Find same driver (now shows ₹25,000)
   - Click "Edit Salary"
   - Form pre-filled with 25000
   - Change to: 28000
   - Add note: "Annual increment 2025"
   - Click "Save Salary"
   - ✅ Success alert appears
   - Table shows ₹28,000 in green
   - Last Updated shows current date
```

---

## 🛠️ Technical Implementation

### Component: `DriverSalary.client.tsx`

**State Management:**
```typescript
const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
const [salaryForm, setSalaryForm] = useState({
  salary_amount: '',
  salary_currency: 'INR',
  salary_period: 'monthly',
  notes: ''
});
```

**Add/Edit Detection:**
```typescript
function handleEditClick(driver: Driver) {
  setEditingDriver(driver);
  setSalaryForm({
    salary_amount: driver.salary_amount?.toString() || '',  // Pre-fill if exists
    salary_currency: driver.salary_currency || 'INR',       // or default
    salary_period: driver.salary_period || 'monthly',       // or default
    notes: ''
  });
}
```

**Save Logic (Works for Both):**
```typescript
async function handleUpdateSalary(e: React.FormEvent) {
  e.preventDefault();
  
  const { error } = await supabase
    .from('drivers')
    .update({
      salary_amount: parseFloat(salaryForm.salary_amount),
      salary_currency: salaryForm.salary_currency,
      salary_period: salaryForm.salary_period,
      last_salary_update: new Date().toISOString(),
    })
    .eq('id', editingDriver.id);
  
  if (!error) {
    alert('Salary updated successfully!');
    loadDrivers(); // Refresh table
    setEditingDriver(null); // Close modal
  }
}
```

---

## ✅ Summary

**The system already supports BOTH operations:**
- ✅ Add salary (when none exists)
- ✅ Edit salary (when already set)
- ✅ Same intuitive interface for both
- ✅ Form intelligence (empty vs. pre-filled)
- ✅ Real-time statistics updates
- ✅ Full validation and constraints
- ✅ Timestamp tracking for auditing

**Just execute the migration and you're ready to go!** 🚀

---

**File Locations:**
- Component: `src/components/fleet/DriverSalary.client.tsx`
- Migration: `supabase/migrations/2025-01-15-add-driver-salary-fields.sql`
- Styling: `src/app/globals.css` (lines ~5275-5725)
