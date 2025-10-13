# QUICK FIX: Run This SQL Now! ⚡

## Error You're Seeing:
```
⚠️ Could not find the 'company' column of 'clients' in the schema cache
```

## Fix It in 2 Minutes:

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your RTS-website project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"**

### Step 2: Copy & Paste This SQL
```sql
-- Add missing columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS company text;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company);
```

### Step 3: Run It
- Click **"Run"** button or press `Ctrl+Enter`
- Wait for "Success" message

### Step 4: Test It
1. Go to http://localhost:3000/contracts
2. Click "➕ Create New Contract"
3. Fill in the form (include company, email, phone)
4. Click "💾 Create Contract"
5. Should see: ✅ **"Contract created successfully!"**

## Done! ✅

The error is now fixed. Contract creation will work perfectly.

## What This Does:
- Adds 3 missing columns to `clients` table: `email`, `phone`, `company`
- Creates indexes for fast lookups
- Allows contract creation form to save client information properly

## Files Created:
- ✅ `supabase/migrations/2025-10-13-add-clients-columns.sql` (full migration)
- ✅ `supabase/schema.sql` (updated with new columns)
- ✅ `FIX_CLIENTS_TABLE_SCHEMA.md` (detailed documentation)

## Need Help?
If you still see the error after running the SQL:
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Restart dev server: Stop and run `npm run dev` again
3. Try in incognito window
