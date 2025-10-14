-- Add salary-related columns to drivers table
-- Migration: 2025-01-15 - Add Driver Salary Fields

-- Add salary amount column (numeric for precise currency calculations)
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS salary_amount numeric(10, 2) DEFAULT NULL;

-- Add salary currency column (defaults to INR)
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'INR';

-- Add salary period column (monthly, weekly, daily)
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS salary_period text DEFAULT 'monthly';

-- Add last salary update timestamp
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS last_salary_update timestamptz DEFAULT NULL;

-- Add check constraint for valid salary periods
ALTER TABLE public.drivers
ADD CONSTRAINT salary_period_check 
CHECK (salary_period IN ('monthly', 'weekly', 'daily'));

-- Add check constraint for valid salary amounts (must be non-negative)
ALTER TABLE public.drivers
ADD CONSTRAINT salary_amount_check 
CHECK (salary_amount IS NULL OR salary_amount >= 0);

-- Add index on salary_amount for faster queries
CREATE INDEX IF NOT EXISTS idx_drivers_salary_amount ON public.drivers(salary_amount);

-- Add index on last_salary_update for faster queries
CREATE INDEX IF NOT EXISTS idx_drivers_last_salary_update ON public.drivers(last_salary_update);

-- Add comment to document the columns
COMMENT ON COLUMN public.drivers.salary_amount IS 'Driver salary amount in the specified currency';
COMMENT ON COLUMN public.drivers.salary_currency IS 'Currency code for salary (e.g., INR, USD, EUR)';
COMMENT ON COLUMN public.drivers.salary_period IS 'Payment period: monthly, weekly, or daily';
COMMENT ON COLUMN public.drivers.last_salary_update IS 'Timestamp of last salary modification';
