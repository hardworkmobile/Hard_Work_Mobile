import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import './ServiceLandingPage.css';
import servicesBg from './images/services-hero.jpg';

const SERVICE_LABELS = {
  diagnostics: 'Vehicle Diagnostics / Check Engine Light',
  brakes: 'Brake Repair',
  'engine-repair': 'Engine Repair',
  maintenance: 'Scheduled Maintenance',
  suspension: 'Suspension Repair',
  electrical: 'Electrical Repair',
};

const URGENCY_OPTIONS = [
  'As soon as possible',
  'Within 1 week',
  'Within 2 weeks',
  'Within a month',
  'Flexible / No rush',
];

const VEHICLE_MAKES = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick',
  'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'FIAT', 'Ford',
  'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia',
  'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Maserati', 'Mazda',
  'Mercedes-Benz', 'MINI', 'Mitsubishi', 'Nissan', 'Pontiac', 'Porsche',
  'RAM', 'Rolls-Royce', 'Saturn', 'Scion', 'Subaru', 'Tesla', 'Toyota',
  'Volkswagen', 'Volvo',
];

function ServiceContactForm({ serviceSlug }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear + 2 - 1985 }, (_, i) => currentYear + 1 - i);

  const [formData, setFormData] = useState({
    year: '',
    make: '',
    model: '',
    serviceType: SERVICE_LABELS[serviceSlug] || '',
    urgency: '',
    name: '',
    phone: '',
    email: '',
  });
  const [status, setStatus] = useState({ submitted: false, message: '', error: false });
  const [submitting, setSubmitting] = useState(false);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    if (!formData.make) {
      setModels([]);
      return;
    }
    setModelsLoading(true);
    fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(formData.make)}?format=json`
    )
      .then((r) => r.json())
      .then((data) => setModels(data.Results.map((m) => m.Model_Name).sort()))
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false));
  }, [formData.make]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Reset model when make changes
    if (name === 'make') {
      setFormData((prev) => ({ ...prev, make: value, model: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post('/api/service-request', formData);
      setStatus({ submitted: true, message: res.data.msg, error: false });
      setFormData({ year: '', make: '', model: '', serviceType: SERVICE_LABELS[serviceSlug] || '', urgency: '', name: '', phone: '', email: '' });
    } catch (err) {
      setStatus({ submitted: true, message: err.response?.data?.msg || 'Something went wrong. Please try again.', error: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="slp-form-bg">
      <div className="slp-form-inner">
        <h2 className="slp-section-title">Request Service</h2>
        <p className="slp-section-subtitle">
          Fill out the form below and we'll get back to you with a quote and next steps.
        </p>
        <form className="slp-form" onSubmit={handleSubmit}>
          {/* Vehicle info row */}
          <div className="slp-form-row">
            <div className="slp-form-group">
              <label htmlFor="slp-year">Year *</label>
              <select id="slp-year" name="year" value={formData.year} onChange={handleChange} required>
                <option value="" disabled>Select year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="slp-form-group">
              <label htmlFor="slp-make">Make *</label>
              <select id="slp-make" name="make" value={formData.make} onChange={handleChange} required>
                <option value="" disabled>Select make</option>
                {VEHICLE_MAKES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="slp-form-group">
              <label htmlFor="slp-model">Model *</label>
              <select
                id="slp-model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                disabled={!formData.make || modelsLoading}
              >
                <option value="" disabled>
                  {!formData.make ? 'Select make first' : modelsLoading ? 'Loading...' : 'Select model'}
                </option>
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Service type + urgency */}
          <div className="slp-form-row-2">
            <div className="slp-form-group">
              <label htmlFor="slp-serviceType">Service Type *</label>
              <select id="slp-serviceType" name="serviceType" value={formData.serviceType} onChange={handleChange} required>
                <option value="" disabled>Select a service</option>
                {Object.values(SERVICE_LABELS).map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </div>
            <div className="slp-form-group">
              <label htmlFor="slp-urgency">How Soon Do You Need Service? *</label>
              <select id="slp-urgency" name="urgency" value={formData.urgency} onChange={handleChange} required>
                <option value="" disabled>Select timeframe</option>
                {URGENCY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact info */}
          <div className="slp-form-row">
            <div className="slp-form-group">
              <label htmlFor="slp-name">Your Name *</label>
              <input id="slp-name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full name" required />
            </div>
            <div className="slp-form-group">
              <label htmlFor="slp-phone">Phone Number *</label>
              <input id="slp-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 555-5555" required />
            </div>
            <div className="slp-form-group">
              <label htmlFor="slp-email">Email Address *</label>
              <input id="slp-email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
          </div>

          {status.submitted && (
            <div className={status.error ? 'slp-form-error' : 'slp-form-success'}>
              {status.message}
            </div>
          )}

          <button type="submit" className="slp-form-submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Page data ──────────────────────────────────────────────────────────────────
const SERVICE_DATA = {
  diagnostics: {
    eyebrow: 'Mobile Vehicle Diagnostics',
    headline: ['Check Engine Light On? ', 'We Come to You.'],
    subheadline:
      'Don\'t guess — get a proper diagnostic at your home or office. We read your fault codes, explain exactly what\'s wrong, and give you honest, upfront pricing before any repair begins.',
    services: [
      {
        icon: 'fa-solid fa-microchip',
        title: 'OBD-II Fault Code Scan',
        desc: 'Full computer scan to read every stored and pending code across all vehicle systems.',
      },
      {
        icon: 'fa-solid fa-triangle-exclamation',
        title: 'Warning Light Diagnosis',
        desc: 'Check engine, ABS, airbag, TPMS, and other dashboard warning lights identified and explained.',
      },
      {
        icon: 'fa-solid fa-bolt',
        title: 'Electrical Fault Diagnosis',
        desc: 'Pinpoint the root cause of electrical gremlins using professional-grade diagnostic tools.',
      },
      {
        icon: 'fa-solid fa-magnifying-glass',
        title: 'Pre-Purchase Inspection',
        desc: 'Buying a used car? Have us inspect it at the seller\'s location before you commit.',
      },
      {
        icon: 'fa-solid fa-temperature-high',
        title: 'Overheating & Cooling System',
        desc: 'Diagnose overheating causes — thermostat, water pump, head gasket, and beyond.',
      },
      {
        icon: 'fa-solid fa-gauge-high',
        title: 'Performance & Drivability',
        desc: 'Misfires, rough idle, hesitation — we track down the cause and lay out your options.',
      },
    ],
    cta: { book: '/services', contact: '/contact' },
  },

  brakes: {
    eyebrow: 'Mobile Brake Repair',
    headline: ['Brake Problems? ', 'Fixed On-Site.'],
    subheadline:
      'Squealing, grinding, or a soft pedal? Don\'t risk it. Our mobile mechanic comes to your home or workplace and handles your full brake service right there — no tow, no shop wait.',
    services: [
      {
        icon: 'fa-solid fa-circle-dot',
        title: 'Brake Pad Replacement',
        desc: 'Quality pads installed on all four corners. We carry a range of pad grades to fit your needs and budget.',
      },
      {
        icon: 'fa-solid fa-compact-disc',
        title: 'Rotor Replacement',
        desc: 'Warped or worn rotors replaced for smooth, vibration-free braking.',
      },
      {
        icon: 'fa-solid fa-grip-lines',
        title: 'Caliper Service & Replacement',
        desc: 'Sticking or seized calipers diagnosed and replaced to restore even braking pressure.',
      },
      {
        icon: 'fa-solid fa-droplet',
        title: 'Brake Fluid Flush',
        desc: 'Old, moisture-contaminated fluid replaced to restore proper pedal feel and protect the system.',
      },
      {
        icon: 'fa-solid fa-ruler',
        title: 'Brake Line Inspection',
        desc: 'Visual inspection of all brake lines and hoses for leaks, rust, or damage.',
      },
      {
        icon: 'fa-solid fa-magnifying-glass',
        title: 'Full Brake Inspection',
        desc: 'Not sure what\'s wrong? We inspect the entire brake system and give you a straight answer.',
      },
    ],
    cta: { book: '/services', contact: '/contact' },
  },

  'engine-repair': {
    eyebrow: 'Mobile Engine Repair',
    headline: ['Engine Trouble? ', 'We Fix It at Your Location.'],
    subheadline:
      'Most engine repairs don\'t need a full shop — they need the right tools and a knowledgeable mechanic. We bring both to your driveway at a fair $80/hr labor rate.',
    services: [
      {
        icon: 'fa-solid fa-fire-flame-curved',
        title: 'Misfire Diagnosis & Repair',
        desc: 'Rough running, shaking, or check engine flashing? We pinpoint and fix the cylinder causing trouble.',
      },
      {
        icon: 'fa-solid fa-droplet',
        title: 'Head Gasket Repair',
        desc: 'Coolant loss, white smoke, or milky oil? We diagnose and repair blown head gaskets on-site.',
      },
      {
        icon: 'fa-solid fa-gear',
        title: 'Timing Belt & Chain Service',
        desc: 'Prevent catastrophic engine damage with timely timing belt or chain replacement.',
      },
      {
        icon: 'fa-solid fa-oil-can',
        title: 'Valve Cover Gasket',
        desc: 'Oil leaking from the top of your engine? Valve cover gaskets replaced quickly on-site.',
      },
      {
        icon: 'fa-solid fa-temperature-arrow-up',
        title: 'Cooling System Repair',
        desc: 'Thermostat, water pump, radiator hoses, and coolant flushes — all handled at your location.',
      },
      {
        icon: 'fa-solid fa-plug',
        title: 'Spark Plugs & Ignition',
        desc: 'Worn plugs, bad coils, or faulty wires — full ignition system service for peak performance.',
      },
    ],
    cta: { book: '/services', contact: '/contact' },
  },

  maintenance: {
    eyebrow: 'Scheduled Maintenance',
    headline: ['Keep Your Car Running Right ', 'Without Leaving Home.'],
    subheadline:
      'Stay on your manufacturer\'s maintenance schedule without the wait room. We come to your home or office and handle your routine service right there — no appointment hassle, no shop markup.',
    services: [
      {
        icon: 'fa-solid fa-plug',
        title: 'Tune-Up & Spark Plugs',
        desc: 'Fresh spark plugs, new ignition components, and a full tune-up to restore performance and fuel economy.',
      },
      {
        icon: 'fa-solid fa-wind',
        title: 'Air & Cabin Filter Replacement',
        desc: 'Engine air filter and cabin air filter inspected and replaced to keep air clean inside and out.',
      },
      {
        icon: 'fa-solid fa-droplet',
        title: 'Coolant Flush',
        desc: 'Old coolant drained and refilled to protect your engine from overheating and corrosion.',
      },
      {
        icon: 'fa-solid fa-car-burst',
        title: 'Brake Fluid Service',
        desc: 'Moisture-laden brake fluid replaced to maintain pedal feel and protect your braking system.',
      },
      {
        icon: 'fa-solid fa-battery-full',
        title: 'Battery Inspection & Replacement',
        desc: 'Battery tested and replaced if needed — before it leaves you stranded.',
      },
      {
        icon: 'fa-solid fa-road',
        title: 'Belts & Hoses Inspection',
        desc: 'Serpentine belt, drive belts, and coolant hoses inspected and replaced to prevent breakdowns.',
      },
    ],
    cta: { book: '/services', contact: '/contact' },
  },

  suspension: {
    eyebrow: 'Mobile Suspension Repair',
    headline: ['Rough Ride or Clunking? ', 'We Fix It On-Site.'],
    subheadline:
      'Suspension problems get worse fast and affect your safety, tire wear, and handling. Our mobile mechanic diagnoses and repairs suspension components at your location across Southeast PA.',
    services: [
      {
        icon: 'fa-solid fa-car-side',
        title: 'Strut & Shock Replacement',
        desc: 'Worn struts and shocks replaced to restore ride quality, handling, and safety.',
      },
      {
        icon: 'fa-solid fa-circle-nodes',
        title: 'Ball Joint Replacement',
        desc: 'Clunking or wandering steering? Ball joints inspected and replaced before they fail completely.',
      },
      {
        icon: 'fa-solid fa-arrows-left-right',
        title: 'Tie Rod Replacement',
        desc: 'Inner and outer tie rod ends replaced to restore steering precision and eliminate play.',
      },
      {
        icon: 'fa-solid fa-arrows-to-dot',
        title: 'Control Arm Replacement',
        desc: 'Upper and lower control arms and bushings replaced to correct handling and alignment.',
      },
      {
        icon: 'fa-solid fa-link',
        title: 'Sway Bar Links & Bushings',
        desc: 'Clunking over bumps or in turns? Sway bar links and bushings replaced quickly on-site.',
      },
      {
        icon: 'fa-solid fa-circle',
        title: 'Wheel Bearing Replacement',
        desc: 'Humming or grinding at speed? Wheel bearings diagnosed and replaced before they cause damage.',
      },
    ],
    cta: { book: '/services', contact: '/contact' },
  },

  electrical: {
    eyebrow: 'Mobile Auto Electrical Repair',
    headline: ['Electrical Problems? ', 'We Diagnose & Fix On-Site.'],
    subheadline:
      'From a dead battery to complex wiring faults, our mobile mechanic brings professional electrical diagnostic tools directly to you — no tow truck required.',
    services: [
      {
        icon: 'fa-solid fa-battery-full',
        title: 'Battery Re