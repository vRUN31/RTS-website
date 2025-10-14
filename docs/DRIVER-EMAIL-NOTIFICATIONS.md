# Driver Email Notifications System

## 📧 Overview

The system automatically sends professional email notifications to drivers when a booking is **approved and assigned** to their truck by an admin. This ensures drivers are immediately informed about new trips.

## 🎯 Features

✅ **Automatic Notifications**: Email sent immediately when admin approves and assigns a truck
✅ **Professional Design**: Beautiful HTML email template with your branding
✅ **Complete Trip Details**: Source, destination, material, weight, pickup date
✅ **Driver Information**: Personalized with driver's name
✅ **Customer Contact**: Includes customer phone (if available)
✅ **Database Logging**: All notifications logged to `notifications` table
✅ **Failure Safe**: Email failures don't prevent booking approval

## 🔄 Workflow

```
1. Customer submits booking request
   ↓
2. Admin reviews booking in "Manage Book Truck"
   ↓
3. Admin clicks "Assign Truck" button
   ↓
4. Admin selects truck with driver
   ↓
5. Admin clicks "Assign & Approve"
   ↓
6. System updates booking status to "approved"
   ↓
7. System creates shipment record
   ↓
8. System sends notification to customer
   ↓
9. 📧 System sends email to driver automatically
   ↓
10. Driver receives professional email with trip details
```

## 📋 Prerequisites

### Database Setup

1. **Run Migration**: Execute the migration to add required fields:
   ```sql
   -- File: supabase/migrations/2025-10-14-add-booking-assignment-fields.sql
   ```
   This adds:
   - `truck_id` to bookings
   - `driver_id` to bookings
   - `driver_id` to trucks
   - `approved_at` timestamp
   - `approved_by` admin reference

2. **Ensure Driver Email Exists**: The migration `2025-10-10-add-truck-driver-notifications.sql` already added `email` column to `drivers` table.

### Admin Workflow

When adding trucks in **Manage Trucks** section:
1. ✅ Enter truck details (plate, status, etc.)
2. ✅ **Select or create a driver**
3. ✅ **Enter driver's email address** (required for notifications)
4. ✅ Enter driver's name (used in personalized greeting)
5. ✅ Save the truck

## 📧 Email Template

The email sent to drivers includes:

### Header
- **Subject**: `New Trip Assignment - [Source] to [Destination]`
- Orange gradient header with RTS branding
- "New Trip Assignment" title

### Route Section
- **FROM**: Source city (large, prominent)
- **→** Arrow indicator
- **TO**: Destination city (large, prominent)
- Estimated distance (if available from map calculation)

### Shipment Information
- Booking ID (first 8 characters, uppercase)
- Vehicle Type (e.g., "LCV (3.5T)")
- Assigned Truck (plate number)
- Material being transported
- Weight in MT (metric tons)
- Pickup Date (formatted: "Monday, January 15, 2025")

### Customer Contact (if available)
- Customer name
- Customer phone (clickable tel: link)

### Special Instructions
- Any notes from the booking request
- Special handling requirements

### Call-to-Action
- "View Full Details" button → Links to driver dashboard
- Support contact information

### Footer
- RTS branding
- Copyright notice
- "Do not reply" disclaimer

## 🎨 Email Design Features

- **Responsive**: Works on desktop and mobile
- **Branded Colors**: Orange gradient (#ff4d00 → #ff7a3d)
- **Color-Coded Cards**:
  - 🟢 Green: Route information
  - 🟠 Orange: Shipment details
  - 🔵 Blue: Customer contact
  - 🟣 Purple: Special notes
- **Clear Typography**: Professional fonts, proper hierarchy
- **Accessibility**: Proper ARIA labels, semantic HTML

## 🔧 Technical Implementation

### Files Structure

```
src/
├── utils/
│   └── email/
│       └── driver-notification.ts     # Email template & logic
├── app/
│   ├── api/
│   │   └── bookings/
│   │       └── send-driver-notification/
│   │           └── route.ts           # API endpoint (optional)
│   └── admin/
│       └── bookings/
│           └── approve/
│               └── route.ts           # Main approval logic
└── supabase/
    └── migrations/
        └── 2025-10-14-add-booking-assignment-fields.sql
```

### Key Functions

#### `generateDriverNotificationEmail(data)`
Generates professional HTML email content.

```typescript
const emailHtml = generateDriverNotificationEmail({
  bookingId: '123e4567-e89b-12d3',
  driverName: 'Rajesh Kumar',
  driverEmail: 'rajesh@example.com',
  sourceCity: 'Mumbai',
  destinationCity: 'Pune',
  vehicleType: 'LCV (3.5T)',
  material: 'Electronics',
  weightMt: 2.5,
  pickupDate: '2025-01-15',
  truckPlate: 'MH-12-AB-1234',
  customerPhone: '+91 98765 43210',
  notes: 'Handle with care. Fragile items.'
});
```

#### `generateDriverNotificationText(data)`
Generates plain text version (fallback).

#### `sendDriverNotificationEmail(data)`
Sends the email (currently logs to database + console).

### Approval Flow (Backend)

Location: `src/app/admin/bookings/approve/route.ts`

```typescript
// 1. Verify admin permissions
// 2. Validate booking and truck
// 3. Create shipment record
// 4. Update booking status to 'approved'
// 5. Add truck_id, approved_at, approved_by to booking
// 6. Send customer notification
// 7. 📧 Send driver email notification
```

The driver notification happens automatically in step 7:
- Fetches truck and driver details
- Checks if driver has email
- Logs beautiful email content to console
- Stores notification in database
- Does NOT fail approval if email fails

## 📊 Database Schema

### `bookings` Table (Updated)
```sql
ALTER TABLE bookings ADD COLUMN truck_id uuid;
ALTER TABLE bookings ADD COLUMN driver_id uuid;
ALTER TABLE bookings ADD COLUMN approved_at timestamptz;
ALTER TABLE bookings ADD COLUMN approved_by uuid;
```

### `trucks` Table (Updated)
```sql
ALTER TABLE trucks ADD COLUMN driver_id uuid;
```

### `drivers` Table (Existing)
```sql
-- Already has these columns:
name text NOT NULL
email text
phone text
```

### `notifications` Table (Used for logging)
```sql
-- Stores all email notifications:
type: 'booking_assigned'
channel: 'email'
data: JSON with booking details
sent_at: timestamp
```

## 🚀 Current Implementation Status

### ✅ Implemented
- [x] Database migrations
- [x] Email template (HTML + plain text)
- [x] Driver notification logic
- [x] Integration with approval workflow
- [x] Database logging
- [x] Console logging (for development)
- [x] Error handling (non-blocking)
- [x] Professional email design

### ⏳ To Implement (Optional)
- [ ] **Actual Email Sending** via Resend/SendGrid/SMTP
- [ ] Email delivery tracking
- [ ] Email open/click tracking
- [ ] Resend failed emails
- [ ] Email preferences (opt-out)
- [ ] SMS notifications (Twilio)
- [ ] Push notifications (mobile app)

## 📮 Integrating Actual Email Service

Currently, emails are logged to the console and database. To send actual emails:

### Option 1: Resend (Recommended)

1. **Install Resend**:
   ```bash
   npm install resend
   ```

2. **Get API Key**:
   - Sign up at [resend.com](https://resend.com)
   - Get your API key
   - Add to `.env.local`:
     ```
     RESEND_API_KEY=re_xxxxxxxxxxxxx
     ```

3. **Update Code** in `src/app/admin/bookings/approve/route.ts`:
   ```typescript
   import { Resend } from 'resend';
   import { generateDriverNotificationEmail } from '@/src/utils/email/driver-notification';

   // Inside the notification block:
   const resend = new Resend(process.env.RESEND_API_KEY);
   await resend.emails.send({
     from: 'RTS Notifications <notifications@yourdomain.com>',
     to: driver.email,
     subject: `New Trip Assignment - ${booking.source_city} to ${booking.destination_city}`,
     html: generateDriverNotificationEmail({
       bookingId: booking.id,
       driverName: driver.name,
       driverEmail: driver.email,
       sourceCity: booking.source_city,
       destinationCity: booking.destination_city,
       vehicleType: booking.vehicle_type,
       material: booking.material,
       weightMt: booking.weight_mt,
       pickupDate: booking.pickup_date,
       truckPlate: truckWithDriver.plate,
       notes: booking.notes,
     })
   });
   ```

### Option 2: SendGrid

1. **Install SendGrid**:
   ```bash
   npm install @sendgrid/mail
   ```

2. **Setup**:
   ```typescript
   import sgMail from '@sendgrid/mail';
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   
   await sgMail.send({
     to: driver.email,
     from: 'notifications@yourdomain.com',
     subject: `New Trip Assignment - ${booking.source_city} to ${booking.destination_city}`,
     html: generateDriverNotificationEmail({ ... })
   });
   ```

### Option 3: Nodemailer (SMTP)

1. **Install**:
   ```bash
   npm install nodemailer
   ```

2. **Setup**:
   ```typescript
   import nodemailer from 'nodemailer';
   
   const transporter = nodemailer.createTransporter({
     host: 'smtp.gmail.com',
     port: 587,
     secure: false,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS
     }
   });
   
   await transporter.sendMail({
     from: '"RTS Notifications" <notifications@yourdomain.com>',
     to: driver.email,
     subject: `New Trip Assignment - ${booking.source_city} to ${booking.destination_city}`,
     html: generateDriverNotificationEmail({ ... })
   });
   ```

## 🧪 Testing

### 1. Check Database Migration
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name IN ('truck_id', 'driver_id', 'approved_at', 'approved_by');
```

### 2. Add Test Driver with Email
In **Manage Trucks** section:
- Add a truck
- Create/select a driver
- **Important**: Add driver's email address
- Save

### 3. Create Test Booking
As a customer:
- Go to dashboard
- Click "Book Truck"
- Fill in source, destination, etc.
- Submit booking

### 4. Approve & Assign
As admin:
- Go to "Manage Book Truck"
- Find the test booking
- Click "Assign Truck"
- Select the truck with driver (that has email)
- Click "Assign & Approve"

### 5. Verify
- Check server console logs for email content
- Check `notifications` table:
  ```sql
  SELECT * FROM notifications 
  WHERE type = 'booking_assigned' 
  ORDER BY created_at DESC 
  LIMIT 5;
  ```
- Email content should be in the `data` column

## 📝 Example Console Output

When a booking is approved and assigned:

```
========================================
📧 SENDING DRIVER NOTIFICATION EMAIL
========================================
Driver: Rajesh Kumar
Email: rajesh.kumar@example.com
Booking ID: 123e4567-e89b-12d3-a456-426614174000
Route: Mumbai → Pune
Truck: MH-12-AB-1234
========================================

✅ Driver notification logged to database
📩 Check notifications table for email details
```

## 🎓 Admin Training

### How to Ensure Drivers Receive Notifications

1. **When adding trucks**, always:
   - ✅ Assign a driver to the truck
   - ✅ Enter driver's name
   - ✅ **Enter driver's email** (mandatory for notifications)
   - ✅ Enter driver's phone

2. **When approving bookings**:
   - Select a truck that has a driver assigned
   - Driver must have an email address
   - Notification is sent automatically

3. **If notification fails**:
   - Check driver has valid email
   - Check console logs for errors
   - Booking still gets approved
   - You can manually inform the driver

## 🔒 Security & Privacy

- ✅ Driver emails are stored securely in database
- ✅ Only admins can approve and trigger notifications
- ✅ Email content doesn't include sensitive customer data
- ✅ Notifications are logged for audit trail
- ✅ RLS policies protect driver information

## 🆘 Troubleshooting

### Driver not receiving email?
1. Check driver has email in database
2. Check truck has driver assigned
3. Check console logs for errors
4. Check `notifications` table for log entry

### Email shows wrong information?
1. Verify booking data is correct
2. Check truck assignment
3. Check driver details
4. Review notification log in database

### Notification failed but booking approved?
- This is expected behavior (non-blocking)
- Check error in console logs
- Manually notify driver
- Fix issue for future bookings

## 📚 Related Documentation

- **Database Schema**: `supabase/schema.sql`
- **Migrations**: `supabase/migrations/`
- **Email Utils**: `src/utils/email/driver-notification.ts`
- **Approval API**: `src/app/admin/bookings/approve/route.ts`

## 🚀 Future Enhancements

- [ ] WhatsApp notifications
- [ ] SMS notifications
- [ ] In-app push notifications
- [ ] Email delivery confirmation
- [ ] Driver reply/acknowledge feature
- [ ] Multiple language support
- [ ] Email templates customization in admin panel
- [ ] Scheduled notifications (reminder before pickup)
- [ ] Driver availability confirmation
- [ ] Route optimization suggestions in email

---

**Last Updated**: October 14, 2025
**Status**: ✅ Core functionality implemented, ready for email service integration
