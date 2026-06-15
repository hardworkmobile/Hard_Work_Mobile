import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import TestimonialCard from '../components/TestimonialCard';
import GoogleReviews from '../components/GoogleReviews';
import './TestimonialsPage.css';
import heroBg from './images/services-hero.jpg';

function TestimonialsPage({ user }) {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await axios.get('/api/testimonials');
        setTestimonials(response.data);
      } catch (err) {
        setError('Could not fetch testimonials at this time.');
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <div>

      {/* ── Hero ── */}
      <section className="tp-hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="tp-hero-content">
          <span className="tp-eyebrow">Customer Reviews</span>
          <h1>What Our <span>Customers Say</span></h1>
          <p>
            Real reviews from real drivers across Chester, Delaware &amp; Montgomery Counties —
            see why neighbors trust Hard Work Mobile for on-site auto repair.
          </p>
          <div className="tp-hero-stars">
            {[0,1,2,3,4].map(i => <span key={i}><i className="fa-solid fa-star"></i></span>)}
          </div>
        </div>
      </section>

      {