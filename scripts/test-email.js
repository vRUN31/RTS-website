/**
 * Test SMTP Email Configuration
 * Run this to verify your email setup is working
 * 
 * Usage: node scripts/test-email.js
 */

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('\n🧪 Testing SMTP Email Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
  console.log('  SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
  console.log('  SMTP_SECURE:', process.env.SMTP_SECURE || '(auto)');
  console.log('  SMTP_USER:', process.env.SMTP_USER ? '✅ SET' : '❌ NOT SET');
  console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '✅ SET (hidden)' : '❌ NOT SET');
  console.log('  SMTP_FROM_NAME:', process.env.SMTP_FROM_NAME || '❌ NOT SET');
  console.log('  SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL || '❌ NOT SET');
  console.log('');

  // Check if all required variables are set
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Missing required SMTP configuration!');
    console.log('\n💡 Add these to your .env.local file:');
    console.log('   SMTP_HOST=smtp.gmail.com');
    console.log('   SMTP_PORT=587');
    console.log('   SMTP_USER=your-email@gmail.com');
    console.log('   SMTP_PASS=your-app-password');
    console.log('   SMTP_FROM_NAME=Rajmohan Transport Services');
    console.log('   SMTP_FROM_EMAIL=your-email@gmail.com');
    process.exit(1);
  }

  try {
    // Create transporter
    console.log('🔧 Creating SMTP transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Ask for test email address
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question('📧 Enter email address to send test email to (or press Enter to skip): ', async (testEmail) => {
      readline.close();

      if (testEmail && testEmail.includes('@')) {
        console.log(`\n📤 Sending test email to: ${testEmail}...`);
        
        try {
          const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to: testEmail,
            subject: '✅ RTS Email Test - Configuration Working!',
            text: 'This is a test email from Rajmohan Transport Services. If you received this, your SMTP configuration is working correctly!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #10b981; border-radius: 12px; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);">
                <h2 style="color: #10b981; text-align: center;">✅ Email Test Successful!</h2>
                <p style="font-size: 16px; line-height: 1.6;">
                  This is a test email from <strong>Rajmohan Transport Services</strong>.
                </p>
                <p style="font-size: 16px; line-height: 1.6;">
                  If you received this email, your SMTP configuration is <strong style="color: #10b981;">working correctly</strong>! 🎉
                </p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #d1fae5;">
                <p style="font-size: 14px; color: #666;">
                  <strong>Test Details:</strong><br>
                  Time: ${new Date().toLocaleString()}<br>
                  From: ${process.env.SMTP_FROM_NAME} (${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER})<br>
                  SMTP Host: ${process.env.SMTP_HOST}<br>
                  SMTP Port: ${process.env.SMTP_PORT}
                </p>
                <div style="background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px;">
                  <p style="margin: 0; font-weight: bold;">🚀 Ready to send client emails!</p>
                </div>
              </div>
            `,
          });

          console.log('✅ Test email sent successfully!');
          console.log('📬 Message ID:', info.messageId);
          console.log('\n💡 Check your inbox (and spam folder) for the test email.\n');
        } catch (emailError) {
          console.error('❌ Failed to send test email:', emailError.message);
          console.log('\n💡 Common issues:');
          console.log('   - Wrong Gmail App Password (use App Password, not regular password)');
          console.log('   - 2-factor authentication not enabled on Gmail');
          console.log('   - "Less secure app access" disabled (use App Password instead)');
          console.log('   - Firewall blocking port 587');
        }
      } else {
        console.log('\n✅ SMTP configuration test complete!');
        console.log('💡 You can now use the email system in your app.\n');
      }
    });

  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your Gmail App Password is correct');
    console.log('   2. Make sure 2-factor authentication is enabled on Gmail');
    console.log('   3. Generate a new App Password at: https://myaccount.google.com/apppasswords');
    console.log('   4. Check firewall is not blocking port 587');
    console.log('   5. Verify SMTP_USER is your full Gmail address');
    process.exit(1);
  }
}

testEmailConfig();
