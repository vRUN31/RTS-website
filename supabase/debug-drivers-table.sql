-- Check if drivers exist in the database
-- Run this in Supabase SQL Editor to debug the empty table issue

-- Step 1: Check how many drivers exist
SELECT COUNT(*) as total_drivers FROM public.drivers;

-- Step 2: View all drivers (if any)
SELECT 
  id,
  name,
  phone,
  license_no,
  salary_amount,
  salary_currency,
  salary_period,
  last_salary_update,
  created_at
FROM public.drivers
ORDER BY name;

-- Step 3: Check if salary columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'drivers'
  AND column_name IN ('salary_amount', 'salary_currency', 'salary_period', 'last_salary_update')
ORDER BY column_name;

-- Step 4: Add sample drivers (if none exist)
-- ONLY RUN THIS IF THE TABLE IS EMPTY!
-- Uncomment the lines below to add sample data:

/*
INSERT INTO public.drivers (name, phone, license_no, license_expiry, experience_years, address, emergency_contact)
VALUES 
  ('Rajesh Kumar', '+91-9876543210', 'DL12AB1234', '2026-12-31', 5, 'Mumbai, Maharashtra', '+91-9876543211'),
  ('Amit Patel', '+91-9876543220', 'GJ05CD5678', '2027-06-30', 8, 'Ahmedabad, Gujarat', '+91-9876543221'),
  ('Priya Sharma', '+91-9876543230', 'MH02EF9012', '2025-09-15', 3, 'Pune, Maharashtra', '+91-9876543231'),
  ('Vikram Singh', '+91-9876543240', 'RJ14GH3456', '2028-03-20', 10, 'Jaipur, Rajasthan', '+91-9876543241'),
  ('Sunita Verma', '+91-9876543250', 'UP32IJ7890', '2026-11-10', 6, 'Lucknow, Uttar Pradesh', '+91-9876543251')
ON CONFLICT (id) DO NOTHING;

-- Add salaries for some drivers
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
*/

-- Step 5: Verify the data was added
SELECT 
  name,
  phone,
  salary_amount,
  salary_currency,
  salary_period,
  CASE 
    WHEN salary_amount IS NOT NULL THEN 'Has Salary'
    ELSE 'No Salary'
  END as salary_status
FROM public.drivers
ORDER BY name;

-- Step 6: Check statistics (what the dashboard shows)
SELECT 
  COUNT(*) as total_drivers,
  COUNT(salary_amount) as with_salary,
  COUNT(*) - COUNT(salary_amount) as without_salary,
  COALESCE(SUM(
    CASE 
      WHEN salary_period = 'monthly' THEN salary_amount
      WHEN salary_period = 'weekly' THEN salary_amount * 4.33
      WHEN salary_period = 'daily' THEN salary_amount * 30
      ELSE 0
    END
  ), 0) as total_monthly_salary,
  COALESCE(AVG(
    CASE 
      WHEN salary_amount IS NOT NULL AND salary_period = 'monthly' THEN salary_amount
      WHEN salary_amount IS NOT NULL AND salary_period = 'weekly' THEN salary_amount * 4.33
      WHEN salary_amount IS NOT NULL AND salary_period = 'daily' THEN salary_amount * 30
      ELSE NULL
    END
  ), 0) as avg_monthly_salary
FROM public.drivers;

-- Expected Output:
-- If drivers exist: You'll see them listed
-- If no drivers: total_drivers = 0
-- If migration worked: salary columns will show in Step 3
-- If you added sample data: Step 5 will show drivers with/without salaries
