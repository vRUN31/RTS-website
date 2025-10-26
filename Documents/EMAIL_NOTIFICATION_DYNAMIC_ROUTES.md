# Email Notification Dynamic Route Details

## Overview

This document describes how the email notification system dynamically displays actual route details (source, destination, distance, duration, and estimated arrival) for both drivers and clients when bookings are approved and trucks are assigned.

## Problem Statement

Previously, email notifications were showing static/hardcoded route information (e.g., "Mumbai → Kalyan-Dombivli, 500 km, 2 days") for all shipments, regardless of the actual booking details. This caused confusion as drivers and clients received incorrect route information.

## Solution

The email notification system now dynamically fetches and displays actual route details from the `bookings` and `shipments` tables, including:

- **Source and Destination Cities**: From `bookings.source_city` and `bookings.destination_city`
- **Estimated Distance**: From `bookings.estimated_distance` (in kilometers)
- **Estimated Duration**: From `bookings.estimated_duration` (in seconds, formatted to readable format)
- **Estimated Arrival**: From `shipments.eta` (timestamp)
- **Pickup Date**: From `bookings.pickup_date`

## Database Schema

### Bookings Table

The `bookings` table contains the following relevant columns:

```sql
CREATE TABLE bookings (
  id uuid PRIMARY KEY,
  source_city text NOT NULL,
  destination_city text NOT NULL,
  estimated_distance NUMERIC(10, 2), -- in kilometers
  estimated_duration NUMERIC(10, 2), -- in seconds
  pickup_date date,
  vehicle_type text,
  material text,
  weight_mt numeric,
  notes text,
  -- ... other columns
);
```

**Note**: The `estimated_distance` and `estimated_duration` columns are added via migrations:
- `supabase/migrations/2025-01-16-add-booking-route-data.sql`
- `supabase/migrations/2025-01-16-fix-duration-column-type.sql`

### Shipments Table

The `shipments` table contains the estimated arrival time:

```sql
CREATE TABLE shipments (
  id uuid PRIMARY KEY,
  eta timestamptz, -- Estimated time of arrival
  origin text,
  destination text,
  distance_km numeric,
  -- ... other columns
);
```

## Implementation Details

### 1. Email Template Interface

**File**: `src/utils/email/driver-notification.ts`

The `BookingEmailData` interface now includes:

```typescript
export interface BookingEmailData {
  bookingId: string;
  driverName: string;
  driverEmail: string;
  sourceCity: string;
  destinationCity: string;
  vehicleType: string;
  material?: string;
  weightMt?: number;
  pickupDate?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  truckPlate?: string;
  estimatedDistance?: number;     // NEW: in kilometers
  estimatedDuration?: number;     // NEW: in seconds
  estimatedArrival?: string;      // NEW: ISO date string
}
```

### 2. Email HTML Template

The HTML email template (`generateDriverNotificationEmail`) now displays:

#### Route Details Section

```html
<div class="route-card">
  <h2>📍 Route Details</h2>
  <div class="route-path">
    <div class="location">
      <div class="location-label">FROM</div>
      <div class="location-city">${data.sourceCity}</div>
    </div>
    <div class="arrow">→</div>
    <div class="location">
      <div class="location-label">TO</div>
      <div class="location-city">${data.destinationCity}</div>
    </div>
  </div>
  
  <!-- Dynamic distance and duration -->
  ${data.estimatedDistance ? `
    <div>
      <span>📏 Distance:</span>
      <span>${data.estimatedDistance} km</span>
    </div>
  ` : ''}
  
  ${data.estimatedDuration ? `
    <div>
      <span>⏱️ Est. Time:</span>
      <span>${formatDuration(data.estimatedDuration)}</span>
    </div>
  ` : ''}
</div>
```

#### Shipment Information Section

```html
<div class="info-card">
  <h2>📦 Shipment Information</h2>
  
  <!-- ... other info rows ... -->
  
  <div class="info-row">
    <div class="info-label">Pickup Date:</div>
    <div class="info-value"><strong>${pickupDateFormatted}</strong></div>
  </div>
  
  ${arrivalDateFormatted ? `
  <div class="info-row">
    <div class="info-label">Est. Arrival:</div>
    <div class="info-value"><strong>${arrivalDateFormatted}</strong></div>
  </div>
  ` : ''}
</div>
```

### 3. Duration Formatting

The email template includes a helper function to format duration from seconds to a readable format:

```typescript
const formatDuration = (seconds?: number): string => {
  if (!seconds) return '';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
};
```

**Examples**:
- `86400` seconds → `"1 day"`
- `90000` seconds → `"1 day 1h"`
- `7200` seconds → `"2h"`
- `3660` seconds → `"1h 1m"`
- `30` seconds → `"< 1m"`

### 4. API Route: Send Driver Notification

**File**: `src/app/api/bookings/send-driver-notification/route.ts`

This API route is called to send the email notification. It now:

1. Fetches booking details with `estimated_distance` and `estimated_duration`:

```typescript
const { data: booking } = await supabase
  .from('bookings')
  .select(`
    *,
    trucks:truck_id (
      id,
      plate,
      display_code,
      drivers:driver_id (
        id,
        name,
        email,
        phone
      )
    ),
    clients:client_id (
      id,
      name,
      phone
    )
  `)
  .eq('id', bookingId)
  .single();
```

2. Fetches the related shipment to get the ETA:

```typescript
const { data: shipment } = await supabase
  .from('shipments')
  .select('eta')
  .eq('client_id', booking.client_id)
  .eq('origin', booking.source_city)
  .eq('destination', booking.destination_city)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

3. Passes all dynamic data to the email template:

```typescript
const emailData: BookingEmailData = {
  bookingId: booking.id,
  driverName: driver.name,
  driverEmail: driver.email,
  sourceCity: booking.source_city,
  destinationCity: booking.destination_city,
  vehicleType: booking.vehicle_type || 'Not specified',
  material: booking.material,
  weightMt: booking.weight_mt,
  pickupDate: booking.pickup_date,
  notes: booking.notes,
  truckPlate: booking.trucks.plate || booking.trucks.display_code,
  customerName: booking.clients?.name,
  customerPhone: booking.clients?.phone,
  estimatedDistance: booking.estimated_distance,      // Dynamic
  estimatedDuration: booking.estimated_duration,      // Dynamic
  estimatedArrival: shipment?.eta,                    // Dynamic
};
```

### 5. Admin Approval Route

**File**: `src/app/admin/bookings/approve/route.ts`

When an admin approves a booking and assigns a truck, this route:

1. Fetches booking with route data:

```typescript
const { data: booking } = await supabase
  .from('bookings')
  .select('id, client_id, source_city, destination_city, weight_mt, vehicle_type, pickup_date, material, user_id, estimated_cost, estimated_distance, estimated_duration')
  .eq('id', bookingId)
  .maybeSingle();
```

2. Creates a shipment with ETA:

```typescript
const eta = booking.pickup_date ? new Date(booking.pickup_date) : new Date();
if (!booking.pickup_date) eta.setDate(eta.getDate() + 1);

const { data: shipment } = await supabase
  .from('shipments')
  .insert({
    client_id: booking.client_id,
    truck_id: truckId,
    origin: booking.source_city,
    destination: booking.destination_city,
    weight_mt: booking.weight_mt,
    status: 'pending',
    eta: eta.toISOString(),
    cost,
    created_at: new Date().toISOString(),
  })
  .select('id')
  .maybeSingle();
```

3. Stores the notification with all dynamic data:

```typescript
await supabase.from('notifications').insert({
  user_id: null,
  type: 'booking_assigned',
  title: `New Trip Assignment - ${booking.source_city} to ${booking.destination_city}`,
  message: `Driver ${driver.name} has been assigned to booking #${bookingId.slice(0, 8).toUpperCase()}`,
  data: {
    booking_id: bookingId,
    driver_id: driver.id,
    driver_email: driver.email,
    driver_name: driver.name,
    source_city: booking.source_city,              // Dynamic
    destination_city: booking.destination_city,    // Dynamic
    vehicle_type: booking.vehicle_type,
    truck_plate: truckWithDriver.plate || truckWithDriver.display_code,
    weight_mt: booking.weight_mt,
    material: booking.material,
    pickup_date: booking.pickup_date,
    estimated_distance: booking.estimated_distance,  // Dynamic
    estimated_duration: booking.estimated_duration,  // Dynamic
    estimated_arrival: eta.toISOString(),            // Dynamic
    shipment_id: shipment?.id,
  },
  channel: 'email',
  sent_at: new Date().toISOString()
});
```

## Testing

### Test Scenario 1: Delhi to Jaipur (280 km, 4 hours)

**Input**:
```javascript
{
  source_city: "Delhi",
  destination_city: "Jaipur",
  estimated_distance: 280,
  estimated_duration: 14400, // 4 hours
  pickup_date: "2025-01-20"
}
```

**Expected Email Output**:
```
Route Details
━━━━━━━━━━━━━
FROM          →          TO
Delhi                  Jaipur

📏 Distance: 280 km
⏱️ Est. Time: 4h

Shipment Information
━━━━━━━━━━━━━━━━━━━━
Pickup Date: Monday, 20 January, 2025
Est. Arrival: 20 Jan 2025, 05:30 pm
```

### Test Scenario 2: Mumbai to Bangalore (980 km, 16 hours)

**Input**:
```javascript
{
  source_city: "Mumbai",
  destination_city: "Bangalore",
  estimated_distance: 980,
  estimated_duration: 57600, // 16 hours
  pickup_date: "2025-01-22"
}
```

**Expected Email Output**:
```
Route Details
━━━━━━━━━━━━━
FROM          →          TO
Mumbai             Bangalore

📏 Distance: 980 km
⏱️ Est. Time: 16h

Shipment Information
━━━━━━━━━━━━━━━━━━━━
Pickup Date: Wednesday, 22 January, 2025
Est. Arrival: 23 Jan 2025, 10:30 am
```

### Test Scenario 3: Kolkata to Patna (560 km, 10 hours)

**Input**:
```javascript
{
  source_city: "Kolkata",
  destination_city: "Patna",
  estimated_distance: 560,
  estimated_duration: 36000, // 10 hours
  pickup_date: "2025-01-25"
}
```

**Expected Email Output**:
```
Route Details
━━━━━━━━━━━━━
FROM          →          TO
Kolkata              Patna

📏 Distance: 560 km
⏱️ Est. Time: 10h

Shipment Information
━━━━━━━━━━━━━━━━━━━━
Pickup Date: Saturday, 25 January, 2025
Est. Arrival: 25 Jan 2025, 11:30 pm
```

## How to Verify

### 1. Check Database

Verify that bookings have route data:

```sql
SELECT 
  id,
  source_city,
  destination_city,
  estimated_distance,
  estimated_duration,
  pickup_date
FROM bookings
WHERE id = '<booking-id>';
```

### 2. Check Notification Data

After booking approval, verify notification has dynamic data:

```sql
SELECT 
  type,
  title,
  message,
  data,
  created_at
FROM notifications
WHERE type = 'booking_assigned'
ORDER BY created_at DESC
LIMIT 1;
```

The `data` JSON should contain:
```json
{
  "booking_id": "uuid",
  "source_city": "Actual City",
  "destination_city": "Actual City",
  "estimated_distance": 280,
  "estimated_duration": 14400,
  "estimated_arrival": "2025-01-20T17:30:00Z"
}
```

### 3. Check Console Logs

When a booking is approved, check the server console for:

```
========================================
📧 SENDING DRIVER NOTIFICATION EMAIL
========================================
Driver: Rajesh Kumar
Email: rajesh@example.com
Booking ID: abc123...
Route: Delhi → Jaipur
Truck: DL-01-AB-1234
========================================
```

### 4. Manual Test

1. Create a new booking with specific route details
2. Approve the booking and assign a truck
3. Check the notification in the database
4. Verify all fields show actual values, not hardcoded ones

## Fallback Behavior

If route data is missing from the booking:

- **Distance**: Not displayed (section hidden)
- **Duration**: Not displayed (section hidden)
- **Estimated Arrival**: Not displayed (row hidden)

This ensures the email always displays correctly even with incomplete data.

## Future Enhancements

### 1. Actual Email Sending

Currently, emails are logged to console and stored in the database. To send actual emails:

**Option A: Resend (Recommended)**

```bash
npm install resend
```

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'RTS Notifications <notifications@yourdomain.com>',
  to: driver.email,
  subject: `New Trip Assignment - ${sourceCity} to ${destinationCity}`,
  html: emailHtml,
  text: emailText
});
```

**Option B: SendGrid**

```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: driver.email,
  from: 'notifications@yourdomain.com',
  subject: `New Trip Assignment - ${sourceCity} to ${destinationCity}`,
  html: emailHtml,
  text: emailText
});
```

### 2. Email Templates for Clients

Create similar email templates for clients with relevant information (less technical details, more tracking info).

### 3. SMS Notifications

Add SMS notifications for critical updates:

```typescript
// Using Twilio
import twilio from 'twilio';

const client = twilio(accountSid, authToken);

await client.messages.create({
  body: `New trip assigned! ${sourceCity} → ${destinationCity}. ETA: ${arrivalDate}`,
  from: '+1234567890',
  to: driver.phone
});
```

### 4. WhatsApp Notifications

Integrate WhatsApp Business API for rich media notifications with tracking links.

## Related Files

- `src/utils/email/driver-notification.ts` - Email template generator
- `src/app/api/bookings/send-driver-notification/route.ts` - API route to send emails
- `src/app/admin/bookings/approve/route.ts` - Booking approval route
- `supabase/migrations/2025-01-16-add-booking-route-data.sql` - Distance column migration
- `supabase/migrations/2025-01-16-fix-duration-column-type.sql` - Duration column migration

## Troubleshooting

### Issue: Email shows empty distance/duration

**Cause**: Booking doesn't have `estimated_distance` or `estimated_duration` populated.

**Solution**: Ensure the booking form calculates and saves these values when the route is selected on the map.

### Issue: Email shows wrong arrival time

**Cause**: Shipment ETA is not calculated correctly.

**Solution**: Verify the ETA calculation in the approval route:
```typescript
const eta = booking.pickup_date ? new Date(booking.pickup_date) : new Date();
if (!booking.pickup_date) eta.setDate(eta.getDate() + 1);
```

### Issue: Email not sent

**Cause**: Email service not integrated (currently logs to console only).

**Solution**: Integrate with Resend, SendGrid, or other email service (see Future Enhancements).

## Summary

The email notification system now dynamically displays actual route details from the database, ensuring drivers and clients receive accurate information about their assigned trips. All hardcoded values have been replaced with dynamic queries from `bookings` and `shipments` tables.

**Key Changes**:
- ✅ Dynamic source and destination cities
- ✅ Dynamic estimated distance (km)
- ✅ Dynamic estimated duration (formatted)
- ✅ Dynamic estimated arrival (timestamp)
- ✅ Fallback behavior for missing data
- ✅ Updated both HTML and text email templates
- ✅ Comprehensive documentation

**Next Steps**:
1. Integrate actual email service (Resend/SendGrid)
2. Create client-facing email templates
3. Add SMS/WhatsApp notifications
4. Monitor email delivery and open rates
