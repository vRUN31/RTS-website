# 🚀 Quick Test Guide - Email Fixes

## ⚡ TL;DR

**Problem**: Client emails not sending (null client_id + wrong column name)
**Status**: ✅ **FIXED** - All 3 routes updated, migration created
**Next**: Test booking approval to verify

---

## 📋 Pre-Test Checklist

- [ ] Migration applied: `supabase/migrations/2025-10-15-ensure-booking-client-id.sql`
- [ ] Server running: `npm run dev` (no compile errors)
- [ ] SMTP configured: Check `.env.local` has all `SMTP_*` variables
- [ ] Test booking exists: At least one booking with status='submitted'
- [ ] Test truck has driver: The truck you'll assign must have a driver

---

## 🧪 Quick Test (5 minutes)

### 1. Start Server (if not running)
```bash
npm run dev
```

### 2. Login as Admin
```
URL: http://localhost:3001/admin
Credentials: Your admin account
```

### 3. Approve a Booking
1. Scroll to "Pending Bookings"
2. Click "Approve" on any booking
3. Select a truck WITH driver assigned
4. Click "Confirm Assignment"

### 4. Check Console Output

**✅ SUCCESS Pattern**:
```
[approve api] Client profile fetch result: {
  clientId: '<uuid>',
  found: true,
  hasEmail: true,
  email: 'client@example.com',
  name: 'Client Name',
  error: undefined
}
✅ [approve api] Client email sent successfully to: client@example.com
```

**❌ FAILURE Pattern**:
```
[approve api] Client profile fetch result: {
  found: false,
  hasEmail: false,
  error: '...'
}
⚠️ [approve api] No client email available, skipping client notification
```

### 5. Check Email Inbox
- Login to client's email (from profiles table)
- Check inbox **and spam folder**
- Look for: "✅ Booking Approved - ..."

---

## 🎯 What Was Fixed

### Fix #1: Column Name
```diff
- .select('email, full_name')
- clientProfile.full_name
+ .select('email, name')
+ clientProfile.name
```

### Fix #2: Null client_id Handling
```typescript
const clientIdForEmail = booking.client_id || booking.user_id;
```

### Fix #3: Database Migration
- Backfills existing bookings
- Adds trigger for new bookings

---

## 🔧 Quick Fixes if Still Broken

### Missing Profile Email
```sql
UPDATE profiles 
SET email = 'client@example.com' 
WHERE id = '<user-id>';
```

### Missing Client ID
```sql
-- Check booking
SELECT id, user_id, client_id FROM bookings WHERE id = '<booking-id>';

-- Apply migration if not already done
-- Run: supabase/migrations/2025-10-15-ensure-booking-client-id.sql
```

### SMTP Issues
```bash
# Test SMTP connection
node scripts/test-email.js

# Verify .env.local has:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

---

## 📞 Support

**Full Documentation**: See `Documents/EMAIL_FIXES_SUMMARY.md`

**Console Logs**: All routes now have detailed logging:
- Shows clientId used for lookup
- Shows if profile was found
- Shows if email exists
- Shows any errors

**Database Queries**:
```sql
-- Check profile
SELECT * FROM profiles WHERE id = '<user-id>';

-- Check booking
SELECT * FROM bookings WHERE id = '<booking-id>';

-- Check if migration ran
SELECT COUNT(*) FROM bookings WHERE client_id IS NULL;
```

---

## ✅ Success!

If you see this in console:
```
✅ [approve api] Client email sent successfully to: client@example.com
```

And client receives the email → **YOU'RE DONE!** 🎉

The same fix applies to:
- `/api/bookings/approve/route.ts` - ✅ Fixed
- `/api/shipments/[id]/start/route.ts` - ✅ Fixed
- `/api/shipments/[id]/end/route.ts` - ✅ Fixed

All three email types should now work! 🚀
