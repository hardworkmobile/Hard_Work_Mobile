// client/src/components/Login.js

import React, { useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const location = useLocation();
  const from = location.state?.from;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/users/login', formData);
      onLoginSuccess(res.data.token, from);
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred during login.');
    }
  };

  return (
    <div>
      <h2>Sign In</h2>
      <p className="lp-form-subtitle">Welcome back — enter your details below.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="username"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />
        <button type="submit">Sign In</button>
      </form>
      {error && (
        <div className="lp-error">
          <i className="fa-solid fa-triangle-exclamation"></i>
          {error}
        </div>
      )}
    </div>
  );
}

export default Login;
