import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fuel, BarChart3, Users, Shield, ChevronRight, Zap,
  TrendingUp, Clock, CheckCircle2, ArrowRight, Menu, X,
  Gauge, Warehouse, CreditCard, FileText
} from 'lucide-react';

/* ───────────────── animation hook ───────────────── */
function useOnScreen(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

function AnimateIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const visible = useOnScreen(ref);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ───────────────── animated counter ───────────────── */
function Counter({ end, suffix = '', duration = 2000 }) {
  const ref = useRef(null);
  const visible = useOnScreen(ref);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const id = setInterval(() => { start += step; if (start >= end) { setCount(end); clearInterval(id); } else setCount(start); }, 16);
    return () => clearInterval(id);
  }, [visible, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ───────────────── data ───────────────── */
const features = [
  { icon: Fuel, title: 'Fuel Inventory', desc: 'Real-time tank levels, auto low-stock alerts and purchase tracking across all fuel types.', color: '#f97316' },
  { icon: BarChart3, title: 'Sales Analytics', desc: 'Daily, weekly & monthly revenue dashboards with trend analysis and export options.', color: '#3b82f6' },
  { icon: Users, title: 'Employee Management', desc: 'Shift scheduling, attendance tracking and role-based access for your entire workforce.', color: '#8b5cf6' },
  { icon: Gauge, title: 'Pump Monitoring', desc: 'Track meter readings, nozzle performance and dispenser health in one unified view.', color: '#10b981' },
  { icon: CreditCard, title: 'Credit & Expenses', desc: 'Manage customer credit accounts, vendor payments and operational expenses seamlessly.', color: '#ec4899' },
  { icon: FileText, title: 'Reports & Reconciliation', desc: 'Automated shift reconciliation, GST-ready reports and one-click Excel exports.', color: '#f59e0b' },
];

const stats = [
  { value: 500, suffix: '+', label: 'Petrol Pumps' },
  { value: 15000, suffix: '+', label: 'Transactions / Day' },
  { value: 99.9, suffix: '%', label: 'Uptime' },
  { value: 24, suffix: '/7', label: 'Support' },
];

/* ───────────────── component ───────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="landing-root">
      {/* ─── NAV ─── */}
      <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.png" alt="FuelFlow" className="nav-logo" />
            <span className="nav-title">Fuel<span className="nav-title-accent">Flow</span></span>
          </div>

          {/* desktop links */}
          <div className="nav-links-desktop">
            <a href="#features">Features</a>
            <a href="#stats">Why Us</a>
            <a href="#cta">Get Started</a>
          </div>

          <div className="nav-actions-desktop">
            <button className="btn-ghost" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-primary-sm" onClick={() => navigate('/login?tab=signup')}>Sign Up Free</button>
          </div>

          {/* mobile toggle */}
          <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* mobile menu */}
        {menuOpen && (
          <div className="nav-mobile">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#stats" onClick={() => setMenuOpen(false)}>Why Us</a>
            <a href="#cta" onClick={() => setMenuOpen(false)}>Get Started</a>
            <button className="btn-ghost" onClick={() => { setMenuOpen(false); navigate('/login'); }}>Login</button>
            <button className="btn-primary-sm" onClick={() => { setMenuOpen(false); navigate('/login?tab=signup'); }}>Sign Up Free</button>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero-section">
        {/* animated bg blobs */}
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />

        <div className="hero-content">
          <AnimateIn>
            <span className="hero-badge">
              <Zap size={14} /> Next-Gen Fuel Station Management
            </span>
          </AnimateIn>

          <AnimateIn delay={0.1}>
            <h1 className="hero-heading">
              Manage Your <span className="hero-gradient-text">Petrol Pump</span> Like Never Before
            </h1>
          </AnimateIn>

          <AnimateIn delay={0.2}>
            <p className="hero-sub">
              FuelFlow streamlines every aspect of your fuel station — from inventory and sales to employees and reconciliation — all in one powerful dashboard.
            </p>
          </AnimateIn>

          <AnimateIn delay={0.3}>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => navigate('/login?tab=signup')}>
                Get Started Free <ArrowRight size={18} />
              </button>
              <button className="btn-outline" onClick={() => navigate('/login')}>
                Login to Dashboard <ChevronRight size={18} />
              </button>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.4}>
            <div className="hero-trust">
              <div className="hero-trust-avatars">
                {['🧑‍💼','👩‍💼','👨‍💼','👩‍💻'].map((e, i) => (
                  <span key={i} className="hero-avatar" style={{ zIndex: 4 - i }}>{e}</span>
                ))}
              </div>
              <p className="hero-trust-text">
                <strong>500+</strong> fuel stations already managing smarter
              </p>
            </div>
          </AnimateIn>
        </div>

        {/* hero illustration — glass dashboard mockup */}
        <AnimateIn className="hero-visual" delay={0.3}>
          <div className="hero-dashboard-card">
            <div className="hd-topbar">
              <div className="hd-dots"><span /><span /><span /></div>
              <span className="hd-title-bar">FuelFlow Dashboard</span>
            </div>
            <div className="hd-body">
              <div className="hd-stat-row">
                <div className="hd-stat"><Fuel size={18} className="hd-icon orange" /><div><small>Petrol</small><strong>12,450 L</strong></div></div>
                <div className="hd-stat"><Fuel size={18} className="hd-icon blue" /><div><small>Diesel</small><strong>18,320 L</strong></div></div>
                <div className="hd-stat"><TrendingUp size={18} className="hd-icon green" /><div><small>Revenue</small><strong>₹4.2L</strong></div></div>
              </div>
              <div className="hd-chart">
                {[40,65,45,80,55,90,70,85,60,75,95,50].map((h, i) => (
                  <div key={i} className="hd-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="features-section">
        <AnimateIn>
          <p className="section-label">Powerful Features</p>
          <h2 className="section-heading">Everything You Need to Run Your Station</h2>
        </AnimateIn>

        <div className="features-grid">
          {features.map((f, i) => (
            <AnimateIn key={i} delay={i * 0.08} className="feature-card">
              <div className="feature-icon-wrap" style={{ background: `${f.color}18`, color: f.color }}>
                <f.icon size={24} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section id="stats" className="stats-section">
        <div className="stats-bg-glow" />
        <AnimateIn>
          <p className="section-label light">Trusted Everywhere</p>
          <h2 className="section-heading light">Built for Scale, Loved by Operators</h2>
        </AnimateIn>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <AnimateIn key={i} delay={i * 0.1} className="stat-card">
              <span className="stat-value"><Counter end={s.value} suffix={s.suffix} /></span>
              <span className="stat-label">{s.label}</span>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="how-section">
        <AnimateIn>
          <p className="section-label">How It Works</p>
          <h2 className="section-heading">Up and Running in Minutes</h2>
        </AnimateIn>
        <div className="how-grid">
          {[
            { step: '01', title: 'Sign Up', desc: 'Create your account and register your petrol pump in under 2 minutes.', icon: Shield },
            { step: '02', title: 'Configure', desc: 'Add tanks, pumps, employees and set up your fuel pricing.', icon: Warehouse },
            { step: '03', title: 'Go Live', desc: 'Start recording sales, tracking inventory and generating reports instantly.', icon: Clock },
          ].map((item, i) => (
            <AnimateIn key={i} delay={i * 0.12} className="how-card">
              <div className="how-step">{item.step}</div>
              <item.icon size={28} className="how-icon" />
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="cta" className="cta-section">
        <AnimateIn className="cta-card">
          <h2>Ready to Modernize Your Fuel Station?</h2>
          <p>Join hundreds of petrol pump owners who switched to FuelFlow and never looked back.</p>
          <div className="cta-buttons">
            <button className="btn-primary" onClick={() => navigate('/login?tab=signup')}>
              Create Free Account <ArrowRight size={18} />
            </button>
            <button className="btn-outline-light" onClick={() => navigate('/login')}>
              Login Instead
            </button>
          </div>
          <div className="cta-checks">
            {['No credit card required', 'Free forever plan', 'Setup in 2 minutes'].map((t, i) => (
              <span key={i}><CheckCircle2 size={16} /> {t}</span>
            ))}
          </div>
        </AnimateIn>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo.png" alt="FuelFlow" className="footer-logo" />
            <span>Fuel<span className="nav-title-accent">Flow</span></span>
          </div>
          <p className="footer-copy">© {new Date().getFullYear()} FuelFlow. All rights reserved.</p>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#stats">About</a>
            <a href="#cta">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
