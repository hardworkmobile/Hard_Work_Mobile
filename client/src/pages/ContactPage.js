import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ContactPage.css';
import heroBg from './images/services-hero.jpg';

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState({ submitted: false, message: '', error: false });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post('/api/contact', formData);
      setStatus({ submitted: true, message: res.data.msg, error: false });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setStatus({
        submitted: true,
        message: err.response?.data?.msg || 'Something went wrong. Please try again.',
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>

      {/* ── Hero ── */}
      <section className="cp-hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="cp-hero-content">
          <span className="cp-eyebrow">Mobile Mechanic — SE Pennsylvania</span>
          <h1>Questions? <span>We're Here to Help.</span></h1>
          <p>
            Whether you need a quote, want to know if we cover your area, or just
            have a question about your vehicle — reach out and we'll get back to you promptly.
          </p>
          <div className="cp-hero-ctas">
            <a href="tel:4845933875" className="cp-btn-primary">
              <i className="fa-solid fa-phone" style={{ marginRight: 8 }}></i>
              (484) 593-3875
            </a>
            <a href="#cp-form" className="cp-btn-outline">
              Send a Message
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div className="cp-trust-bar">
        <span className="cp-trust-item">
          <i className="fa-solid fa-car"></i> We Come to You
        </span>
        <span className="cp-trust-item">
          <i className="fa-solid fa-dollar-sign"></i> $80/hr Labor
        </span>
        <span className="cp-trust-item">
          <i className="fa-solid fa-file-invoice-dollar"></i> Upfront Pricing
        </span>
        <span className="cp-trust-item">
          <i className="fa-solid fa-map-location-dot"></i> Chester, Delaware & Montgomery Co.
        </span>
      </div>

      {/* ── Contact info cards ── */}
      <div style={{ background: 'var(--background-color)' }}>
        <div className="cp-section">
          <h2 className="cp-section-title">Reach Us Directly</h2>
          <p className="cp-section-subtitle">Prefer a direct line? Here's how to get hold of us.</p>
          <div className="cp-info-grid">
            <div className="cp-info-card">
              <i className="fa-solid fa-phone cp-info-icon"></i>
              <h3>Phone</h3>
              <p>(484) 593-3875</p>
              <a href="tel:4845933875" className="cp-info-link">Call Now</a>
            </div>
            <div className="cp-info-card">
              <i className="fa-solid fa-envelope cp-info-icon"></i>
              <h3>Email</h3>
              <p>JamesFerzanden@hardworkmobile.com</p>
              <a href="mailto:JamesFerzanden@hardworkmobile.com" className="cp-info-link">Send Email</a>
            </div>
            <div className="cp-info-card">
              <i className="fa-solid fa-clock cp-info-icon"></i>
              <h3>Hours</h3>
              <p>Monday – Friday</p>
              <p>10:00 AM – 6:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── What to expect ── */}
      <div className="cp-why-bg">
        <div className="cp-why-inner">
          <h2 className="cp-section-title cp-section-title--light">What to Expect</h2>
          <p className="cp-section-subtitle cp-section-subtitle--light">
            We make the process simple and stress-free from the first message.
          </p>
          <div className="cp-why-grid">
            <div className="cp-why-card">
              <i className="fa-solid fa-bolt"></i>
              <h3>Fast Response</h3>
              <p>We typically reply within a few hours during business hours — often sooner.</p>
            </div>
            <div className="cp-why-card">
              <i className="fa-solid fa-file-invoice-dollar"></i>
              <h3>Free Quotes</h3>
              <p>Ask about any service and we'll give you a straight, no-obligation quote upfront.</p>
            </div>
            <div className="cp-why-card">
              <i className="fa-solid fa-handshake"></i>
              <h3>No Pressure</h3>
              <p>Honest advice and straight answers — no upselling, no pressure, no runaround.</p>
            </div>
            <div className="cp-why-card">
              <i className="fa-solid fa-map-location-dot"></i>
              <h3>We Come to You</h3>
              <p>Serving Chester, Delaware & Montgomery Counties. We'll confirm your area when you reach out.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Service Area ── */}
      <div className="cp-area-bg">
        <div className="cp-area-inner">
          <h2 className="cp-section-title">Service Area</h2>
          <p className="cp-section-subtitle">Proudly serving Southeast Pennsylvania.</p>
          <div className="cp-county-list">
            <span className="cp-county-badge">Chester County, PA</span>
            <span className="cp-county-badge">Delaware County, PA</span>
            <span className="cp-county-badge">Montgomery County, PA</span>
          </div>
          <p className="cp-area-note">
            Not sure if we cover your area?{' '}
            <a href="tel:4845933875" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
              Give us a call
            </a>{' '}
            and we'll let you know right away.
          </p>
        </div>
      </div>

      {/* ── Contact Form ── */}
      <div id="cp-form" className="cp-form-bg">
        <div className="cp-form-inner">
          <h2 className="cp-section-title">Send Us a Message</h2>
          <p className="cp-section-subtitle">
            Fill out the form below and we'll get back to you as soon as possible.
          </p>
          <form className="cp-form" onSubmit={handleSubmit}>
            <div className="cp-form-row">
              <div className="cp-form-group">
                <label htmlFor="cp-name">Your Name *</label>
                <input
                  id="cp-name" type="text" name="name"
                  value={formData.name} onChange={handleChange}
                  placeholder="Full name" required
                />
              </div>
              <div className="cp-form-group">
                <label htmlFor="cp-email">Email Address *</label>
                <input
                  id="cp-email" type="email" name="email"
                  value={formData.email} onChange={handleChange}
                  placeholder="you@example.com" required
                />
              </div>
            </div>
            <div className="cp-form-row">
              <div className="cp-form-group">
                <label htmlFor="cp-phone">Phone Number</label>
                <input
                  id="cp-phone" type="tel" name="phone"
                  value={formData.phone} onChange={handleChange}
                  placeholder="(555) 555-5555"
                />
              </div>
              <div className="cp-form-group">
                <label htmlFor="cp-subject">Subject *</label>
                <input
                  id="cp-subject" type="text" name="subject"
                  value={formData.subject} onChange={handleChange}
                  placeholder="What can we help you with?" required
                />
              </div>
            </div>
            <div className="cp-form-group">
              <label htmlFor="cp-message">Message *</label>
              <textarea
                id="cp-message" name="message"
                value={formData.message} onChange={handleChange}
                placeholder="Tell us about your vehicle, issue, or question…"
                rows={5} required
              />
            </div>

            {status.submitted && (
              <div className={status.error ? 'cp-form-error' : 'cp-form-success'}>
                {status.message}
              </div>
            )}

            <button type="submit" className="cp-form-submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="cp-cta-bg">
        <h2>Ready to Schedule Service?</h2>
        <p>Skip the form and book directly — we'll come to you.</p>
        <div className="cp-cta-actions">
          <Link to="/services" className="cp-btn-dark">Browse Services &amp; Book</Link>
          <a href="tel:4845933875" className="cp-btn-dark-outline">
            <i className="fa-solid fa-phone" style={{ marginRight: 8 }}></i>
            (484) 593-3875
          </a>
        </div>
      </div>

    </div>
  );
}

export default ContactPage;
