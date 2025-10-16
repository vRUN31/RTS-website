# Client Email Not Sending - Troubleshooting Guide

## 🔍 Quick Diagnosis

### Step 1: Restart Dev Server (REQUIRED)

**Environment variables are loaded only on server start!**

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

⚠️ **This is the most common issue!** If you just updated `.env.local`, you MUST restart.

---

## Step 2: Test SMTP Configuration

Run the test script to verify your SMTP setup:

```bash
node scripts/test-email.js
```

This will:
- ✅ Check all environment variables are set
- ✅ Verify SMTP connection
- ✅ Send a test email to verify everything works

**Expected Output:**
```
🧪 Testing SMTP Email Configuration...

📋 Environment Variables:
  SMTP_HOST: smtp.gmail.com
  SMTP_PORT: 587
  SMTP_SECURE: false
  SMTP_USER: ✅ SET
  SMTP_PASS: ✅ SET (hidden)
  SMTP_FROM_NAME: Rajmohan Transport Services
  SMTP_FROM_EMAIL: vicharevarun999@gmail.com

🔧 Creating SMTP transporter...
🔍 Verifying SMTP connection...
✅ SMTP connection verified successfully!
```

---

## Step 3: Check Console Logs

When you approve a booking, check the **server console** (not browser console) for these logs:

### ✅ **GOOD** - Working correctly:
```
[approve api] Sending email notification to client...
[approve api] Client ID: <some-uuid>
[approve api] Client profile fetch result: { found: true, hasEmail: true, email: 'client@example.com', error: undefined }
[approve api] Preparing client email data...
[approve api] Trip analysis: { distance: 1000, time: '12h 30m', days: 0 }
📧 Preparing to send booking approval email to: client@example.com
✅ Client booking approval email sent successfully: <message-id>
✅ [approve api] Client email sent successfully to: client@example.com
```

### ❌ **BAD** - Issues to fix:

**Issue 1: No logs at all**
```
[approve api] Success - booking approved
```
**Solution:** Email code not being executed. Check the route file wasn't reverted.

**Issue 2: SMTP not configured**
```
⚠️ Email not configured. Skipping client email send.
```
**Solution:** Environment variables not loaded. Restart dev server!

**Issue 3: No client profile**
```
[approve api] Client profile fetch result: { found: false, hasEmail: false, email: undefined, error: 'No rows found' }
⚠️ [approve api] No client email available, skipping client notification
```
**Solution:** Client profile doesn't exist or has no email. Check database.

**Issue 4: Trip analysis failed**
```
❌ Trip analysis failed - cannot send client email
```
**Solution:** Invalid vehicle type or distance. Check booking data.

**Issue 5: SMTP authentication failed**
```
❌ Failed to send client booking approval email: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution:** Wrong Gmail App Password. Generate a new one.

---

## Common Issues & Solutions

### 🔴 Issue #1: Email Not Sending (No Logs)

**Symptoms:**
- Booking approval succeeds
- No "[approve api] Sending email notification to client..." log
- No errors shown

**Causes:**
1. Dev server not restarted after `.env.local` changes
2. Code changes not saved
3. Wrong API route being called

**Solutions:**
```bash
# 1. Restart dev server
Ctrl+C  # Stop server
npm run dev  # Restart

# 2. Check if changes were saved
git status

# 3. Clear Next.js cache
rm -rf .next
npm run dev
```

---

### 🔴 Issue #2: "SMTP not configured"

**Symptoms:**
```
⚠️ Email not configured. Skipping client email send.
```

**Cause:** Environment variables not loaded

**Solution:**
1. Check `.env.local` has correct variable names:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM_NAME=Rajmohan Transport Services
   SMTP_FROM_EMAIL=your-email@gmail.com
   ```

2. **RESTART DEV SERVER** (most important!)
   ```bash
   Ctrl+C
   npm run dev
   ```

3. Verify variables are loaded:
   ```bash
   node scripts/test-email.js
   ```

---

### 🔴 Issue #3: "No client email available"

**Symptoms:**
```
⚠️ [approve api] No client email available, skipping client notification
```

**Cause:** Client profile doesn't have an email

**Solution:**
1. Check Supabase `profiles` table
2. Find the client's profile by `client_id`
3. Ensure `email` column has a valid email address
4. Update if missing:
   ```sql
   UPDATE profiles 
   SET email = 'client@example.com' 
   WHERE id = '<client-id>';
   ```

---

### 🔴 Issue #4: "Invalid login: Username and Password not accepted"

**Symptoms:**
```
❌ Failed to send email: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Cause:** Using regular Gmail password instead of App Password

**Solution:**
1. Enable 2-factor authentication on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Generate new App Password for "Mail"
4. Copy the 16-character password (no spaces)
5. Update `.env.local`:
   ```bash
   SMTP_PASS=abcdefghijklmnop  # Your actual App Password
   ```
6. **RESTART DEV SERVER**

**Video Guide:** https://support.google.com/accounts/answer/185833

---

### 🔴 Issue #5: Email Sent But Not Received

**Symptoms:**
```
✅ [approve api] Client email sent successfully
```
But client doesn't receive email.

**Possible Causes:**
1. Email in spam folder
2. Wrong email address
3. Gmail blocking emails
4. Email quota exceeded

**Solutions:**

**Check Spam Folder:**
- Look in spam/junk folder
- Mark as "Not Spam" if found

**Verify Email Address:**
```sql
-- Check client's email in Supabase
SELECT id, email, full_name FROM profiles WHERE role = 'client';
```

**Check Gmail Sent Folder:**
- Login to the Gmail account (SMTP_USER)
- Check "Sent" folder
- If not there, email wasn't actually sent

**Whitelist Sender:**
- Add sender to client's contacts
- Create filter to always inbox

**Check Daily Limits:**
- Gmail: 500 emails/day (free), 2000/day (Workspace)
- Wait 24 hours if limit reached

---

### 🔴 Issue #6: Port 587 Blocked

**Symptoms:**
```
❌ SMTP connection failed: Connection timeout
```

**Cause:** Firewall or ISP blocking SMTP port

**Solutions:**

**Try Port 465 (SSL):**
```bash
# In .env.local
SMTP_PORT=465
SMTP_SECURE=true
```

**Check Firewall:**
```bash
# Windows
Test-NetConnection -ComputerName smtp.gmail.com -Port 587

# Expected: TcpTestSucceeded : True
```

**Use VPN:** Some ISPs block SMTP ports

---

## Debug Checklist

Use this checklist to diagnose issues:

- [ ] `.env.local` file exists with all SMTP variables
- [ ] Variable names are correct (`SMTP_*`, not `EMAIL_*`)
- [ ] **Dev server restarted after .env changes**
- [ ] `node scripts/test-email.js` passes
- [ ] SMTP_PASS is Gmail App Password (not regular password)
- [ ] 2-factor authentication enabled on Gmail
- [ ] Client profile exists in `profiles` table
- [ ] Client profile has valid `email` address
- [ ] Booking has `client_id` set
- [ ] Console shows "[approve api] Sending email notification to client..."
- [ ] Console shows "✅ Client email sent successfully"
- [ ] Checked spam folder
- [ ] Port 587 not blocked by firewall

---

## Testing Workflow

### Test Email System End-to-End

1. **Verify SMTP Setup:**
   ```bash
   node scripts/test-email.js
   ```
   Enter your own email to receive test.

2. **Restart Dev Server:**
   ```bash
   Ctrl+C
   npm run dev
   ```

3. **Open Two Browser Windows:**
   - Window 1: Admin dashboard (http://localhost:3000/admin)
   - Window 2: Client email inbox

4. **Create Test Booking:**
   - Login as client
   - Create new booking
   - Use YOUR email for testing

5. **Approve Booking:**
   - Switch to admin window
   - Go to "Pending Bookings"
   - Approve the booking
   - Watch server console for logs

6. **Check Email:**
   - Should receive email within 5-10 seconds
   - Check spam if not in inbox
   - Verify all data is correct

7. **Test Trip Start:**
   - Admin: "Start Trip"
   - Check email inbox

8. **Test Trip End:**
   - Admin: "End Trip"
   - Check email inbox

---

## Environment Variables Reference

**Correct `.env.local` format:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAIL_DOMAINS=rts.co.in
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com

# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Email Sender Details
SMTP_FROM_NAME=Rajmohan Transport Services
SMTP_FROM_EMAIL=your-email@gmail.com

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**⚠️ Common Mistakes:**
- ❌ `EMAIL_FROM_NAME` instead of `SMTP_FROM_NAME`
- ❌ `EMAIL_FROM_EMAIL` instead of `SMTP_FROM_EMAIL`
- ❌ Using regular Gmail password instead of App Password
- ❌ Forgetting to restart dev server
- ❌ Having duplicate SMTP configurations

---

## Quick Fixes

### "Cannot find module 'nodemailer'"
```bash
npm install nodemailer
```

### "SMTP connection timeout"
```bash
# Try alternative port
SMTP_PORT=465
SMTP_SECURE=true
```

### "Environment variable not found"
```bash
# Restart dev server
Ctrl+C
npm run dev
```

### "No rows found" (client profile)
```sql
-- Add email to client profile
UPDATE profiles SET email = 'client@example.com' WHERE id = '<client-id>';
```

---

## Still Not Working?

### Enable Maximum Debug Logging

Add this to the approval route temporarily:

```typescript
// At the top of the try block
console.log('🔍 [DEBUG] All env vars:', {
  SMTP_HOST: !!process.env.SMTP_HOST,
  SMTP_PORT: !!process.env.SMTP_PORT,
  SMTP_USER: !!process.env.SMTP_USER,
  SMTP_PASS: !!process.env.SMTP_PASS,
});

// Before client profile fetch
console.log('🔍 [DEBUG] Booking data:', {
  client_id: booking.client_id,
  source: booking.source_city,
  destination: booking.destination_city,
});
```

### Check Network

```bash
# Test SMTP connection
telnet smtp.gmail.com 587
# Should connect successfully
```

### Contact Support

If still having issues, provide:
1. Full console logs (server console, not browser)
2. Screenshot of `.env.local` (hide SMTP_PASS)
3. Output of `node scripts/test-email.js`
4. Screenshot of Supabase profiles table
5. Node.js version: `node --version`

---

## Success Indicators

When everything works, you'll see:

**Server Console:**
```
[approve api] Sending email notification to client...
[approve api] Client ID: abc123...
[approve api] Client profile fetch result: { found: true, hasEmail: true, email: 'client@example.com' }
[approve api] Preparing client email data...
[approve api] Trip analysis: { distance: 1000, time: '12h 30m', days: 0 }
📧 Preparing to send booking approval email to: client@example.com
✅ SMTP connection verified successfully
✅ Client booking approval email sent successfully: <1234567890@gmail.com>
✅ [approve api] Client email sent successfully to: client@example.com
```

**Email Inbox:**
- ✅ Email received within 10 seconds
- ✅ Subject: "✅ Booking Approved - [Source] → [Destination]"
- ✅ Professional HTML design
- ✅ Accurate distance and time (NOT 500km/10h)
- ✅ All booking details correct

---

**Last Updated:** October 2025  
**Version:** 1.0.0
