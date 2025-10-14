"use client";
import React, { useState } from 'react';

export default function HelpSupport({ user }: { user: any }) {
  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Implement actual support ticket creation
    console.log('Support request:', supportForm);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSupportForm({ subject: '', message: '', priority: 'normal' });
    }, 3000);
  }

  const faqs = [
    {
      question: 'How do I book a truck?',
      answer: 'Go to your dashboard and click "Book Truck". Fill in your shipment details including source, destination, vehicle type, material, and weight. Submit your request and wait for admin approval.',
    },
    {
      question: 'How can I track my shipment?',
      answer: 'Once your booking is approved, you can track your shipment in real-time from your dashboard. Click on the shipment to see live location, status updates, and ETA.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept bank transfers, UPI payments, and credit/debit cards. Payment details will be provided in your booking confirmation email.',
    },
    {
      question: 'How is the price calculated?',
      answer: 'Pricing is based on distance, vehicle type, material weight, and additional charges like GST, tolls, and loading fees. You can see a detailed breakdown when booking.',
    },
    {
      question: 'Can I cancel or modify a booking?',
      answer: 'Contact support immediately if you need to modify or cancel a booking. Cancellation policies depend on the booking status and timing.',
    },
  ];

  const resources = [
    { icon: '📖', title: 'User Guide', description: 'Complete documentation', link: '/docs/user-guide' },
    { icon: '🎥', title: 'Video Tutorials', description: 'Step-by-step walkthroughs', link: '/docs/tutorials' },
    { icon: '❓', title: 'FAQs', description: 'Common questions answered', link: '#faqs' },
    { icon: '📧', title: 'Email Support', description: 'support@rts.com', link: 'mailto:support@rts.com' },
  ];

  return (
    <div className="settings-section">
      <div className="section-header">
        <h2 className="section-title">💬 Help & Support</h2>
        <p className="section-description">
          Get assistance and learn more about using the platform
        </p>
      </div>

      <div className="settings-grid">
        {/* Quick Resources */}
        <div className="settings-card">
          <h3 className="card-title">📚 Quick Resources</h3>
          <p className="card-description">
            Access documentation and learning materials
          </p>

          <div className="resource-grid">
            {resources.map((resource, index) => (
              <a
                key={index}
                href={resource.link}
                className="resource-card"
                target={resource.link.startsWith('http') ? '_blank' : undefined}
                rel={resource.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                <div className="resource-icon">{resource.icon}</div>
                <div className="resource-content">
                  <div className="resource-title">{resource.title}</div>
                  <div className="resource-description">{resource.description}</div>
                </div>
                <div className="resource-arrow">→</div>
              </a>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="settings-card">
          <h3 className="card-title">📧 Contact Support</h3>
          <p className="card-description">
            Send us a message and we'll get back to you soon
          </p>

          {submitted ? (
            <div className="alert alert-success">
              <span className="alert-icon">✓</span>
              <div>
                <strong>Message sent!</strong>
                <p>We'll respond to your request within 24 hours.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="support-form">
              <div className="form-group">
                <label className="form-label">
                  Subject
                  <span className="label-required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Priority
                </label>
                <select
                  className="form-select"
                  value={supportForm.priority}
                  onChange={(e) => setSupportForm({ ...supportForm, priority: e.target.value })}
                >
                  <option value="low">Low - General inquiry</option>
                  <option value="normal">Normal - Standard support</option>
                  <option value="high">High - Urgent issue</option>
                  <option value="critical">Critical - System down</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Message
                  <span className="label-required">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                  placeholder="Describe your issue or question in detail..."
                  rows={6}
                  required
                />
              </div>

              <button type="submit" className="btn-primary">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>

      {/* FAQs */}
      <div className="settings-card mt-20" id="faqs">
        <h3 className="card-title">❓ Frequently Asked Questions</h3>
        <p className="card-description">
          Find answers to common questions
        </p>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details key={index} className="faq-item">
              <summary className="faq-question">
                <span className="faq-icon">Q</span>
                {faq.question}
                <span className="faq-toggle">▼</span>
              </summary>
              <div className="faq-answer">
                <span className="faq-icon answer-icon">A</span>
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="settings-card mt-20">
        <h3 className="card-title">📞 Other Ways to Reach Us</h3>
        
        <div className="contact-grid">
          <div className="contact-item">
            <div className="contact-icon">📧</div>
            <div className="contact-content">
              <div className="contact-label">Email</div>
              <a href="mailto:support@rts.com" className="contact-value">support@rts.com</a>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">📱</div>
            <div className="contact-content">
              <div className="contact-label">Phone</div>
              <a href="tel:+911234567890" className="contact-value">+91 123 456 7890</a>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">⏰</div>
            <div className="contact-content">
              <div className="contact-label">Business Hours</div>
              <div className="contact-value">Mon-Sat: 9 AM - 6 PM IST</div>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">🌐</div>
            <div className="contact-content">
              <div className="contact-label">Website</div>
              <a href="https://rts.com" className="contact-value" target="_blank" rel="noopener noreferrer">
                www.rts.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="settings-card mt-20">
        <h3 className="card-title">ℹ️ System Information</h3>
        
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Account Email:</span>
            <span className="info-value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Account ID:</span>
            <span className="info-value">{user.id.slice(0, 8)}...</span>
          </div>
          <div className="info-item">
            <span className="info-label">Version:</span>
            <span className="info-value">1.0.0</span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Login:</span>
            <span className="info-value">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
