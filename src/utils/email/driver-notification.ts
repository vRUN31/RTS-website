/**
 * Email Notification Service
 * Sends professional emails to drivers when bookings are approved and assigned
 */

import { createClient } from '@/utils/supabase/client';

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
  estimatedDistance?: number; // in kilometers
  estimatedDuration?: number; // in seconds
  estimatedArrival?: string; // ISO date string
}

/**
 * Generate professional HTML email template for driver notification
 */
export function generateDriverNotificationEmail(data: BookingEmailData): string {
  const pickupDateFormatted = data.pickupDate 
    ? new Date(data.pickupDate).toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Not specified';

  // Format estimated arrival date
  const arrivalDateFormatted = data.estimatedArrival
    ? new Date(data.estimatedArrival).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : null;

  // Format duration from seconds to readable format
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

  const durationFormatted = formatDuration(data.estimatedDuration);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Trip Assignment</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #ff4d00 0%, #ff7a3d 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .email-header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .email-body {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .greeting strong {
      color: #ff4d00;
    }
    .info-card {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      border-left: 4px solid #ff9800;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .info-card h2 {
      margin: 0 0 15px;
      color: #e65100;
      font-size: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #ffcc80;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #e65100;
      flex: 0 0 40%;
    }
    .info-value {
      color: #bf360c;
      text-align: right;
      flex: 1;
    }
    .route-card {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      border-left: 4px solid #4caf50;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .route-card h2 {
      margin: 0 0 15px;
      color: #2e7d32;
      font-size: 20px;
    }
    .route-path {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 15px 0;
    }
    .location {
      flex: 1;
      text-align: center;
    }
    .location-label {
      font-size: 12px;
      color: #1b5e20;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .location-city {
      font-size: 18px;
      color: #2e7d32;
      font-weight: 700;
      margin-top: 5px;
    }
    .arrow {
      font-size: 30px;
      color: #4caf50;
      flex: 0 0 60px;
      text-align: center;
    }
    .customer-card {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-left: 4px solid #2196f3;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .customer-card h2 {
      margin: 0 0 15px;
      color: #0d47a1;
      font-size: 20px;
    }
    .notes-card {
      background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
      border-left: 4px solid #9c27b0;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .notes-card h2 {
      margin: 0 0 10px;
      color: #4a148c;
      font-size: 18px;
    }
    .notes-content {
      color: #6a1b9a;
      line-height: 1.6;
      font-style: italic;
    }
    .cta-button {
      display: block;
      background: linear-gradient(135deg, #ff4d00 0%, #ff7a3d 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 15px 30px;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
      font-size: 16px;
      margin: 30px 0;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }
    .footer strong {
      color: #ff4d00;
    }
    .disclaimer {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 8px;
      font-size: 14px;
      color: #856404;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .route-path {
        flex-direction: column;
      }
      .arrow {
        transform: rotate(90deg);
        margin: 10px 0;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <h1>🚛 New Trip Assignment</h1>
      <p>Real-Time Shipment Tracking System</p>
    </div>

    <!-- Body -->
    <div class="email-body">
      <!-- Greeting -->
      <div class="greeting">
        Hello <strong>${data.driverName}</strong>,
      </div>
      <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
        You have been assigned a new delivery trip! Please review the details below and prepare for pickup.
      </p>

      <!-- Route Information -->
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
        ${data.estimatedDistance || data.estimatedDuration ? `
        <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #a5d6a7;">
          ${data.estimatedDistance ? `
          <div style="margin-bottom: 8px;">
            <span style="color: #2e7d32; font-weight: 600;">📏 Distance:</span>
            <span style="color: #1b5e20; font-weight: 700; font-size: 18px; margin-left: 10px;">${data.estimatedDistance} km</span>
          </div>
          ` : ''}
          ${data.estimatedDuration ? `
          <div style="margin-bottom: 8px;">
            <span style="color: #2e7d32; font-weight: 600;">⏱️ Est. Time:</span>
            <span style="color: #1b5e20; font-weight: 700; font-size: 18px; margin-left: 10px;">${durationFormatted}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>

      <!-- Trip Information -->
      <div class="info-card">
        <h2>📦 Shipment Information</h2>
        <div class="info-row">
          <div class="info-label">Booking ID:</div>
          <div class="info-value"><strong>#${data.bookingId.slice(0, 8).toUpperCase()}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Vehicle Type:</div>
          <div class="info-value">${data.vehicleType}</div>
        </div>
        ${data.truckPlate ? `
        <div class="info-row">
          <div class="info-label">Assigned Truck:</div>
          <div class="info-value"><strong>${data.truckPlate}</strong></div>
        </div>
        ` : ''}
        ${data.material ? `
        <div class="info-row">
          <div class="info-label">Material:</div>
          <div class="info-value">${data.material}</div>
        </div>
        ` : ''}
        ${data.weightMt ? `
        <div class="info-row">
          <div class="info-label">Weight:</div>
          <div class="info-value">${data.weightMt} MT</div>
        </div>
        ` : ''}
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

      <!-- Customer Information -->
      ${data.customerName || data.customerPhone ? `
      <div class="customer-card">
        <h2>👤 Customer Contact</h2>
        ${data.customerName ? `
        <div class="info-row">
          <div class="info-label">Name:</div>
          <div class="info-value">${data.customerName}</div>
        </div>
        ` : ''}
        ${data.customerPhone ? `
        <div class="info-row">
          <div class="info-label">Phone:</div>
          <div class="info-value"><a href="tel:${data.customerPhone}" style="color: #0d47a1; text-decoration: none;">${data.customerPhone}</a></div>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <!-- Special Notes -->
      ${data.notes ? `
      <div class="notes-card">
        <h2>📝 Special Instructions</h2>
        <div class="notes-content">${data.notes}</div>
      </div>
      ` : ''}

      <!-- Disclaimer -->
      <div class="disclaimer">
        ⚠️ <strong>Important:</strong> Please ensure all documents are in order before starting the trip. Contact the operations team immediately if you have any concerns or need clarification.
      </div>

      <!-- CTA Button -->
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
        View Full Details →
      </a>

      <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
        Have questions? Contact our support team anytime.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px;"><strong>Real-Time Shipment Tracking System</strong></p>
      <p style="margin: 0; opacity: 0.8;">
        This is an automated notification. Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0; opacity: 0.7;">
        © ${new Date().getFullYear()} RTS. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send driver notification email via Supabase Auth
 * Note: This uses Supabase's built-in email system which requires proper configuration
 */
export async function sendDriverNotificationEmail(data: BookingEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // For Supabase Auth email, we need to use a different approach
    // Since Supabase Auth emails are primarily for authentication,
    // we'll need to create a custom implementation using their Admin API
    
    const supabase = createClient();
    
    // Store notification in database for tracking
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: null, // No user_id since this is for driver
      type: 'booking_assigned',
      title: 'New Trip Assignment',
      message: `New trip from ${data.sourceCity} to ${data.destinationCity}`,
      data: {
        booking_id: data.bookingId,
        driver_email: data.driverEmail,
        driver_name: data.driverName
      },
      channel: 'email',
      sent_at: new Date().toISOString()
    });

    if (notifError) {
      console.error('Failed to log notification:', notifError);
    }

    // TODO: Actual email sending will be implemented via Supabase Edge Function
    // For now, we'll return success and log the email content
    console.log('=== DRIVER NOTIFICATION EMAIL ===');
    console.log('To:', data.driverEmail);
    console.log('Subject: New Trip Assignment - ', data.sourceCity, 'to', data.destinationCity);
    console.log('Booking ID:', data.bookingId);
    console.log('================================');

    return { success: true };
  } catch (error: any) {
    console.error('Error sending driver notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate plain text version of the email (fallback)
 */
export function generateDriverNotificationText(data: BookingEmailData): string {
  const pickupDateFormatted = data.pickupDate 
    ? new Date(data.pickupDate).toLocaleDateString('en-IN')
    : 'Not specified';

  const arrivalDateFormatted = data.estimatedArrival
    ? new Date(data.estimatedArrival).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : null;

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

  return `
🚛 NEW TRIP ASSIGNMENT
========================

Hello ${data.driverName},

You have been assigned a new delivery trip!

📍 ROUTE DETAILS
----------------
From: ${data.sourceCity}
To: ${data.destinationCity}
${data.estimatedDistance ? `Distance: ${data.estimatedDistance} km` : ''}
${data.estimatedDuration ? `Est. Time: ${formatDuration(data.estimatedDuration)}` : ''}

📦 SHIPMENT INFORMATION
-----------------------
Booking ID: #${data.bookingId.slice(0, 8).toUpperCase()}
Vehicle Type: ${data.vehicleType}
${data.truckPlate ? `Assigned Truck: ${data.truckPlate}` : ''}
${data.material ? `Material: ${data.material}` : ''}
${data.weightMt ? `Weight: ${data.weightMt} MT` : ''}
Pickup Date: ${pickupDateFormatted}
${arrivalDateFormatted ? `Est. Arrival: ${arrivalDateFormatted}` : ''}

${data.customerName || data.customerPhone ? `
👤 CUSTOMER CONTACT
-------------------
${data.customerName ? `Name: ${data.customerName}` : ''}
${data.customerPhone ? `Phone: ${data.customerPhone}` : ''}
` : ''}

${data.notes ? `
📝 SPECIAL INSTRUCTIONS
-----------------------
${data.notes}
` : ''}

⚠️ IMPORTANT: Please ensure all documents are in order before starting the trip.

View full details: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard

---
Real-Time Shipment Tracking System
© ${new Date().getFullYear()} RTS. All rights reserved.
  `.trim();
}
