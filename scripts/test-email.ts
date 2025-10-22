/**
 * Test Email Script
 * Run this to verify your SMTP configuration is working
 * 
 * Usage: npx tsx scripts/test-email.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { sendTestEmail } from '../src/utils/email';
import { isEmailConfigured, getEmailConfig } from '../src/utils/email/config';

async function main() {
  console.log('🔍 Checking SMTP configuration...\n');

  // Check if configured
  if (!isEmailConfigured()) {
    console.error('❌ SMTP not configured!');
    console.error('Please set the following in .env.local:');
    console.error('  - SMTP_HOST');
    console.error('  - SMTP_PORT');
    console.error('  - SMTP_USER');
    console.error('  - SMTP_PASS');
    process.exit(1);
  }

  // Show current config (hide password)
  try {
    const config = getEmailConfig();
    console.log('✅ SMTP Configuration Found:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   User: ${config.auth.user}`);
    console.log(`   Pass: ${'*'.repeat(config.auth.pass.length)}`);
    console.log(`   From: ${config.from.name} <${config.from.email}>\n`);
  } catch (error: any) {
    console.error('❌ Configuration Error:', error.message);
    process.exit(1);
  }

  // Get recipient email
  const recipientEmail = process.argv[2] || process.env.SMTP_USER;
  
  if (!recipientEmail) {
    console.error('❌ No recipient email specified!');
    console.error('Usage: npx tsx scripts/test-email.ts your-email@example.com');
    process.exit(1);
  }

  console.log(`📧 Sending test email to: ${recipientEmail}\n`);

  // Send test email
  try {
    const result = await sendTestEmail(recipientEmail);

    if (result.success) {
      console.log('✅ SUCCESS! Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`\n📬 Check your inbox at: ${recipientEmail}`);
      console.log('   (It may take a few seconds to arrive)');
    } else {
      console.error('❌ FAILED to send test email');
      console.error(`   Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    console.error('\nCommon issues:');
    console.error('  1. Gmail App Password not generated (visit: https://myaccount.google.com/apppasswords)');
    console.error('  2. Less secure app access disabled');
    console.error('  3. Wrong credentials in .env.local');
    console.error('  4. Firewall blocking SMTP port 587');
    process.exit(1);
  }
}

main();
