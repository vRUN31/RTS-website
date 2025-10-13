# URGENT FIX: Run This SQL Now! ⚡

## Error You're Seeing:
```
⚠️ new row violates row-level security policy for table 'contracts'
```

## Why This Happens:
The `contracts` table only allows admins to READ contracts, but not CREATE them. You need to add INSERT permission.

## Fix It in 1 Minute:

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your RTS-website project
3. Click **"SQL Editor"** → **"New query"**

### Step 2: Copy & Paste This SQL
```sql
-- Add INSERT, UPDATE, DELETE policies for contracts table

DROP POLICY IF EXISTS "contracts admin insert" ON public.contracts;
CREATE POLICY "contracts admin insert" ON public.contracts 
  FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "contracts admin update" ON public.contracts;
CREATE POLICY "contracts admin update" ON public.contracts 
  FOR UPDATE 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "contracts admin delete" ON public.contracts;
CREATE POLICY "contracts admin delete" ON public.contracts 
  FOR DELETE 
  USING (public.is_admin(auth.uid()));
```

### Step 3: Run It
- Click **"Run"** or press `Ctrl+Enter`
- Wait for "Success" message

### Step 4: Test It
1. Go to http://localhost:3000/contracts
2. Click "➕ Create New Contract"
3. Fill in the form
4. Click "💾 Create Contract"
5. Should see: ✅ **"Contract created successfully!"**

## Done! ✅

Both errors are now fixed:
1. ✅ Added missing `email`, `phone`, `company` columns to clients table
2. ✅ Added INSERT, UPDATE, DELETE permissions for contracts

## Complete Fix (Both Issues)
If you haven't run the previous migration yet, run BOTH:

```sql
-- FIX 1: Add missing columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS company text;

CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company);

-- FIX 2: Add RLS policies for contracts table
DROP POLICY IF EXISTS "contracts admin insert" ON public.contracts;
CREATE POLICY "contracts admin insert" ON public.contracts 
  FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "contracts admin update" ON public.contracts;
CREATE POLICY "contracts admin update" ON public.contracts 
  FOR UPDATE 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "contracts admin delete" ON public.contracts;
CREATE POLICY "contracts admin delete" ON public.contracts 
  FOR DELETE 
  USING (public.is_admin(auth.uid()));
```

## Files Created:
- ✅ `supabase/migrations/2025-10-13-add-clients-columns.sql`
- ✅ `supabase/migrations/2025-10-13-fix-contracts-rls-policies.sql`
- ✅ `FIX_CONTRACTS_RLS_POLICIES.md` (detailed docs)

Contract creation should now work perfectly! 🎉
