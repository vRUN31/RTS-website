# Quick Setup Guide: Contract Management Features

## 🚀 Step-by-Step Setup

### Step 1: Run Database Migration
1. Open **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/2025-10-12-contract-enhancements.sql`
4. Copy all contents
5. Paste into SQL Editor
6. Click **Run** button
7. Verify success message appears

**Expected Output:**
```
Success: Tables created, RLS enabled, functions added
```

---

### Step 2: Create Storage Bucket
1. Open **Supabase Dashboard**
2. Navigate to **Storage** section
3. Click **New bucket** button
4. Configure:
   - **Name**: `contract-documents`
   - **Public**: ✅ Yes
   - **File size limit**: `10485760` (10MB in bytes)
   - **Allowed MIME types**: 
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.*`
     - `image/jpeg`
     - `image/png`
5. Click **Create bucket**

**Screenshot Expected:**
- Bucket appears in storage list
- Status shows "Public"

---

### Step 3: Enable Realtime (Verify)
1. Open **Supabase Dashboard**
2. Navigate to **Database** → **Replication**
3. Verify these tables are in realtime publication:
   - ✅ `contract_notifications`
   - ✅ `contract_documents`
4. If missing, run in SQL Editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE contract_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE contract_documents;
```

---

### Step 4: Test Document Upload (Admin)
1. Start dev server: `npm run dev`
2. Login as **admin**
3. Navigate to **Contracts** page
4. Click **Create New Contract**
5. Fill in all fields (client info, dates, financial terms, etc.)
6. Click **Create Contract**
7. Contract card should appear
8. Click **View Details** to expand
9. Click **Upload Document**
10. Select a PDF file
11. Choose document type
12. Click **Upload**
13. Document should appear in list

**Expected Behavior:**
- ✅ File uploads successfully
- ✅ Document appears immediately (real-time)
- ✅ Download button works
- ✅ Delete button works (admin only)

---

### Step 5: Test Expiry Notifications
1. Manually trigger notification checker:
```sql
-- Run in Supabase SQL Editor
SELECT check_expiring_contracts();
```

2. Navigate to **Contracts** page
3. Notifications component should show:
   - Contracts expiring in 90/60/30/7 days
   - Unread count badge
   - Priority indicators

**Expected Behavior:**
- ✅ Notifications appear automatically
- ✅ Real-time updates when new notifications arrive
- ✅ Mark as read works
- ✅ Priority badges show correct colors

---

### Step 6: Test Client Contract View
1. Login as **client** (not admin)
2. Navigate to `/dashboard/client-contracts`
3. Should see:
   - Statistics cards (Total, Active, Documents, Notifications)
   - Notifications section at top
   - Contract cards with status badges
   - Filter dropdown (All/Active/Expired)

4. Click **View Details** on a contract
5. Should see:
   - Document list (public documents only)
   - Download buttons for files
   - Progress bar for active contracts
   - Days remaining counter

**Expected Behavior:**
- ✅ Client sees only their contracts
- ✅ Can download public documents
- ✅ Cannot delete documents
- ✅ Statistics are accurate
- ✅ Notifications show their alerts

---

## 🔧 Troubleshooting

### Problem: "Failed to load contracts"
**Solution:**
- Check user has `client_id` in profiles table:
```sql
SELECT id, client_id FROM profiles WHERE id = auth.uid();
```
- If null, create client first:
```sql
INSERT INTO clients (name, email) VALUES ('Test Client', 'client@test.com');
UPDATE profiles SET client_id = (SELECT id FROM clients WHERE email = 'client@test.com') WHERE id = auth.uid();
```

---

### Problem: "Failed to upload document"
**Solution:**
- Verify storage bucket exists: `contract-documents`
- Check bucket is public
- Verify RLS policies on `contract_documents` table:
```sql
SELECT * FROM pg_policies WHERE tablename = 'contract_documents';
```
- Should see policies for admin (all) and client (select)

---

### Problem: "Notifications not showing"
**Solution:**
- Run expiry checker manually:
```sql
SELECT check_expiring_contracts();
```
- Verify notifications exist:
```sql
SELECT * FROM contract_notifications ORDER BY sent_at DESC LIMIT 10;
```
- Check realtime is enabled:
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

---

### Problem: "Documents not visible to client"
**Solution:**
- Check `is_public` flag on document:
```sql
SELECT id, file_name, is_public FROM contract_documents WHERE contract_id = 'your-contract-id';
```
- Update if needed:
```sql
UPDATE contract_documents SET is_public = true WHERE id = 'doc-id';
```

---

## 🎯 Quick Test Script

Run this in **SQL Editor** to create test data:

```sql
-- 1. Create test client
INSERT INTO clients (name, email, phone, company)
VALUES ('Test Company', 'test@company.com', '+91 9876543210', 'Test Corp')
RETURNING id;

-- 2. Create test contract (use client id from above)
INSERT INTO contracts (
  client_id, 
  start_at, 
  end_at, 
  status,
  contract_type,
  value,
  routes,
  vehicle_types,
  payment_terms,
  billing_cycle,
  frequency
) VALUES (
  'client-id-here',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '45 days', -- Expiring in 45 days
  'active',
  'Fixed Term',
  500000,
  'Mumbai-Delhi, Delhi-Bangalore',
  'Truck (9T), Trailer (25T)',
  'Net 30',
  'Monthly',
  'Weekly'
) RETURNING id;

-- 3. Generate expiry notification
SELECT check_expiring_contracts();

-- 4. Verify notification was created
SELECT * FROM contract_notifications ORDER BY sent_at DESC LIMIT 5;
```

---

## 📊 Verification Checklist

### Database:
- [ ] `contract_documents` table exists
- [ ] `contract_notifications` table exists
- [ ] `contracts` table has new columns (status, contract_type, etc.)
- [ ] `get_client_contracts()` function exists
- [ ] `check_expiring_contracts()` function exists
- [ ] RLS policies are enabled on all tables

### Storage:
- [ ] `contract-documents` bucket exists
- [ ] Bucket is public
- [ ] File size limit is 10MB
- [ ] MIME types are configured

### Realtime:
- [ ] `contract_notifications` in realtime publication
- [ ] `contract_documents` in realtime publication
- [ ] Real-time subscriptions work in browser

### UI:
- [ ] Admin can create contracts with all fields
- [ ] Admin can upload documents
- [ ] Admin can delete documents
- [ ] Client can view their contracts
- [ ] Client can download public documents
- [ ] Client cannot delete documents
- [ ] Notifications show in real-time
- [ ] Statistics cards show correct numbers
- [ ] Filter works (All/Active/Expired)
- [ ] Dark mode looks good
- [ ] Mobile responsive

---

## 🎬 Demo Flow

### Admin Demo (5 minutes):
1. **Login** as admin
2. **Create Contract** → Fill comprehensive form
3. **Upload Documents** → Add PDF, insurance cert
4. **Set Visibility** → Make some public, some private
5. **View Notifications** → Check expiry alerts
6. **Filter Contracts** → Show active only
7. **Dark Mode** → Toggle theme

### Client Demo (3 minutes):
1. **Login** as client
2. **View Dashboard** → See statistics
3. **Check Notifications** → Review expiry alerts
4. **Expand Contract** → View details
5. **Download Document** → Get contract PDF
6. **Track Progress** → View progress bar
7. **Filter** → Show only active contracts

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify all migration steps completed
4. Test with fresh browser session (clear cache)

---

**Setup Time**: ~15 minutes
**Status**: Ready for Production ✅
**Last Updated**: October 12, 2025
