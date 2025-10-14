/**
 * Email Configuration for SMTP
 * Supports Gmail, Outlook, and custom SMTP servers
 */

import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

/**
 * Get email configuration from environment variables
 */
export function getEmailConfig(): EmailConfig {
  // Check required environment variables
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromName = process.env.SMTP_FROM_NAME || 'Rajmohan Transport Services';
  const fromEmail = process.env.SMTP_FROM_EMAIL || user;

  if (!host || !port || !user || !pass) {
    throw new Error(
      'Missing SMTP configuration. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env.local'
    );
  }

  return {
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    from: {
      name: fromName,
      email: fromEmail || user,
    },
  };
}

/**
 * Create nodemailer transporter with error handling
 */
export async function createTransporter() {
  try {
    const config = getEmailConfig();
    
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    return transporter;
  } catch (error: any) {
    console.error('❌ SMTP connection failed:', error.message);
    throw new Error(`Failed to create email transporter: ${error.message}`);
  }
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}
