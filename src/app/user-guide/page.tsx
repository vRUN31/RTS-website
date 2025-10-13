"use client";

import { useState } from 'react';
import styles from './user-guide.module.css';

export default function UserGuidePage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: '🚀 Getting Started', icon: '🚀' },
    { id: 'account', title: '👤 Account Management', icon: '👤' },
    { id: 'booking', title: '📦 Booking Trucks', icon: '📦' },
    { id: 'tracking', title: '📍 Tracking Shipments', icon: '📍' },
    { id: 'payments', title: '💳 Payments & Billing', icon: '💳' },
    { id: 'documents', title: '📄 Documents', icon: '📄' },
    { id: 'support', title: '🆘 Getting Help', icon: '🆘' },
    { id: 'faq', title: '❓ FAQ', icon: '❓' },
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>📚 Client User Guide</h1>
          <p className={styles.subtitle}>
            Complete guide to using Rajmohan Transport Services platform
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Sidebar Navigation */}
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <h2 className={styles.navTitle}>Quick Navigation</h2>
            {sections.map((section) => (
              <button
                key={section.id}
                className={`${styles.navItem} ${activeSection === section.id ? styles.navItemActive : ''}`}
                onClick={() => scrollToSection(section.id)}
              >
                <span className={styles.navIcon}>{section.icon}</span>
                <span className={styles.navText}>{section.title}</span>
              </button>
            ))}
          </nav>

          <div className={styles.helpBox}>
            <h3>Need Help?</h3>
            <p>Contact our support team</p>
            <a href="mailto:support@rajmohantransport.com" className={styles.helpButton}>
              📧 Email Support
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.content}>
          {/* Getting Started */}
          <section id="getting-started" className={styles.section}>
            <h2 className={styles.sectionTitle}>🚀 Getting Started</h2>
            
            <div className={styles.card}>
              <h3>Welcome to Rajmohan Transport Services!</h3>
              <p>
                This platform helps you book trucks, track shipments, manage documents, and communicate
                with our team - all in one place. Let's get you started!
              </p>
            </div>

            <div className={styles.card}>
              <h3>Step 1: Create Your Account</h3>
              <ol className={styles.stepList}>
                <li>Click <strong>"Sign Up"</strong> on the homepage</li>
                <li>Enter your email address and create a password</li>
                <li>Fill in your business details (company name, contact info)</li>
                <li>Verify your email address by clicking the link sent to your inbox</li>
                <li>Log in with your credentials</li>
              </ol>
              <div className={styles.tip}>
                <strong>💡 Tip:</strong> Use a strong password with at least 8 characters, including
                numbers and special characters.
              </div>
            </div>

            <div className={styles.card}>
              <h3>Step 2: Dashboard Overview</h3>
              <p>After logging in, you'll see your dashboard with several sections:</p>
              <ul>
                <li><strong>📊 Quick Stats:</strong> Overview of active shipments, pending bookings, and costs</li>
                <li><strong>📦 Place Order:</strong> Create new truck booking requests</li>
                <li><strong>📋 My Bookings:</strong> View and track your booking requests</li>
                <li><strong>🚚 Active Shipments:</strong> Track ongoing deliveries in real-time</li>
                <li><strong>📄 Documents:</strong> Access invoices, receipts, and delivery proofs</li>
                <li><strong>💬 Live Chat:</strong> Communicate with our support team</li>
              </ul>
            </div>
          </section>

          {/* Account Management */}
          <section id="account" className={styles.section}>
            <h2 className={styles.sectionTitle}>👤 Account Management</h2>

            <div className={styles.card}>
              <h3>Viewing Your Profile</h3>
              <p>Click your name in the top-right corner to access account options:</p>
              <ul>
                <li><strong>Settings:</strong> Update your profile information</li>
                <li><strong>Security:</strong> Change password and security settings</li>
                <li><strong>Notifications:</strong> Manage email and SMS alerts</li>
                <li><strong>Sign Out:</strong> Safely log out of your account</li>
              </ul>
            </div>

            <div className={styles.card}>
              <h3>Updating Profile Information</h3>
              <ol className={styles.stepList}>
                <li>Click your profile menu (top-right)</li>
                <li>Select <strong>"Settings"</strong></li>
                <li>Update your information:
                  <ul>
                    <li>Company name</li>
                    <li>Contact person</li>
                    <li>Phone number</li>
                    <li>Email address</li>
                    <li>Billing address</li>
                  </ul>
                </li>
                <li>Click <strong>"Save Changes"</strong></li>
              </ol>
            </div>

            <div className={styles.card}>
              <h3>Changing Your Password</h3>
              <ol className={styles.stepList}>
                <li>Go to <strong>Settings → Security</strong></li>
                <li>Enter your current password</li>
                <li>Enter your new password (twice for confirmation)</li>
                <li>Click <strong>"Update Password"</strong></li>
              </ol>
              <div className={styles.warning}>
                <strong>⚠️ Important:</strong> You'll be logged out and need to sign in again with
                your new password.
              </div>
            </div>
          </section>

          {/* Booking Trucks */}
          <section id="booking" className={styles.section}>
            <h2 className={styles.sectionTitle}>📦 Booking Trucks</h2>

            <div className={styles.card}>
              <h3>How to Book a Truck</h3>
              <ol className={styles.stepList}>
                <li>Scroll to the <strong>"Place Order"</strong> section on your dashboard</li>
                <li>Click the <strong>"📦 Book Truck"</strong> button</li>
                <li>Fill in the booking form with required details</li>
                <li>Review your information</li>
                <li>Click <strong>"✅ Submit Booking"</strong></li>
              </ol>
            </div>

            <div className={styles.card}>
              <h3>Booking Form Fields Explained</h3>
              
              <div className={styles.fieldExplanation}>
                <h4>🔴 Required Fields</h4>
                <ul>
                  <li>
                    <strong>Source City:</strong> Starting location for pickup
                    <br/>
                    <em>Example: "Mumbai" or "Mumbai, Andheri East"</em>
                  </li>
                  <li>
                    <strong>Destination City:</strong> Delivery location
                    <br/>
                    <em>Example: "Delhi" or "Delhi, Connaught Place"</em>
                  </li>
                  <li>
                    <strong>Vehicle Type:</strong> Choose based on your cargo size
                    <ul className={styles.vehicleList}>
                      <li><strong>Pickup (1.5T):</strong> Small loads, city deliveries</li>
                      <li><strong>LCV (3.5T):</strong> Medium cargo, inter-city</li>
                      <li><strong>Truck (9T):</strong> Large shipments</li>
                      <li><strong>Truck (16T):</strong> Heavy cargo</li>
                      <li><strong>Trailer (25T):</strong> Bulk shipments, long distance</li>
                    </ul>
                  </li>
                </ul>

                <h4>⚪ Optional Fields</h4>
                <ul>
                  <li><strong>Material:</strong> Type of goods (e.g., "Electronics", "Furniture", "Food items")</li>
                  <li><strong>Weight (MT):</strong> Total weight in Metric Tons (helps us assign appropriate vehicle)</li>
                  <li><strong>Pickup Date:</strong> When you need the truck (we'll try to accommodate)</li>
                  <li><strong>Notes:</strong> Special instructions (e.g., "Fragile items", "Time-sensitive", "Need loading help")</li>
                </ul>
              </div>
            </div>

            <div className={styles.card}>
              <h3>After Submitting a Booking</h3>
              <ol className={styles.stepList}>
                <li><strong>Immediate:</strong> You'll see a success message</li>
                <li><strong>Within 24 hours:</strong> Our team reviews your request</li>
                <li><strong>Approval:</strong> You receive notification (email/SMS)</li>
                <li><strong>Rate Discussion:</strong> We provide a quote and discuss terms</li>
                <li><strong>Confirmation:</strong> Booking converts to an active shipment</li>
                <li><strong>Assignment:</strong> A truck and driver are assigned</li>
                <li><strong>Tracking:</strong> You can track your shipment in real-time</li>
              </ol>
            </div>

            <div className={styles.card}>
              <h3>Booking Status Types</h3>
              <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                  <span className={styles.statusBadge} style={{background: '#fbbf24'}}>Submitted</span>
                  <p>Your request is under review</p>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusBadge} style={{background: '#10b981'}}>Approved</span>
                  <p>Request accepted, pending rate discussion</p>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusBadge} style={{background: '#ef4444'}}>Rejected</span>
                  <p>Cannot fulfill this request (you'll receive explanation)</p>
                </div>
              </div>
            </div>

            <div className={styles.tip}>
              <strong>💡 Pro Tip:</strong> Book at least 2-3 days in advance for best availability.
              For urgent requests, add "URGENT" in the notes field.
            </div>
          </section>

          {/* Tracking Shipments */}
          <section id="tracking" className={styles.section}>
            <h2 className={styles.sectionTitle}>📍 Tracking Shipments</h2>

            <div className={styles.card}>
              <h3>How to Track Your Shipment</h3>
              <ol className={styles.stepList}>
                <li>Go to your dashboard</li>
                <li>Scroll to <strong>"Active Shipments"</strong> section</li>
                <li>Find your shipment in the list</li>
                <li>Click on the shipment row for detailed tracking</li>
              </ol>
            </div>

            <div className={styles.card}>
              <h3>Understanding Shipment Information</h3>
              <p>For each shipment, you'll see:</p>
              <ul>
                <li><strong>Shipment ID:</strong> Unique tracking number</li>
                <li><strong>Origin → Destination:</strong> Route details</li>
                <li><strong>Status:</strong> Current stage (Pending, In Transit, Delivered, etc.)</li>
                <li><strong>Vehicle Info:</strong> Truck plate number and type</li>
                <li><strong>Driver:</strong> Assigned driver (if available)</li>
                <li><strong>Estimated Delivery:</strong> Expected arrival date</li>
                <li><strong>Cost:</strong> Shipment charges</li>
              </ul>
            </div>

            <div className={styles.card}>
              <h3>Live GPS Tracking</h3>
              <p>For active shipments, you can see real-time location:</p>
              <ol className={styles.stepList}>
                <li>Click on an active shipment</li>
                <li>The map will show the truck's current location</li>
                <li>Green marker = Current position</li>
                <li>Blue route = Planned path</li>
                <li>Map updates every few minutes automatically</li>
              </ol>
              <div className={styles.tip}>
                <strong>💡 Note:</strong> GPS tracking is available only when the truck is in transit.
              </div>
            </div>

            <div className={styles.card}>
              <h3>Shipment Status Meanings</h3>
              <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                  <span className={styles.statusBadge} style={{background: '#94a3b8'}}>Pending</span>
                  <p>Waiting for truck assignment</p>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusBadge} style={{background: '#3b82f6'}}>In Transit</span>
                  <p>On the way to destination</p>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusBadge} style={{background: '#10b981'}}>Delivered</span>
                  <p>Successfully delivered</p>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusBadge} style={{background: '#ef4444'}}>Delayed</span>
                  <p>Experiencing delays (check notes)</p>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusBadge} style={{background: '#f59e0b'}}>On Hold</span>
                  <p>Temporarily paused (pending action)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Payments & Billing */}
          <section id="payments" className={styles.section}>
            <h2 className={styles.sectionTitle}>💳 Payments & Billing</h2>

            <div className={styles.card}>
              <h3>Understanding Costs</h3>
              <p>Your dashboard shows:</p>
              <ul>
                <li><strong>Total Cost:</strong> Sum of all shipment charges</li>
                <li><strong>Amount Paid:</strong> Payments received by us</li>
                <li><strong>Balance Due:</strong> Outstanding amount</li>
              </ul>
            </div>

            <div className={styles.card}>
              <h3>Payment Process</h3>
              <ol className={styles.stepList}>
                <li>After booking approval, you'll receive a rate quote</li>
                <li>Once agreed, we'll send an invoice</li>
                <li>Make payment via:
                  <ul>
                    <li>Bank transfer (preferred)</li>
                    <li>UPI/NEFT/RTGS</li>
                    <li>Cash on delivery (selected shipments only)</li>
                  </ul>
                </li>
                <li>Share payment proof (screenshot/receipt) via chat or email</li>
                <li>We'll confirm payment and mark invoice as paid</li>
              </ol>
            </div>

            <div className={styles.card}>
              <h3>Viewing Invoices</h3>
              <ol className={styles.stepList}>
                <li>Go to <strong>"Documents"</strong> section</li>
                <li>Click <strong>"Invoices"</strong> tab</li>
                <li>Find your invoice by shipment ID or date</li>
                <li>Click <strong>"Download PDF"</strong> to save a copy</li>
              </ol>
            </div>

            <div className={styles.card}>
              <h3>Payment Terms</h3>
              <ul>
                <li><strong>Advance:</strong> 50% before loading (for new clients)</li>
                <li><strong>Balance:</strong> 50% on delivery</li>
                <li><strong>Credit:</strong> Available for regular clients (after review)</li>
                <li><strong>Late Fee:</strong> May apply after 15 days of due date</li>
              </ul>
              <div className={styles.tip}>
                <strong>💡 Tip:</strong> Early payment may qualify for discounts. Contact us to learn more!
              </div>
            </div>
          </section>

          {/* Documents */}
          <section id="documents" className={styles.section}>
            <h2 className={styles.sectionTitle}>📄 Documents</h2>

            <div className={styles.card}>
              <h3>Available Documents</h3>
              <p>You can access the following documents in your dashboard:</p>
              
              <div className={styles.docType}>
                <h4>📋 Invoices</h4>
                <p>Billing statements for your shipments</p>
                <ul>
                  <li>Contains shipment details and charges</li>
                  <li>GST details included</li>
                  <li>Downloadable as PDF</li>
                </ul>
              </div>

              <div className={styles.docType}>
                <h4>🧾 Receipts</h4>
                <p>Payment confirmations</p>
                <ul>
                  <li>Proof of payment received</li>
                  <li>Transaction reference number</li>
                  <li>Date and amount</li>
                </ul>
              </div>

              <div className={styles.docType}>
                <h4>📦 Delivery Proof</h4>
                <p>Confirmation of successful delivery</p>
                <ul>
                  <li>Recipient signature</li>
                  <li>Delivery date and time</li>
                  <li>Photos of delivered goods (if available)</li>
                </ul>
              </div>

              <div className={styles.docType}>
                <h4>📜 Contracts</h4>
                <p>Service agreements (for contract clients)</p>
                <ul>
                  <li>Terms and conditions</li>
                  <li>Validity period</li>
                  <li>Special rates and discounts</li>
                </ul>
              </div>
            </div>

            <div className={styles.card}>
              <h3>Downloading Documents</h3>
              <ol className={styles.stepList}>
                <li>Go to <strong>"Documents"</strong> section on dashboard</li>
                <li>Select document type (Invoice, Receipt, etc.)</li>
                <li>Find the document you need</li>
                <li>Click <strong>"Download"</strong> or <strong>"View"</strong> button</li>
                <li>Save to your device</li>
              </ol>
            </div>

            <div className={styles.card}>
              <h3>Document Retention</h3>
              <p>
                All documents are stored for <strong>3 years</strong> and available for download
                anytime during this period. For older records, please contact support.
              </p>
            </div>
          </section>

          {/* Getting Help */}
          <section id="support" className={styles.section}>
            <h2 className={styles.sectionTitle}>🆘 Getting Help</h2>

            <div className={styles.card}>
              <h3>Live Chat Support</h3>
              <p>Get instant help from our team:</p>
              <ol className={styles.stepList}>
                <li>Click the <strong>💬 Chat</strong> icon at bottom-right of any page</li>
                <li>Type your question or issue</li>
                <li>Our team typically responds within 5-10 minutes</li>
                <li>Chat history is saved for your reference</li>
              </ol>
              <div className={styles.tip}>
                <strong>💡 Chat Hours:</strong> Monday-Saturday, 9 AM - 6 PM IST
              </div>
            </div>

            <div className={styles.card}>
              <h3>Reporting Issues</h3>
              <p>To report problems with a shipment:</p>
              <ol className={styles.stepList}>
                <li>Go to <strong>"Help & Resources"</strong> section</li>
                <li>Click <strong>"Report Issue"</strong></li>
                <li>Select issue type:
                  <ul>
                    <li>Delayed shipment</li>
                    <li>Damaged goods</li>
                    <li>Wrong delivery</li>
                    <li>Billing issue</li>
                    <li>Other</li>
                  </ul>
                </li>
                <li>Describe the problem in detail</li>
                <li>Attach photos if applicable</li>
                <li>Submit the report</li>
                <li>We'll respond within 24 hours</li>
              </ol>
            </div>

            <div className={styles.card}>
              <h3>Contact Methods</h3>
              <div className={styles.contactGrid}>
                <div className={styles.contactItem}>
                  <span className={styles.contactIcon}>📧</span>
                  <h4>Email</h4>
                  <p>support@rajmohantransport.com</p>
                  <small>Response within 24 hours</small>
                </div>
                <div className={styles.contactItem}>
                  <span className={styles.contactIcon}>📞</span>
                  <h4>Phone</h4>
                  <p>+91 XXX-XXX-XXXX</p>
                  <small>Mon-Sat, 9 AM - 6 PM</small>
                </div>
                <div className={styles.contactItem}>
                  <span className={styles.contactIcon}>💬</span>
                  <h4>WhatsApp</h4>
                  <p>+91 XXX-XXX-XXXX</p>
                  <small>Quick support</small>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3>Emergency Contacts</h3>
              <p>For urgent issues during transit (accidents, theft, etc.):</p>
              <ul>
                <li><strong>24/7 Helpline:</strong> +91 XXX-XXX-XXXX</li>
                <li><strong>Driver Direct Line:</strong> Shown in shipment details</li>
              </ul>
              <div className={styles.warning}>
                <strong>⚠️ Emergency Only:</strong> Use this for critical situations requiring
                immediate attention.
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className={styles.section}>
            <h2 className={styles.sectionTitle}>❓ Frequently Asked Questions</h2>

            <div className={styles.faqGrid}>
              <div className={styles.faqItem}>
                <h3>Q: How far in advance should I book?</h3>
                <p>
                  <strong>A:</strong> We recommend booking 2-3 days in advance for best availability.
                  Same-day bookings are possible but subject to truck availability.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Q: Can I cancel or modify a booking?</h3>
                <p>
                  <strong>A:</strong> Yes! Contact us via chat or email. Free cancellation up to
                  24 hours before pickup. Modifications depend on availability.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Q: What if my shipment is delayed?</h3>
                <p>
                  <strong>A:</strong> You'll receive automatic SMS/email notifications. Check the
                  shipment details for updated ETA and reason for delay. Contact support for
                  more information.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Q: How is the cost calculated?</h3>
                <p>
                  <strong>A:</strong> Based on distance, vehicle type, weight, and cargo type.
                  You'll receive a detailed quote before confirmation. No hidden charges!
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Q: Do you provide insurance?</h3>
                <p>
                  <strong>A:</strong> Yes, basic transit insurance is included. Additional coverage
                  available for high-value goods. Contact us for details.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Q: Can I track my shipment in real-time?</h3>
                <p>
                  <strong>A:</strong> Yes! All trucks have GPS tracking. View live location on
                  your dashboard during transit.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Q: What items cannot be transported?</h3>
                <p>
                  <strong>A:</strong> Hazardous materials, illegal items, perishables (without
                  special arrangement), and items exceeding weight limits. Contact us to verify.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Q: Do you provide loading/unloading service?</h3>
                <p>
                  <strong>A:</strong> Yes, available as an additional service. Mention this in
                  the "Notes" field when booking. Charges apply based on requirements.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Q: How do I get a refund?</h3>
                <p>
                  <strong>A:</strong> Refunds processed within 7-10 business days for eligible
                  cancellations. Deductions may apply as per policy. Contact support to initiate.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Q: Can I get bulk/contract rates?</h3>
                <p>
                  <strong>A:</strong> Absolutely! We offer special rates for regular customers
                  and bulk shipments. Contact us to discuss custom contracts.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Q: What payment methods do you accept?</h3>
                <p>
                  <strong>A:</strong> Bank transfer, UPI, NEFT, RTGS, and cash on delivery
                  (selected shipments). Credit terms available for verified clients.
                </p>
              </div>

              <div className={styles.faqItem}>
                <h3>Q: I forgot my password. What should I do?</h3>
                <p>
                  <strong>A:</strong> Click "Forgot Password" on the login page. You'll receive
                  a reset link via email. Follow the instructions to create a new password.
                </p>
              </div>
            </div>
          </section>

          {/* Back to Top */}
          <div className={styles.backToTop}>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              ⬆️ Back to Top
            </button>
          </div>

          {/* Still Need Help */}
          <div className={styles.finalCta}>
            <h3>Still have questions?</h3>
            <p>Our support team is here to help!</p>
            <div className={styles.ctaButtons}>
              <a href="/dashboard/customer" className={styles.ctaButton}>
                📊 Go to Dashboard
              </a>
              <a href="mailto:support@rajmohantransport.com" className={styles.ctaButton}>
                📧 Contact Support
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
