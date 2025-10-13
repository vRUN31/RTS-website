-- Add missing columns to clients table for contract creation
-- Run this in Supabase SQL Editor

-- Add email and phone columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS company text;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company);

-- Add comment to document the schema
COMMENT ON COLUMN public.clients.email IS 'Client primary email address';
COMMENT ON COLUMN public.clients.phone IS 'Client phone number';
COMMENT ON COLUMN public.clients.company IS 'Client company name';

-- Show success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added email, phone, and company columns to clients table';
END $$;
