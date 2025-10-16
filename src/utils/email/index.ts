/**
 * Email Sending Utilities for RTS
 * Handles sending various email notifications
 */

import { createTransporter, getEmailConfig, isEmailConfigured } from './config';
import {
  generateTripAssignmentEmail,
  generateTripAssignmentTextEmail,
  generateClientBookingApprovedEmail,
  generateClientTripStartedEmail,
  generateClientTripCompletedEmail,
  type TripAssignmentEmailData,
  type ClientBookingApprovedEmailData,
  type ClientTripStartedEmailData,
  type ClientTripCompletedEmailData,
} from './templates';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send trip assignment email to driver
 */
export async function sendDriverAssignmentEmail(
  driverEmail: string,
  tripData: TripAssignmentEmailData
): Promise<SendEmailResult> {
  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('⚠️ Email not configured. Skipping email send.');
      return {
        success: false,
        error: 'SMTP not configured. Please set environment variables.',
      };
    }

    // Validate driver email
    if (!driverEmail || !isValidEmail(driverEmail)) {
      console.error('❌ Invalid driver email:', driverEmail);
      return {
        success: false,
        error: 'Invalid driver email address',
      };
    }

    console.log(`📧 Preparing to send trip assignment email to: ${driverEmail}`);

    // Get config and create transporter
    const config = getEmailConfig();
    const transporter = await createTransporter();

    // Generate email content
    const htmlContent = generateTripAssignmentEmail(tripData);
    const textContent = generateTripAssignmentTextEmail(tripData);

    // Send email
    const info = await transporter.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to: driverEmail,
      subject: `🚛 New Trip Assignment - ${tripData.sourceCity} → ${tripData.destinationCity}`,
      text: textContent,
      html: htmlContent,
      // Optional: Add attachments, reply-to, etc.
      replyTo: config.from.email,
      priority: 'high',
    });

    console.log('✅ Email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Validate email address format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Send test email to verify SMTP configuration
 */
export async function sendTestEmail(toEmail: string): Promise<SendEmailResult> {
  try {
    if (!isEmailConfigured()) {
      return {
        success: false,
        error: 'SMTP not configured',
      };
    }

    const config = getEmailConfig();
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to: toEmail,
      subject: '✅ RTS Email System - Test Email',
      text: 'This is a test email from Rajmohan Transport Services. If you received this, your SMTP configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #ff4d00;">✅ Email System Test</h2>
          <p>This is a test email from <strong>Rajmohan Transport Services</strong>.</p>
          <p>If you received this email, your SMTP configuration is working correctly!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">
            Test sent at: ${new Date().toLocaleString()}<br>
            From: ${config.from.name} (${config.from.email})
          </p>
        </div>
      `,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send booking approval email to client
 */
export async function sendClientBookingApprovedEmail(
  clientEmail: string,
  bookingData: ClientBookingApprovedEmailData
): Promise<SendEmailResult> {
  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('⚠️ Email not configured. Skipping client email send.');
      return {
        success: false,
        error: 'SMTP not configured. Please set environment variables.',
      };
    }

    // Validate client email
    if (!clientEmail || !isValidEmail(clientEmail)) {
      console.error('❌ Invalid client email:', clientEmail);
      return {
        success: false,
        error: 'Invalid client email address',
      };
    }

    console.log(`📧 Preparing to send booking approval email to: ${clientEmail}`);

    // Get config and create transporter
    const config = getEmailConfig();
    const transporter = await createTransporter();

    // Generate email content
    const htmlContent = generateClientBookingApprovedEmail(bookingData);

    // Send email
    const info = await transporter.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to: clientEmail,
      subject: `✅ Booking Approved - ${bookingData.sourceCity} → ${bookingData.destinationCity}`,
      html: htmlContent,
      replyTo: config.from.email,
      priority: 'high',
    });

    console.log('✅ Client booking approval email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Failed to send client booking approval email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send trip started email to client
 */
export async function sendClientTripStartedEmail(
  clientEmail: string,
  tripData: ClientTripStartedEmailData
): Promise<SendEmailResult> {
  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('⚠️ Email not configured. Skipping client email send.');
      return {
        success: false,
        error: 'SMTP not configured. Please set environment variables.',
      };
    }

    // Validate client email
    if (!clientEmail || !isValidEmail(clientEmail)) {
      console.error('❌ Invalid client email:', clientEmail);
      return {
        success: false,
        error: 'Invalid client email address',
      };
    }

    console.log(`📧 Preparing to send trip started email to: ${clientEmail}`);

    // Get config and create transporter
    const config = getEmailConfig();
    const transporter = await createTransporter();

    // Generate email content
    const htmlContent = generateClientTripStartedEmail(tripData);

    // Send email
    const info = await transporter.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to: clientEmail,
      subject: `🚛 Shipment Started - ${tripData.sourceCity} → ${tripData.destinationCity}`,
      html: htmlContent,
      replyTo: config.from.email,
      priority: 'normal',
    });

    console.log('✅ Client trip started email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Failed to send client trip started email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send trip completed email to client
 */
export async function sendClientTripCompletedEmail(
  clientEmail: string,
  completionData: ClientTripCompletedEmailData
): Promise<SendEmailResult> {
  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('⚠️ Email not configured. Skipping client email send.');
      return {
        success: false,
        error: 'SMTP not configured. Please set environment variables.',
      };
    }

    // Validate client email
    if (!clientEmail || !isValidEmail(clientEmail)) {
      console.error('❌ Invalid client email:', clientEmail);
      return {
        success: false,
        error: 'Invalid client email address',
      };
    }

    console.log(`📧 Preparing to send trip completed email to: ${clientEmail}`);

    // Get config and create transporter
    const config = getEmailConfig();
    const transporter = await createTransporter();

    // Generate email content
    const htmlContent = generateClientTripCompletedEmail(completionData);

    // Send email
    const info = await transporter.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to: clientEmail,
      subject: `🎉 Shipment Delivered - ${completionData.sourceCity} → ${completionData.destinationCity}`,
      html: htmlContent,
      replyTo: config.from.email,
      priority: 'normal',
    });

    console.log('✅ Client trip completed email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Failed to send client trip completed email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

// Export types
export type {
  TripAssignmentEmailData,
  ClientBookingApprovedEmailData,
  ClientTripStartedEmailData,
  ClientTripCompletedEmailData,
};
