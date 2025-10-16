# 🚀 QUICK START: Email Notifications for Driver Assignment

## ✅ Implementation Complete!

Professional email system that sends trip assignment notifications to drivers when admin approves bookings.

---

## 📋 Setup (3 Steps)

### **Step 1: Configure Gmail SMTP (Recommended)**

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to: https://myaccount.google.com/security
   - Turn on 2-Step Verification

2. **Create App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select: "Mail" and "Windows Computer"
   - Click "Generate"
   - **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

3. **Add to `.env.local`**:

```env
# Add these lines to your .env.local file:

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-actual-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop

SMTP_FROM_NAME=Rajmohan Transport Services
SMTP_FROM_EMAIL=your-actual-email@gmail.com

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Replace**:
- `your-actual-email@gmail.com` → Your Gmail address
- `abcd efgh ijkl mnop` → Your 16-char App Password (no spaces)

---

### **Step 2: Restart Server**

```powershell
# Press Ctrl + C to stop current server
npm run dev
```

Look for: `✅ SMTP connection verified successfully` in console

---

### **Step 3: Test the Flow**

#### **A. Add Driver Email**:
1. Go to: `http://localhost:3000/admin`
2. Click **"Manage Trucks"**
3. Find a driver or add new one
4. **Fill in "Driver Email"** field (e.g., `driver.test@gmail.com`)
5. Save

#### **B. Create Test Booking**:
1. Go to: `http://localhost:3000/dashboard/customer` (login as client)
2. Click **"📦 Book Truck"**
3. Click **"Switch to Map"**
4. Select source & destination on map
5. Choose vehicle type & fill details
6. **Submit Booking**

#### **C. Approve & Assign**:
1. Go to: `http://localhost:3000/admin` (login as admin)
2. Find your booking in **"Pending Bookings"**
3. Click **"Assign Truck"**
4. Select the truck with driver (who has email)
5. Click **"Continue to Confirmation"**
6. Click **"Confirm & Approve Trip"**

#### **D. Verify Email Sent**:
1. **Check Console Logs**:
   ```
   ✅ [approve api] Email sent successfully to driver: driver.test@gmail.com
   ```

2. **Check Driver's Inbox** (or Spam folder):
   - Subject: `🚛 New Trip Assignment - [Source] → [Destination]`
   - Professional HTML email with all trip details
   - Route visualization (A → B)
   - CTA button to login

---

## 🎨 What the Email Looks Like

### Header:
```
🚛 New Trip Assignment
You have been assigned to a new shipment
```

### Content:
- **Greeting**: "Hello [Driver Name],"
- **Route Card**:
  - FROM: [Source City] (Green marker: A)
  - TO: [Destination City] (Blue marker: B)
  - Distance: 500 km
  - Est. Time: 2 days
  - Pickup Date: 20 Oct 2025
  - Vehicle: Truck (9T)
- **Assignment Info**:
  - Booking ID
  - Truck Plate
  - Material & Weight
- **CTA Button**: "View Trip Dashboard →"
- **Footer**: Company contact info

---

## 🔧 Troubleshooting

### ❌ "Authentication failed"
**Fix**: Use **App Password**, not your regular Gmail password.
- Re-generate at: https://myaccount.google.com/apppasswords

### ⚠️ "No driver email available"
**Fix**: Add email to driver in **Manage Trucks** section.

### ❌ "SMTP not configured"
**Fix**: Check `.env.local` has all 4 required variables:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 📧 Email not received
**Check**:
1. **Spam/Junk folder**
2. **Console logs** for errors
3. **Driver email** is valid
4. **SMTP credentials** are correct

---

## 🧪 Quick Test API (Optional)

Create: `src/app/api/test-email/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { sendTestEmail } from '@/src/utils/email';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
  }
  
  const result = await sendTestEmail(email);
  return NextResponse.json(result);
}
```

Then visit: `http://localhost:3000/api/test-email?email=your-email@gmail.com`

Should return:
```json
{
  "success": true,
  "messageId": "<...>"
}
```

---

## 📊 Database Check

Ensure drivers have email column:

```sql
-- Run in Supabase SQL Editor
SELECT id, name, email FROM drivers LIMIT 5;
```

If email column missing:
```sql
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS email TEXT;
```

---

## ✅ Success Checklist

- [x] Nodemailer installed
- [x] Email templates created
- [x] API updated to send emails
- [x] SMTP config documented
- [ ] **Your turn**: Add SMTP credentials to `.env.local`
- [ ] **Your turn**: Restart server
- [ ] **Your turn**: Test booking approval flow
- [ ] **Your turn**: Verify email received

---

## 📖 Full Documentation

See: **`EMAIL_NOTIFICATION_SYSTEM.md`** for:
- Complete setup instructions
- Alternative SMTP providers (Outlook, custom)
- Email template customization
- Security best practices
- Future enhancements

---

## 🎉 You're Done!

Once you add SMTP credentials and restart the server, emails will automatically be sent to drivers whenever admin approves a trip assignment!

**Status**: ✅ **READY TO USE** (just needs SMTP config)

---

## 📞 Need Help?

Check console logs for these messages:
- ✅ = Success
- ⚠️ = Warning
- ❌ = Error

Example success log:
```
📧 Preparing to send trip assignment email to: driver@example.com
✅ Email sent successfully: <message-id>
✅ [approve api] Email sent successfully to driver: driver@example.com
```
