/**
 * Professional HTML Email Templates for RTS
 */

export interface TripAssignmentEmailData {
  driverName: string;
  truckPlate: string;
  bookingId: string;
  sourceCity: string;
  destinationCity: string;
  distance: number;
  estimatedTime: string;
  pickupDate: string;
  material?: string;
  weight?: number;
  vehicleType: string;
  customerName?: string;
  specialInstructions?: string;
}

/**
 * Generate professional HTML email for driver trip assignment
 */
export function generateTripAssignmentEmail(data: TripAssignmentEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trip Assignment Notification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #ff4d00 0%, #ff6a00 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1a1a1a;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #555;
      margin-bottom: 30px;
    }
    .trip-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-left: 5px solid #ff4d00;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .trip-header {
      font-size: 18px;
      font-weight: 700;
      color: #ff4d00;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    .trip-header svg {
      margin-right: 10px;
    }
    .route-section {
      background: #ffffff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .route-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    .route-point {
      flex: 1;
      text-align: center;
    }
    .route-marker {
      display: inline-block;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-weight: 700;
      font-size: 18px;
      line-height: 40px;
      color: #fff;
      margin-bottom: 8px;
    }
    .route-marker.start {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    .route-marker.end {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
    .route-arrow {
      font-size: 24px;
      color: #ff4d00;
      padding: 0 15px;
    }
    .location-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .location-name {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    .info-item {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #ff4d00;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .details-section {
      background: #ffffff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .details-title {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
    .details-title svg {
      margin-right: 8px;
    }
    .details-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .details-list li {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .details-list li:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 14px;
      color: #666;
    }
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .alert-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
    }
    .alert-box p {
      margin: 0;
      font-size: 14px;
      color: #856404;
      line-height: 1.5;
    }
    .cta-section {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #ff4d00 0%, #ff6a00 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(255, 77, 0, 0.3);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 77, 0, 0.4);
    }
    .footer {
      background: #1a1a1a;
      color: #ffffff;
      padding: 25px 20px;
      text-align: center;
      font-size: 14px;
    }
    .footer p {
      margin: 8px 0;
      opacity: 0.8;
    }
    .footer a {
      color: #ff4d00;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
      .route-display {
        flex-direction: column;
      }
      .route-arrow {
        transform: rotate(90deg);
        padding: 10px 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🚛 New Trip Assignment</h1>
      <p>You have been assigned to a new shipment</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Hello ${data.driverName},
      </div>

      <div class="message">
        You have been assigned to a new trip by the admin team. Please review the details below and prepare for the journey. Ensure your truck is ready and all necessary documents are in order.
      </div>

      <!-- Trip Card -->
      <div class="trip-card">
        <div class="trip-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Trip Details
        </div>

        <!-- Route Section -->
        <div class="route-section">
          <div class="route-display">
            <div class="route-point">
              <div class="route-marker start">A</div>
              <div class="location-label">From</div>
              <div class="location-name">${data.sourceCity}</div>
            </div>
            <div class="route-arrow">→</div>
            <div class="route-point">
              <div class="route-marker end">B</div>
              <div class="location-label">To</div>
              <div class="location-name">${data.destinationCity}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">📏 Distance</div>
              <div class="info-value">${data.distance} km</div>
            </div>
            <div class="info-item">
              <div class="info-label">⏱️ Est. Time</div>
              <div class="info-value">${data.estimatedTime}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📅 Pickup Date</div>
              <div class="info-value">${data.pickupDate}</div>
            </div>
            <div class="info-item">
              <div class="info-label">🚚 Vehicle</div>
              <div class="info-value">${data.vehicleType}</div>
            </div>
          </div>
        </div>

        <!-- Assignment Details -->
        <div class="details-section">
          <div class="details-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Assignment Information
          </div>
          <ul class="details-list">
            <li>
              <span class="detail-label">Booking ID</span>
              <span class="detail-value">${data.bookingId.slice(0, 8).toUpperCase()}</span>
            </li>
            <li>
              <span class="detail-label">Assigned Truck</span>
              <span class="detail-value">${data.truckPlate}</span>
            </li>
            <li>
              <span class="detail-label">Driver Name</span>
              <span class="detail-value">${data.driverName}</span>
            </li>
            ${data.material ? `
            <li>
              <span class="detail-label">Material</span>
              <span class="detail-value">${data.material}</span>
            </li>
            ` : ''}
            ${data.weight ? `
            <li>
              <span class="detail-label">Weight</span>
              <span class="detail-value">${data.weight} MT</span>
            </li>
            ` : ''}
            ${data.customerName ? `
            <li>
              <span class="detail-label">Customer</span>
              <span class="detail-value">${data.customerName}</span>
            </li>
            ` : ''}
          </ul>
        </div>

        ${data.specialInstructions ? `
        <div class="alert-box">
          <p><strong>⚠️ Special Instructions:</strong><br>${data.specialInstructions}</p>
        </div>
        ` : ''}
      </div>

      <!-- CTA Section -->
      <div class="cta-section">
        <p style="margin-bottom: 15px; color: #666;">Ready to start your journey?</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login" class="cta-button">
          View Trip Dashboard →
        </a>
      </div>

      <div class="message" style="margin-top: 30px; font-size: 14px; color: #666;">
        If you have any questions or concerns about this assignment, please contact the operations team immediately. Safe travels!
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Rajmohan Transport Services</strong></p>
      <p>Professional Transportation Solutions</p>
      <p>📧 <a href="mailto:support@rajmohantransport.com">support@rajmohantransport.com</a></p>
      <p>📞 +91 1800-XXX-XXXX</p>
      <p style="margin-top: 15px; font-size: 12px;">
        © 2025 Rajmohan Transport Services. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the email (fallback)
 */
export function generateTripAssignmentTextEmail(data: TripAssignmentEmailData): string {
  return `
NEW TRIP ASSIGNMENT

Hello ${data.driverName},

You have been assigned to a new trip by the admin team. Please review the details below:

ROUTE DETAILS:
--------------
From: ${data.sourceCity}
To: ${data.destinationCity}
Distance: ${data.distance} km
Estimated Time: ${data.estimatedTime}
Pickup Date: ${data.pickupDate}

ASSIGNMENT INFORMATION:
-----------------------
Booking ID: ${data.bookingId.slice(0, 8).toUpperCase()}
Assigned Truck: ${data.truckPlate}
Driver Name: ${data.driverName}
Vehicle Type: ${data.vehicleType}
${data.material ? `Material: ${data.material}` : ''}
${data.weight ? `Weight: ${data.weight} MT` : ''}
${data.customerName ? `Customer: ${data.customerName}` : ''}

${data.specialInstructions ? `
SPECIAL INSTRUCTIONS:
${data.specialInstructions}
` : ''}

Please ensure your truck is ready and all necessary documents are in order.

If you have any questions, contact the operations team immediately.

Safe travels!

---
Rajmohan Transport Services
Professional Transportation Solutions
Email: support@rajmohantransport.com
Phone: +91 1800-XXX-XXXX

© 2025 Rajmohan Transport Services. All rights reserved.
  `.trim();
}

// ============================================================================
// CLIENT EMAIL TEMPLATES
// ============================================================================

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

/**
 * Generate professional HTML email for booking approval notification to client
 */
export function generateClientBookingApprovedEmail(data: ClientBookingApprovedEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Approved - Shipment Confirmed</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      padding: 40px 20px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1a1a1a;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #555;
      margin-bottom: 30px;
    }
    .status-badge {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .trip-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-left: 5px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .trip-header {
      font-size: 18px;
      font-weight: 700;
      color: #10b981;
      margin-bottom: 15px;
    }
    .route-section {
      background: #ffffff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .route-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    .route-point {
      flex: 1;
      text-align: center;
    }
    .route-marker {
      display: inline-block;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-weight: 700;
      font-size: 18px;
      line-height: 40px;
      color: #fff;
      margin-bottom: 8px;
    }
    .route-marker.start {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    .route-marker.end {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
    .route-arrow {
      font-size: 24px;
      color: #10b981;
      padding: 0 15px;
    }
    .location-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .location-name {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    .info-item {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #10b981;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .details-section {
      background: #ffffff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .details-title {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    .details-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .details-list li {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .details-list li:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 14px;
      color: #666;
    }
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .highlight-box {
      background: #d1fae5;
      border: 1px solid #10b981;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
    }
    .highlight-box p {
      margin: 0;
      font-size: 14px;
      color: #065f46;
      line-height: 1.5;
    }
    .cta-section {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: all 0.3s ease;
    }
    .footer {
      background: #1a1a1a;
      color: #ffffff;
      padding: 25px 20px;
      text-align: center;
      font-size: 14px;
    }
    .footer p {
      margin: 8px 0;
      opacity: 0.8;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
      .route-display {
        flex-direction: column;
      }
      .route-arrow {
        transform: rotate(90deg);
        padding: 10px 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">✅</div>
      <h1>Booking Approved!</h1>
      <p>Your shipment has been confirmed and assigned</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${data.customerName},
      </div>

      <div class="status-badge">✅ APPROVED & SCHEDULED</div>

      <div class="message">
        Great news! Your booking has been approved and a truck has been assigned to your shipment. Your goods will be picked up as scheduled, and we'll keep you updated throughout the journey.
      </div>

      <div class="trip-card">
        <div class="trip-header">
          📦 Shipment Details
        </div>

        <div class="route-section">
          <div class="route-display">
            <div class="route-point">
              <div class="route-marker start">A</div>
              <div class="location-label">Pickup From</div>
              <div class="location-name">${data.sourceCity}</div>
            </div>
            <div class="route-arrow">→</div>
            <div class="route-point">
              <div class="route-marker end">B</div>
              <div class="location-label">Deliver To</div>
              <div class="location-name">${data.destinationCity}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">📏 Distance</div>
              <div class="info-value">${data.distance} km</div>
            </div>
            <div class="info-item">
              <div class="info-label">⏱️ Est. Time</div>
              <div class="info-value">${data.estimatedTime}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📅 Pickup Date</div>
              <div class="info-value">${data.pickupDate}</div>
            </div>
            <div class="info-item">
              <div class="info-label">🎯 Est. Arrival</div>
              <div class="info-value">${data.estimatedArrival}</div>
            </div>
          </div>
        </div>

        <div class="details-section">
          <div class="details-title">📋 Booking Information</div>
          <ul class="details-list">
            <li>
              <span class="detail-label">Booking ID</span>
              <span class="detail-value">${data.bookingId.slice(0, 8).toUpperCase()}</span>
            </li>
            <li>
              <span class="detail-label">Vehicle Type</span>
              <span class="detail-value">${data.vehicleType}</span>
            </li>
            <li>
              <span class="detail-label">Assigned Truck</span>
              <span class="detail-value">${data.truckPlate}</span>
            </li>
            <li>
              <span class="detail-label">Driver</span>
              <span class="detail-value">${data.driverName}${data.driverPhone ? ` • ${data.driverPhone}` : ''}</span>
            </li>
            ${data.material ? `
            <li>
              <span class="detail-label">Material</span>
              <span class="detail-value">${data.material}</span>
            </li>
            ` : ''}
            ${data.weight ? `
            <li>
              <span class="detail-label">Weight</span>
              <span class="detail-value">${data.weight} MT</span>
            </li>
            ` : ''}
          </ul>
        </div>

        <div class="highlight-box">
          <p><strong>✨ Next Steps:</strong><br>
          Your shipment is now scheduled for pickup on ${data.pickupDate}. You'll receive another email when the driver starts the journey. You can track your shipment in real-time through your dashboard.</p>
        </div>
      </div>

      ${data.trackingUrl ? `
      <div class="cta-section">
        <p style="margin-bottom: 15px; color: #666;">Track your shipment in real-time</p>
        <a href="${data.trackingUrl}" class="cta-button">
          View Dashboard →
        </a>
      </div>
      ` : ''}

      <div class="message" style="margin-top: 30px; font-size: 14px; color: #666;">
        If you have any questions or concerns, please don't hesitate to contact our support team. We're here to ensure your shipment arrives safely and on time.
      </div>
    </div>

    <div class="footer">
      <p><strong>Rajmohan Transport Services</strong></p>
      <p>Professional Transportation Solutions</p>
      <p>📧 <a href="mailto:support@rajmohantransport.com">support@rajmohantransport.com</a></p>
      <p>📞 +91 1800-XXX-XXXX</p>
      <p style="margin-top: 15px; font-size: 12px;">
        © 2025 Rajmohan Transport Services. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate professional HTML email for trip started notification to client
 */
export function generateClientTripStartedEmail(data: ClientTripStartedEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trip Started - Shipment in Transit</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      padding: 40px 20px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1a1a1a;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #555;
      margin-bottom: 30px;
    }
    .status-badge {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 20px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    .trip-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-left: 5px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .trip-header {
      font-size: 18px;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 15px;
    }
    .route-section {
      background: #ffffff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .route-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    .route-point {
      flex: 1;
      text-align: center;
    }
    .route-marker {
      display: inline-block;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-weight: 700;
      font-size: 18px;
      line-height: 40px;
      color: #fff;
      margin-bottom: 8px;
    }
    .route-marker.start {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    .route-marker.end {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
    .route-marker.current {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      animation: pulse 1.5s infinite;
    }
    .route-arrow {
      font-size: 24px;
      color: #3b82f6;
      padding: 0 15px;
    }
    .location-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .location-name {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    .info-item {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .details-section {
      background: #ffffff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .details-title {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    .details-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .details-list li {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .details-list li:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 14px;
      color: #666;
    }
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .highlight-box {
      background: #dbeafe;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
    }
    .highlight-box p {
      margin: 0;
      font-size: 14px;
      color: #1e40af;
      line-height: 1.5;
    }
    .cta-section {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    .footer {
      background: #1a1a1a;
      color: #ffffff;
      padding: 25px 20px;
      text-align: center;
      font-size: 14px;
    }
    .footer p {
      margin: 8px 0;
      opacity: 0.8;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">🚛</div>
      <h1>Trip Started!</h1>
      <p>Your shipment is now on its way</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${data.customerName},
      </div>

      <div class="status-badge">🚚 IN TRANSIT</div>

      <div class="message">
        Good news! Your shipment has started its journey and is now on the way to the destination. You can track the live location and estimated arrival time through your dashboard.
      </div>

      <div class="trip-card">
        <div class="trip-header">
          📍 Live Tracking
        </div>

        <div class="route-section">
          <div class="route-display">
            <div class="route-point">
              <div class="route-marker start">✓</div>
              <div class="location-label">From</div>
              <div class="location-name">${data.sourceCity}</div>
            </div>
            <div class="route-arrow">→</div>
            ${data.currentLocation ? `
            <div class="route-point">
              <div class="route-marker current">📍</div>
              <div class="location-label">Current</div>
              <div class="location-name">${data.currentLocation}</div>
            </div>
            <div class="route-arrow">→</div>
            ` : ''}
            <div class="route-point">
              <div class="route-marker end">B</div>
              <div class="location-label">To</div>
              <div class="location-name">${data.destinationCity}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">📏 Total Distance</div>
              <div class="info-value">${data.distance} km</div>
            </div>
            <div class="info-item">
              <div class="info-label">⏱️ Est. Time</div>
              <div class="info-value">${data.estimatedTime}</div>
            </div>
            <div class="info-item">
              <div class="info-label">🎯 Est. Arrival</div>
              <div class="info-value">${data.estimatedArrival}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📦 Status</div>
              <div class="info-value" style="color: #3b82f6;">In Transit</div>
            </div>
          </div>
        </div>

        <div class="details-section">
          <div class="details-title">🚛 Transport Details</div>
          <ul class="details-list">
            <li>
              <span class="detail-label">Shipment ID</span>
              <span class="detail-value">${data.shipmentId.slice(0, 8).toUpperCase()}</span>
            </li>
            <li>
              <span class="detail-label">Booking ID</span>
              <span class="detail-value">${data.bookingId.slice(0, 8).toUpperCase()}</span>
            </li>
            <li>
              <span class="detail-label">Truck Number</span>
              <span class="detail-value">${data.truckPlate}</span>
            </li>
            <li>
              <span class="detail-label">Driver</span>
              <span class="detail-value">${data.driverName}${data.driverPhone ? ` • ${data.driverPhone}` : ''}</span>
            </li>
          </ul>
        </div>

        <div class="highlight-box">
          <p><strong>📱 Track in Real-Time:</strong><br>
          Your shipment is being tracked live. You can view the current location, speed, and estimated arrival time through your dashboard. We'll notify you when the shipment reaches its destination.</p>
        </div>
      </div>

      ${data.trackingUrl ? `
      <div class="cta-section">
        <p style="margin-bottom: 15px; color: #666;">View live tracking and updates</p>
        <a href="${data.trackingUrl}" class="cta-button">
          Track Shipment →
        </a>
      </div>
      ` : ''}

      <div class="message" style="margin-top: 30px; font-size: 14px; color: #666;">
        You'll receive another notification when your shipment is delivered. If you have any questions, our support team is available 24/7.
      </div>
    </div>

    <div class="footer">
      <p><strong>Rajmohan Transport Services</strong></p>
      <p>Professional Transportation Solutions</p>
      <p>📧 <a href="mailto:support@rajmohantransport.com">support@rajmohantransport.com</a></p>
      <p>📞 +91 1800-XXX-XXXX</p>
      <p style="margin-top: 15px; font-size: 12px;">
        © 2025 Rajmohan Transport Services. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate professional HTML email for trip completed notification to client
 */
export function generateClientTripCompletedEmail(data: ClientTripCompletedEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shipment Delivered Successfully</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      padding: 40px 20px;
      text-align: center;
    }
    .header-icon {
      font-size: 64px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1a1a1a;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #555;
      margin-bottom: 30px;
    }
    .status-badge {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .trip-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-left: 5px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .trip-header {
      font-size: 18px;
      font-weight: 700;
      color: #10b981;
      margin-bottom: 15px;
    }
    .route-section {
      background: #ffffff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .route-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    .route-point {
      flex: 1;
      text-align: center;
    }
    .route-marker {
      display: inline-block;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-weight: 700;
      font-size: 18px;
      line-height: 40px;
      color: #fff;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    .route-arrow {
      font-size: 24px;
      color: #10b981;
      padding: 0 15px;
    }
    .location-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .location-name {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    .info-item {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #10b981;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .details-section {
      background: #ffffff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .details-title {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    .details-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .details-list li {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .details-list li:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 14px;
      color: #666;
    }
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .success-box {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
      text-align: center;
    }
    .success-box .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .success-box h3 {
      margin: 0 0 10px 0;
      color: #065f46;
      font-size: 20px;
    }
    .success-box p {
      margin: 0;
      font-size: 14px;
      color: #065f46;
      line-height: 1.5;
    }
    .cta-section {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      margin: 5px;
    }
    .cta-button.secondary {
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
    }
    .footer {
      background: #1a1a1a;
      color: #ffffff;
      padding: 25px 20px;
      text-align: center;
      font-size: 14px;
    }
    .footer p {
      margin: 8px 0;
      opacity: 0.8;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">🎉</div>
      <h1>Delivered Successfully!</h1>
      <p>Your shipment has reached its destination</p>
    </div>

    <div class="content">
      <div class="greeting">
        Dear ${data.customerName},
      </div>

      <div class="status-badge">✅ DELIVERED</div>

      <div class="message">
        Excellent news! Your shipment has been successfully delivered to the destination. Thank you for choosing Rajmohan Transport Services for your logistics needs.
      </div>

      <div class="trip-card">
        <div class="trip-header">
          ✅ Delivery Confirmation
        </div>

        <div class="route-section">
          <div class="route-display">
            <div class="route-point">
              <div class="route-marker">✓</div>
              <div class="location-label">From</div>
              <div class="location-name">${data.sourceCity}</div>
            </div>
            <div class="route-arrow">→</div>
            <div class="route-point">
              <div class="route-marker">✓</div>
              <div class="location-label">To</div>
              <div class="location-name">${data.destinationCity}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">📏 Distance Covered</div>
              <div class="info-value">${data.distance} km</div>
            </div>
            <div class="info-item">
              <div class="info-label">⏱️ Time Taken</div>
              <div class="info-value">${data.actualTime}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📅 Delivery Date</div>
              <div class="info-value">${data.deliveryDate}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📦 Status</div>
              <div class="info-value" style="color: #10b981;">Delivered</div>
            </div>
          </div>
        </div>

        <div class="details-section">
          <div class="details-title">📋 Delivery Details</div>
          <ul class="details-list">
            <li>
              <span class="detail-label">Shipment ID</span>
              <span class="detail-value">${data.shipmentId.slice(0, 8).toUpperCase()}</span>
            </li>
            <li>
              <span class="detail-label">Booking ID</span>
              <span class="detail-value">${data.bookingId.slice(0, 8).toUpperCase()}</span>
            </li>
            <li>
              <span class="detail-label">Truck Number</span>
              <span class="detail-value">${data.truckPlate}</span>
            </li>
            <li>
              <span class="detail-label">Driver</span>
              <span class="detail-value">${data.driverName}${data.driverPhone ? ` • ${data.driverPhone}` : ''}</span>
            </li>
          </ul>
        </div>

        <div class="success-box">
          <div class="icon">📦✓</div>
          <h3>Shipment Delivered Successfully</h3>
          <p>Your goods have been safely delivered. You can now download delivery documents including the Proof of Delivery (PoD), invoice, and waybill from your dashboard.</p>
        </div>
      </div>

      <div class="cta-section">
        <p style="margin-bottom: 15px; color: #666; font-weight: 600;">Access your delivery documents</p>
        ${data.documentsUrl ? `
        <a href="${data.documentsUrl}" class="cta-button">
          📄 Download Documents
        </a>
        ` : ''}
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/customer" class="cta-button secondary">
          View Dashboard
        </a>
      </div>

      <div class="message" style="margin-top: 30px; font-size: 14px; color: #666; text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <strong>📞 Need Help?</strong><br>
        If you have any questions about your delivery or need assistance, our support team is here to help 24/7.
      </div>

      <div class="message" style="margin-top: 20px; font-size: 14px; color: #666; text-align: center;">
        <strong>⭐ We Value Your Feedback</strong><br>
        Thank you for choosing us! We'd love to hear about your experience. Your feedback helps us improve our services.
      </div>
    </div>

    <div class="footer">
      <p><strong>Rajmohan Transport Services</strong></p>
      <p>Professional Transportation Solutions</p>
      <p>📧 <a href="mailto:support@rajmohantransport.com">support@rajmohantransport.com</a></p>
      <p>📞 +91 1800-XXX-XXXX</p>
      <p style="margin-top: 15px; font-size: 12px;">
        © 2025 Rajmohan Transport Services. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
