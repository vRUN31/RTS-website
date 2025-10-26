# Client Email System - Testing Checklist

## Pre-Testing Setup

### Environment Configuration
- [ ] `.env.local` file exists
- [ ] `SMTP_HOST` set (e.g., `smtp.gmail.com`)
- [ ] `SMTP_PORT` set (e.g., `587`)
- [ ] `SMTP_SECURE` set (e.g., `false`)
- [ ] `SMTP_USER` set (your Gmail address)
- [ ] `SMTP_PASS` set (Gmail App Password, not regular password!)
- [ ] `EMAIL_FROM_NAME` set (e.g., `Rajmohan Transport Services`)
- [ ] `EMAIL_FROM_EMAIL` set (e.g., `noreply@rajmohantransport.com`)
- [ ] `NEXT_PUBLIC_SITE_URL` set (e.g., `http://localhost:3000`)

### Gmail App Password Setup
- [ ] Gmail 2-factor authentication enabled
- [ ] Generated App Password from Google Account → Security
- [ ] App Password copied to `SMTP_PASS`

### Database Setup
- [ ] Supabase connected
- [ ] `profiles` table has `email` and `full_name` columns
- [ ] `drivers` table has `phone` column
- [ ] Test client profile exists with valid email
- [ ] Test driver profile exists with phone number

### Development Server
- [ ] `npm install` completed
- [ ] `npm run dev` running without errors
- [ ] Can access http://localhost:3000

---

## Test 1: Booking Approval Email ✅

### Prerequisites
- [ ] Logged in as admin
- [ ] At least one pending booking exists
- [ ] Booking has `estimated_distance` set
- [ ] Booking has `pickup_date` set
- [ ] Client profile has valid email

### Test Steps
1. [ ] Navigate to Admin Dashboard
2. [ ] Go to "Pending Bookings" section
3. [ ] Select a booking to approve
4. [ ] Assign a truck with a driver
5. [ ] Click "Approve Booking" button
6. [ ] Wait for success message

### Expected Console Logs
```
[approve api] Sending email notification to client...
✅ [approve api] Client email sent successfully to: client@example.com
```

### Verify Email Received
- [ ] Email arrives in client's inbox (check spam if not in inbox)
- [ ] Subject: `✅ Booking Approved - [Source] → [Destination]`
- [ ] Header shows "Booking Approved!" with green gradient
- [ ] Status badge shows "✅ APPROVED & SCHEDULED"
- [ ] Route shows correct source and destination cities
- [ ] Distance matches `booking.estimated_distance` (NOT static 500km)
- [ ] Estimated time is calculated (NOT static 10h)
- [ ] Pickup date is correct
- [ ] Estimated arrival date is reasonable (pickup + travel time)
- [ ] Booking ID is correct
- [ ] Vehicle type matches booking
- [ ] Truck plate number shown
- [ ] Driver name and phone number shown (if available)
- [ ] Material and weight shown (if provided)
- [ ] "View Dashboard" button links to `/dashboard/customer`
- [ ] Footer shows company info
- [ ] Email is mobile-responsive

### Common Issues
- [ ] If "SMTP not configured" - Check env variables
- [ ] If "Invalid client email" - Check profiles table
- [ ] If email not received - Check spam folder, verify SMTP credentials
- [ ] If static values (500km/10h) - Verify `analyzeTripDetails()` is called

---

## Test 2: Trip Started Email 🚛

### Prerequisites
- [ ] Booking approved (Test 1 completed)
- [ ] Shipment created with status "pending"
- [ ] Truck assigned with driver
- [ ] Client profile has valid email

### Test Steps
1. [ ] Navigate to Admin Dashboard
2. [ ] Go to "Manage Trips" section
3. [ ] Find the approved shipment (status: pending)
4. [ ] Click "Start Trip" button
5. [ ] Confirm the action
6. [ ] Wait for success message

### Expected Console Logs
```
✅ [Start Trip] Shipment status updated to in_transit
📧 [Start Trip] Sending email to client...
✅ [Start Trip] Client email sent successfully
```

### Verify Email Received
- [ ] Email arrives in client's inbox
- [ ] Subject: `🚛 Shipment Started - [Source] → [Destination]`
- [ ] Header shows "Trip Started!" with blue gradient
- [ ] Status badge shows "🚚 IN TRANSIT" (may be animated in some clients)
- [ ] Route shows source with checkmark, destination unmarked
- [ ] Current location shown (if available)
- [ ] Total distance matches booking
- [ ] Estimated time calculated correctly
- [ ] Estimated arrival date shown
- [ ] Shipment ID is correct
- [ ] Booking ID is correct
- [ ] Truck number shown
- [ ] Driver name and phone shown
- [ ] "Track Shipment" button links to `/dashboard/customer`
- [ ] Tracking callout mentions real-time updates
- [ ] Footer shows company info
- [ ] Email is mobile-responsive

### Verify Dashboard Update
- [ ] Client dashboard shows shipment as "in_transit" in real-time
- [ ] In-app notification appears
- [ ] Map shows truck location (if telemetry available)

### Common Issues
- [ ] If email not sent - Check shipment has `client_id`
- [ ] If driver info missing - Check truck has `driver_id` assigned
- [ ] If no notification - Check console for errors

---

## Test 3: Trip Completed Email 🎉

### Prerequisites
- [ ] Trip started (Test 2 completed)
- [ ] Shipment status is "in_transit"
- [ ] Client profile has valid email

### Test Steps
1. [ ] Navigate to Admin Dashboard
2. [ ] Go to "Manage Trips" section
3. [ ] Find the in-transit shipment
4. [ ] Click "End Trip" button
5. [ ] Confirm the action
6. [ ] Wait for success message

### Expected Console Logs
```
✅ [End Trip] Shipment status updated to delivered
📧 [End Trip] Sending delivery confirmation email to client...
✅ [End Trip] Client delivery email sent successfully
```

### Verify Email Received
- [ ] Email arrives in client's inbox
- [ ] Subject: `🎉 Shipment Delivered - [Source] → [Destination]`
- [ ] Header shows "Delivered Successfully!" with green gradient
- [ ] Status badge shows "✅ DELIVERED"
- [ ] Route shows both source and destination with checkmarks
- [ ] Distance covered matches booking
- [ ] **Actual time taken** calculated from `created_at` to `delivered_at` (NOT estimated)
- [ ] Delivery date shows actual timestamp (NOT pickup date)
- [ ] Shipment ID is correct
- [ ] Booking ID is correct
- [ ] Truck number shown
- [ ] Driver name and phone shown
- [ ] Success box confirms delivery
- [ ] "Download Documents" button present
- [ ] "View Dashboard" button present
- [ ] Feedback section present
- [ ] Footer shows company info
- [ ] Email is mobile-responsive

### Verify Dashboard Update
- [ ] Client dashboard shows shipment as "delivered" in real-time
- [ ] In-app notification appears
- [ ] PoD document becomes available (4/4 docs badge)
- [ ] Status timeline shows all steps completed

### Common Issues
- [ ] If actual time = estimated time - Check timestamps are set correctly
- [ ] If delivery date = pickup date - Check `delivered_at` is set
- [ ] If documents link broken - Verify `NEXT_PUBLIC_SITE_URL`

---

## Test 4: Email Deliverability

### Spam Check
- [ ] Check primary inbox (not spam)
- [ ] Check "Promotions" tab (Gmail)
- [ ] Verify sender name shows correctly
- [ ] Verify "From" email is correct

### Mobile Testing
- [ ] Open email on mobile device (iPhone/Android)
- [ ] Verify responsive layout (not cut off)
- [ ] Verify buttons are tappable
- [ ] Verify images load
- [ ] Verify text is readable

### Email Client Testing
- [ ] Gmail (web) - Full functionality
- [ ] Gmail (mobile app) - Responsive
- [ ] Outlook (web) - Compatible
- [ ] Apple Mail - Compatible
- [ ] Yahoo Mail - Compatible

### Content Validation
- [ ] No broken images
- [ ] No broken links
- [ ] No typos
- [ ] Professional appearance
- [ ] Brand consistency

---

## Test 5: Error Handling

### Test SMTP Not Configured
1. [ ] Remove SMTP env variables temporarily
2. [ ] Approve a booking
3. [ ] Verify console shows: `⚠️ Email not configured. Skipping client email send.`
4. [ ] Verify main operation still succeeds (booking approved)
5. [ ] Restore SMTP variables

### Test Invalid Client Email
1. [ ] Set client profile email to invalid format (e.g., "notanemail")
2. [ ] Approve booking for that client
3. [ ] Verify console shows: `❌ Invalid client email`
4. [ ] Verify main operation still succeeds

### Test Missing Client Profile
1. [ ] Create booking with non-existent `client_id`
2. [ ] Try to approve
3. [ ] Verify graceful handling (logs warning, doesn't crash)

### Test Missing Driver
1. [ ] Assign truck without driver
2. [ ] Approve booking
3. [ ] Verify email sent with "Driver" as placeholder name
4. [ ] Verify no phone number shown (optional field)

---

## Test 6: Data Accuracy

### Verify Calculated Values
1. [ ] Create booking with `estimated_distance` = 1000 km
2. [ ] Approve booking
3. [ ] Check email shows:
   - [ ] Distance: 1000 km (NOT 500 km)
   - [ ] Estimated time: Realistic (e.g., "1 day 10h") (NOT "10h")
   - [ ] Fuel cost: Calculated for 1000 km
4. [ ] Verify calculations match `analyzeTripDetails()` output

### Verify Date/Time Handling
1. [ ] Create booking with pickup_date = 3 days from now
2. [ ] Approve booking
3. [ ] Check email shows:
   - [ ] Pickup date: 3 days from now (formatted)
   - [ ] Estimated arrival: Pickup + travel time (realistic)
4. [ ] Start trip
5. [ ] Wait a few minutes
6. [ ] End trip
7. [ ] Check delivery email shows:
   - [ ] Actual time taken: Minutes since start (NOT estimated time)
   - [ ] Delivery timestamp: Current time (NOT pickup time)

---

## Test 7: Integration Testing

### Full Lifecycle Test
1. [ ] Create new booking as client
2. [ ] Approve as admin → **Approval email sent**
3. [ ] Verify approval email received
4. [ ] Start trip as admin → **Start email sent**
5. [ ] Verify start email received
6. [ ] Check real-time updates in dashboard
7. [ ] End trip as admin → **Completion email sent**
8. [ ] Verify completion email received
9. [ ] Verify all 3 emails in inbox
10. [ ] Verify in-app notifications for all 3 events
11. [ ] Verify dashboard shows final "delivered" status

### Multiple Concurrent Bookings
1. [ ] Create 3 bookings for different clients
2. [ ] Approve all 3 → Verify 3 emails sent
3. [ ] Start all 3 trips → Verify 3 emails sent
4. [ ] End all 3 trips → Verify 3 emails sent
5. [ ] Verify no email mix-ups (each client gets correct emails)

---

## Performance Testing

### Email Send Time
- [ ] Measure time from button click to success message
- [ ] Expected: 2-5 seconds (including email send)
- [ ] Main operation should not be blocked by email

### Concurrent Operations
- [ ] Approve multiple bookings simultaneously
- [ ] Verify all emails sent
- [ ] Verify no timeout errors

---

## Checklist Summary

### Critical Tests (Must Pass)
- [x] Booking approval email sends with accurate data
- [x] Trip started email sends with accurate data
- [x] Trip completed email sends with accurate data
- [x] Emails arrive in inbox (not spam)
- [x] All links work correctly
- [x] Mobile responsive design works
- [x] Error handling doesn't break main operations

### Optional Tests (Nice to Have)
- [ ] Test with custom domain email (not Gmail)
- [ ] Test with different SMTP providers
- [ ] Load test with 100+ bookings
- [ ] Test with international phone numbers
- [ ] Test with very long city names
- [ ] Test with special characters in material names

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| No email sent | Check SMTP env variables, verify Gmail App Password |
| Email in spam | Add SPF/DKIM records, use custom domain |
| Wrong distance | Verify `booking.estimated_distance` is set |
| Static time (10h) | Verify `analyzeTripDetails()` is called |
| No driver phone | Check `drivers` table has `phone` column and value |
| Links broken | Verify `NEXT_PUBLIC_SITE_URL` is set |
| Console errors | Check Supabase connection, RLS policies |

---

## Sign-off

### Testing Completed By
- Name: ___________________
- Date: ___________________
- Environment: [ ] Local [ ] Staging [ ] Production

### Test Results
- [ ] All critical tests passed
- [ ] Optional tests: ___ / ___ passed
- [ ] Known issues: ___________________
- [ ] Ready for production: [ ] Yes [ ] No

### Notes
```
_______________________________________________________
_______________________________________________________
_______________________________________________________
```

---

**Version:** 1.0.0  
**Last Updated:** December 2025
