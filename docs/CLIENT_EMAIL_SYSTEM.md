# Client Email Notification System

## Overview

Comprehensive email notification system that sends professional HTML emails to clients at three critical points in the shipment lifecycle:

1. **Booking Approval** - When admin approves a booking and assigns a truck
2. **Trip Start** - When driver starts the journey
3. **Trip End** - When shipment is delivered

## Features

✅ **Professional HTML Design**
- Responsive layout optimized for all devices
- Brand-consistent gradient headers (#10b981 for approval/delivery, #3b82f6 for transit)
- Route visualization with A→B markers
- Modern card-based UI with shadows and rounded corners

✅ **Accurate Trip Data**
- Uses `analyzeTripDetails()` for real distance and time calculations
- Includes rest stops and realistic driving estimates
- Calculates estimated arrival based on pickup date
- Shows actual trip duration for delivered shipments

✅ **Rich Information**
- Shipment tracking IDs
- Truck and driver details with contact information
- Pickup and delivery dates
- Material and weight specifications
- Real-time tracking links

✅ **Error Handling**
- Graceful fallbacks if SMTP not configured
- Non-blocking - email failures don't break main operations
- Comprehensive logging for debugging

## Email Types

### 1. Booking Approval Email

**Trigger:** Admin approves booking via `/api/bookings/approve`

**Subject:** `✅ Booking Approved - [Source] → [Destination]`

**Content:**
- ✅ Approved status badge
- Shipment confirmation message
- Route visualization (A→B)
- Distance, estimated time, pickup date, arrival date
- Booking ID, vehicle type, assigned truck
- Driver name and contact
- Material and weight details
- "Next Steps" callout box
- Track shipment CTA button

**Data Source:**
```typescript
- booking.* - Booking details
- truck.plate - Assigned truck
- driver.name, driver.phone - Driver info
- analyzeTripDetails() - Accurate calculations
- profiles.email, profiles.full_name - Client info
```

### 2. Trip Started Email

**Trigger:** Driver starts trip via `/api/shipments/[id]/start`

**Subject:** `🚛 Shipment Started - [Source] → [Destination]`

**Content:**
- 🚚 IN TRANSIT status badge (animated pulse)
- Journey started message
- Route visualization with current location marker
- Total distance, estimated time, arrival date
- Shipment and booking IDs
- Truck number and driver contact
- Real-time tracking callout
- Track Shipment CTA button

**Data Source:**
```typescript
- shipment.* - Shipment details
- truck.plate - Truck number
- driver.name, driver.phone - Driver contact
- analyzeTripDetails() - Trip calculations
- profiles.email, profiles.full_name - Client info
```

### 3. Trip Completed Email

**Trigger:** Trip ends via `/api/shipments/[id]/end`

**Subject:** `🎉 Shipment Delivered - [Source] → [Destination]`

**Content:**
- 🎉 Header with celebration
- ✅ DELIVERED status badge
- Delivery confirmation message
- Route visualization (both points checked)
- Distance covered, actual time taken, delivery date
- Shipment and booking IDs
- Truck and driver details
- Success box with delivery confirmation
- Download Documents CTA button
- View Dashboard CTA button
- Feedback request section

**Data Source:**
```typescript
- shipment.* - Shipment details
- shipment.created_at, delivered_at - Calculate actual time
- truck.plate - Truck number
- driver.name, driver.phone - Driver info
- profiles.email, profiles.full_name - Client info
```

## Technical Implementation

### Email Templates (`src/utils/email/templates.ts`)

Three new interfaces:
```typescript
export interface ClientBookingApprovedEmailData {
  customerName: string;
  bookingId: string;
  sourceCity: string;
  destinationCity: string;
  distance: number;
  estimatedTime: string;
  estimatedArrival: string;
  pickupDate: string;
  material?: string;
  weight?: number;
  vehicleType: string;
  truckPlate: string;
  driverName: string;
  driverPhone?: string;
  trackingUrl?: string;
}

export interface ClientTripStartedEmailData {
  customerName: string;
  shipmentId: string;
  bookingId: string;
  sourceCity: string;
  destinationCity: string;
  distance: number;
  estimatedTime: string;
  estimatedArrival: string;
  truckPlate: string;
  driverName: string;
  driverPhone?: string;
  currentLocation?: string;
  trackingUrl?: string;
}

export interface ClientTripCompletedEmailData {
  customerName: string;
  shipmentId: string;
  bookingId: string;
  sourceCity: string;
  destinationCity: string;
  distance: number;
  actualTime: string;
  deliveryDate: string;
  truckPlate: string;
  driverName: string;
  driverPhone?: string;
  documentsUrl?: string;
}
```

Three HTML template generators:
- `generateClientBookingApprovedEmail(data)`
- `generateClientTripStartedEmail(data)`
- `generateClientTripCompletedEmail(data)`

### Email Sending (`src/utils/email/index.ts`)

Three sending functions:
```typescript
export async function sendClientBookingApprovedEmail(
  clientEmail: string,
  bookingData: ClientBookingApprovedEmailData
): Promise<SendEmailResult>

export async function sendClientTripStartedEmail(
  clientEmail: string,
  tripData: ClientTripStartedEmailData
): Promise<SendEmailResult>

export async function sendClientTripCompletedEmail(
  clientEmail: string,
  completionData: ClientTripCompletedEmailData
): Promise<SendEmailResult>
```

All functions:
- Validate email configuration
- Check email format
- Create SMTP transporter
- Generate HTML content
- Send email via Nodemailer
- Return success/failure result
- Log all operations

### API Integration

#### Booking Approval Route (`src/app/api/bookings/approve/route.ts`)

**Location:** After driver email sent (line ~280)

**Process:**
1. Fetch client profile (email, full_name) from `profiles` table
2. Use `analyzeTripDetails()` for accurate calculations
3. Calculate estimated arrival date
4. Format pickup date in Indian format
5. Send email with booking data
6. Log success/failure (don't fail main operation)

**Key Code:**
```typescript
const { data: clientProfile } = await supabase
  .from('profiles')
  .select('email, full_name')
  .eq('id', booking.client_id)
  .single();

const tripAnalysis = analyzeTripDetails(distance, vehicleType, pickupDate);

await sendClientBookingApprovedEmail(clientProfile.email, {
  customerName: clientProfile.full_name || 'Valued Customer',
  bookingId,
  sourceCity: booking.source_city,
  destinationCity: booking.destination_city,
  distance: tripAnalysis.distance,
  estimatedTime,
  estimatedArrival,
  // ... more fields
});
```

#### Trip Start Route (`src/app/api/shipments/[id]/start/route.ts`)

**Location:** After notification insert (line ~115)

**Process:**
1. Fetch full shipment details with truck and driver (nested select)
2. Fetch client profile (email, full_name)
3. Use `analyzeTripDetails()` for trip calculations
4. Format estimated arrival time
5. Send email with trip data
6. Log success/failure (don't fail main operation)

**Key Code:**
```typescript
const { data: fullShipment } = await supabase
  .from('shipments')
  .select(`
    id, origin, destination, weight_mt, truck_id,
    trucks (
      plate,
      driver_id,
      drivers (name, phone)
    )
  `)
  .eq('id', shipmentId)
  .single();

await sendClientTripStartedEmail(clientProfile.email, {
  customerName: clientProfile.full_name || 'Valued Customer',
  shipmentId,
  bookingId,
  // ... more fields
});
```

#### Trip End Route (`src/app/api/shipments/[id]/end/route.ts`)

**Location:** After notification insert (line ~120)

**Process:**
1. Fetch full shipment with timestamps (created_at, delivered_at)
2. Calculate actual trip duration from timestamps
3. Format delivery date/time
4. Fetch client profile
5. Send completion email with delivery confirmation
6. Log success/failure (don't fail main operation)

**Key Code:**
```typescript
const startTime = new Date(fullShipment.created_at);
const endTime = new Date(fullShipment.delivered_at);
const tripDurationMs = endTime.getTime() - startTime.getTime();

const tripHours = Math.floor(tripDurationMs / (1000 * 60 * 60));
const tripDays = Math.floor(tripHours / 24);

await sendClientTripCompletedEmail(clientProfile.email, {
  customerName: clientProfile.full_name || 'Valued Customer',
  shipmentId,
  actualTime, // Calculated from timestamps
  deliveryDate, // Formatted delivery timestamp
  // ... more fields
});
```

## Environment Configuration

Required in `.env.local`:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Sender
EMAIL_FROM_NAME=Rajmohan Transport Services
EMAIL_FROM_EMAIL=noreply@rajmohantransport.com

# Site URL (for tracking links)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate App Password (not regular password)
3. Use App Password in `SMTP_PASS`

## Styling

### Color Scheme
- **Approval/Delivery**: Green gradient (`#10b981` to `#059669`)
- **In Transit**: Blue gradient (`#3b82f6` to `#2563eb`)
- **Background**: White (`#ffffff`)
- **Card Background**: Light gray gradient (`#f8f9fa` to `#e9ecef`)
- **Text**: Dark gray (`#333`, `#555`, `#666`)
- **Headers**: Nearly black (`#1a1a1a`)
- **Footer**: Black (`#1a1a1a`)

### Typography
- **Font**: Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Header Size**: 28px (bold)
- **Subheader Size**: 18px (bold)
- **Body Size**: 16px
- **Label Size**: 12px (uppercase)
- **Line Height**: 1.6

### Layout
- **Max Width**: 600px
- **Padding**: 20-40px sections
- **Border Radius**: 8-12px
- **Box Shadow**: `0 4px 12px rgba(0,0,0,0.1)`
- **Responsive**: Grid collapses to single column on mobile

### Components
- **Status Badges**: Gradient background, rounded, bold
- **Route Markers**: Circular (40px), gradient background, white text
- **Info Cards**: Light background, left border accent
- **CTA Buttons**: Gradient background, rounded, shadow, hover effect
- **Highlight Boxes**: Colored background, border, rounded

## Testing

### Manual Testing

1. **Test Booking Approval Email:**
```bash
# Admin dashboard → Pending Bookings → Approve booking
# Check logs for: "✅ Client email sent successfully"
# Verify email received with correct data
```

2. **Test Trip Start Email:**
```bash
# Admin dashboard → Manage Trips → Start trip
# Check logs for: "✅ [Start Trip] Client email sent successfully"
# Verify email shows "IN TRANSIT" status
```

3. **Test Trip End Email:**
```bash
# Admin dashboard → Manage Trips → End trip
# Check logs for: "✅ [End Trip] Client delivery email sent successfully"
# Verify email shows delivery confirmation
```

### Email Preview

Test emails locally:
```typescript
// In API route or test script
const result = await sendClientBookingApprovedEmail(
  'test@example.com',
  {
    customerName: 'Test Client',
    bookingId: 'test-booking-123',
    sourceCity: 'Mumbai',
    destinationCity: 'Delhi',
    distance: 1400,
    estimatedTime: '2 days',
    estimatedArrival: '15 Dec 2025, 3:00 PM',
    pickupDate: '13 Dec 2025',
    vehicleType: 'Truck (16T)',
    truckPlate: 'MH-01-AB-1234',
    driverName: 'Raj Kumar',
    driverPhone: '+91 98765 43210',
    trackingUrl: 'http://localhost:3000/dashboard/customer'
  }
);

console.log(result); // Check success/error
```

## Troubleshooting

### Email Not Sending

**Check:**
1. ✅ SMTP environment variables set correctly
2. ✅ Gmail App Password (not regular password)
3. ✅ Port 587 not blocked by firewall
4. ✅ `isEmailConfigured()` returns true
5. ✅ Client email exists in profiles table
6. ✅ Console logs show email attempt

**Common Issues:**
- **"SMTP not configured"** → Check `.env.local` variables
- **"Invalid client email"** → Profile missing or email null
- **"Authentication failed"** → Wrong Gmail App Password
- **"Connection timeout"** → Port 587 blocked or wrong host

### Email in Spam

**Solutions:**
1. Add proper SPF/DKIM records to domain
2. Use custom domain email (not Gmail directly)
3. Warm up email reputation gradually
4. Include unsubscribe link (optional)
5. Test with mail-tester.com

### Missing Data

**Check:**
1. ✅ `booking.estimated_distance` populated
2. ✅ `booking.pickup_date` set
3. ✅ Truck has `driver_id` assigned
4. ✅ Driver has email and phone in database
5. ✅ Client profile has email

**Fallbacks:**
- Distance: 500km default if not set
- Pickup date: Current date if not provided
- Driver phone: Optional, can be undefined
- Customer name: "Valued Customer" if not set

## Performance

- **Email Generation**: ~50-100ms (HTML rendering)
- **SMTP Send**: ~500-2000ms (network dependent)
- **Total Impact**: ~2-3 seconds added to API response
- **Non-Blocking**: Email errors don't fail main operation

## Security

✅ **Best Practices:**
- SMTP credentials in environment variables only
- No credentials exposed to client
- Validate email format before sending
- Use App Passwords for Gmail (not regular password)
- TLS encryption for SMTP connection
- No sensitive data in email subject
- Rate limiting on SMTP provider side

⚠️ **Never:**
- Commit SMTP credentials to git
- Send passwords or tokens via email
- Expose service_role key to client
- Include payment details in email

## Future Enhancements

### Potential Improvements:
1. **Email Templates in Database** - Allow admins to customize
2. **Unsubscribe Link** - Let clients opt out of notifications
3. **Email Preferences** - Choose which emails to receive
4. **Multiple Languages** - i18n support
5. **Rich Attachments** - Include PoD PDF, invoice
6. **Email Analytics** - Track open rates, click rates
7. **SMS Fallback** - Send SMS if email fails
8. **Push Notifications** - Mobile app integration
9. **Scheduled Emails** - Delivery reminders
10. **Email Queue** - Use job queue for better reliability

## Related Documentation

- [Real-time System](REALTIME_SYSTEM.md) - Dashboard updates
- [Driver Email System](DRIVER_EMAIL_SYSTEM.md) - Driver notifications
- [Notification System](NOTIFICATION_SYSTEM.md) - In-app notifications
- [Trip Operations](TRIP_OPERATIONS.md) - Trip start/end flow
- [Booking System](BOOKING_SYSTEM.md) - Booking approval flow

## Support

For issues:
1. Check console logs for detailed error messages
2. Verify SMTP configuration with test email
3. Check client profile has valid email
4. Test with Gmail first before custom domain
5. Review Supabase RLS policies for profiles table

---

**Last Updated:** December 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
