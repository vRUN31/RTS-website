-- Quick check for Tejas Bhosale's salary data
-- Run this in Supabase SQL Editor to see the actual data

-- 1. Find Tejas Bhosale in drivers table
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
WHERE name ILIKE '%tejas%' OR name ILIKE '%bhosale%';

-- 2. Check ALL drivers with their salary info
SELECT 
  id,
  name,
  phone,
  salary_amount,
  salary_currency,
  salary_period,
  to_char(last_salary_update, 'YYYY-MM-DD HH24:MI:SS') as last_updated
FROM public.drivers
ORDER BY name;

-- 3. Check if salary columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'drivers' 
  AND column_name IN ('salary_amount', 'salary_currency', 'salary_period', 'last_salary_update');

-- 4. Check TRK101 and its driver
SELECT 
  t.id as truck_id,
  t.display_code,
  t.plate,
  t.driver_id,
  d.name as driver_name,
  d.phone,
  d.salary_amount,
  d.salary_currency,
  d.salary_period
FROM public.trucks t
LEFT JOIN public.drivers d ON d.id = t.driver_id
WHERE t.display_code = 'TRK101';
