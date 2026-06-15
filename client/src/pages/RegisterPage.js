// client/src/pages/RegisterPage.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegisterPage.css';

const REGISTER_FEATURES = [
  { icon: 'fa-solid fa-calendar-check',  label: 'Book services online, anytime' },
  { icon: 'fa-solid fa-truck-fast',       label: 'We come to your location' },
  { icon: 'fa-solid fa-clipboard-list',   label: 'Track your service history' },
];

function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim())  newErrors.lastName  = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const { confirmPassword, ...submitData } = formData;
      await axios.post('/api/users/register', submitData);
      setSuccess('Registration successful! Please check your email for verification.');
      setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.msg || 'An error occurred during registration.';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rp-page">

      {/* Left panel — branding */}
      <div className="rp-panel rp-panel--brand">
        <div className="rp-brand-inner">
          <span className="rp-eyebrow">
            <i className="fa-solid fa-wrench"></i>&nbsp; Hard Work Mobile
          </span>
          <h1 className="rp-brand-title">Create Your Account</h1>
          <p className="rp-brand-sub">
            Join Hard Work Mobile and get professional on-site auto repair booked in minutes.
          </p>

          <ul className="rp-features">
            {REGISTER_FEATURES.map(f => (
              <li key={f.label} className="rp-feature">
                <span className="rp-feature-icon">
                  <i className={f.icon}></i>
                </span>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>

          <div className="rp-switch-prompt">
            <span>Already have an account?</span>
            <Link to="/login" className="rp-switch-link">Sign in &rarr;</Link>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="rp-panel rp-panel--form">
        <div className="rp-form-card">

          <div className="rp-form-header">
            <h2>Get Started</h2>
            <p>Fill in your details to create your account.</p>
          </div>

          {success && (
            <div className="rp-alert rp-alert--success">
              <i className="fa-solid fa-circle-check"></i>
              {success}
            </div>
          )}

          {errors.general && (
            <div className="rp-alert rp-alert--error">
              <i className="fa-solid fa-triangle-exclamation"></i>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="rp-form">
            <div className="rp-input-row">
              <div className="rp-input-group">
                <label htmlFor="rp-firstName">First Name</label>
                <input
                  id="rp-firstName"
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={errors.firstName ? 'rp-input--error' : ''}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <span className="rp-field-error">
                    <i className="fa-solid fa-circle-exclamation"></i> {errors.firstName}
                  </span>
                )}
              </div>

              <div className="rp-input-group">
                <label htmlFor="rp-lastName">Last Name</label>
                <input
                  id="rp-lastName"
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? 'rp-input--error' : ''}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <span className="rp-field-error">
                    <i className="fa-solid fa-circle-exclamation"></i> {errors.lastName}
                  </span>
                )}
              </div>
            </div>

            <div className="rp-input-group">
              <label htmlFor="rp-email">Email Address</label>
              <input
                id="rp-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'rp-input--error' : ''}
                disabled={isLoading}
              />
              {errors.email && (
                <span className="rp-field-error">
                  <i className="fa-solid fa-circle-exclamation"></i> {errors.email}
                </span>
              )}
            </div>

            <div className="rp-input-group">
              <label htmlFor="rp-password">Password</label>
              <input
                id="rp-password"
                type="password"
                name="password"
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'rp-input--error' : ''}
                disabled={isLoading}
              />
              {errors.password && (
                <span className="rp-field-error">
                  <i className="fa-solid fa-circle-exclamation"></i> {errors.password}
                </span>
              )}
            </div>

            <div className="rp-input-group">
              <label htmlFor="rp-confirmPassword">Confirm Password</label>
              <input
                id="rp-confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'rp-input--error' : ''}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <span className="rp-field-error">
                  <i className="fa-solid fa-circle-exclamation"></i> {errors.confirmPassword}
                </span>
              )}
            </div>

            <button
              type="submit"
              className={`rp-submit${isLoading ? ' rp-submit--loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-user-plus"></i>
                  Create Account
                </>
              )}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}

export default RegisterPage;
