import React, { useState, useEffect, useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "../style/Home.css";
import service1 from "../assets/images/service1.jpg";
import service2 from "../assets/images/service2.jpg";
import service3 from "../assets/images/service3.jpg";
import service4 from "../assets/images/service4.jpg";
import service5 from "../assets/images/service5.jpg";
import service6 from "../assets/images/service6.jpg";
import bg from "../assets/images/bg.jpg";
import logo_img from "../assets/images/logo.png";
// import service2 from "../assets/images/service2.jpg";
// import banner2 from "../assets/images/banner2.jpg";
import { Link } from "react-router-dom";
import {
  FiMenu, FiX, FiPhone, FiMail, FiMapPin, FiClock,
  FiChevronLeft, FiChevronRight,
} from "react-icons/fi";
import {
  FaOilCan, FaWrench, FaCar, FaTachometerAlt,
  FaBatteryFull, FaSnowflake, FaShieldAlt, FaStar,
} from "react-icons/fa";

const SLIDES = [
  {
    image: service2,
    heading: "Your Trusted Auto Care Partner",
    sub: "Expert repairs & servicing for all makes and models in Surat",
    cta: "Book a Service",
  },
  {
    image: service5,
    heading: "Quality Parts. Skilled Hands.",
    sub: "We keep your vehicle running smoothly — on time, every time",
    cta: "View Services",
  },
  {
  image: bg,
    heading: "Reliable Service. Lasting Performance.",
    sub: "Professional maintenance and repairs to keep your vehicle at its best.",
    cta: "Schedule Now",
  },
];

const SERVICES = [
  // Row 1
  {
    icon: <FaOilCan />,
    type: "text",
    title: "Oil & Fluid Change",
    desc: "Full synthetic, semi-synthetic & mineral oil changes with quality filters.",
  },
  {
    type: "image",
    image: service1,
  },
  {
    icon: <FaWrench />,
    type: "text",
    title: "Engine Repair",
    desc: "Comprehensive engine diagnostics, overhaul, and precision repair by certified technicians.",
  },
  {
    type: "image",
    image: service2,
  },

  // Row 2
  {
    type: "image",
    image: service3,
  },
  {
    icon: <FaCar />,
    type: "text",
    title: "Brake Service",
    desc: "Brake pad replacement, disc resurfacing, and full brake system inspection.",
  },
  {
    type: "image",
    image: service4,
  },
  {
    icon: <FaTachometerAlt />,
    type: "text",
    title: "Wheel Alignment & Balancing",
    desc: "Laser-guided alignment and dynamic balancing for a smooth, safe drive.",
  },

  // Row 3
  {
    icon: <FaBatteryFull />,
    type: "text",
    title: "Battery Service",
    desc: "Battery testing, replacement, and alternator/starter system checks.",
  },
  {
    type: "image",
    image: service5,
  },
  {
    icon: <FaSnowflake />,
    type: "text",
    title: "AC Service & Repair",
    desc: "Gas recharge, compressor repair, and complete AC system diagnostics.",
  },
  {
    type: "image",
    image: service6,
  },
];

const WHY_US = [
  { icon: <FaShieldAlt />, title: "Certified Technicians", desc: "Highly trained mechanics with years of hands-on experience." },
  { icon: <FaStar />, title: "Genuine Parts", desc: "We use only original and OEM-grade parts for every repair." },
  { icon: <FiClock />, title: "On-Time Delivery", desc: "Your vehicle is ready when promised — no unnecessary delays." },
  { icon: <FaCar />, title: "All Makes & Models", desc: "Cars, SUVs, hatchbacks — we handle them all under one roof." },
];

const Home = () => {
  const [current, setCurrent] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home-section");
  const timerRef = useRef(null);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % SLIDES.length);
    }, 5500);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
  AOS.init({
    duration: 1000,
    once: true,
  });
}, []);

  const prevSlide = () => { setCurrent((p) => (p - 1 + SLIDES.length) % SLIDES.length); startTimer(); };
  const nextSlide = () => { setCurrent((p) => (p + 1) % SLIDES.length); startTimer(); };

  const scrollTo = (id) => {
  setActiveSection(id);
  setMenuOpen(false);

  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};
  const year = new Date().getFullYear();

  return (
    <div className="lp-root">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
<nav
  className={`lp-nav ${
    scrolled ? "lp-nav--scrolled" : ""
  } ${menuOpen ? "lp-nav--open" : ""}`}
>  <div className="lp-nav__inner">

    {/* Logo */}
    <div className="lp-nav__brand" onClick={() => scrollTo("home-section")}>
      <img
        src={logo_img}
        alt="Bhavani Motors"
        className="lp-nav__logo"
      />
      <span className="lp-nav__name">Bhavani Motors</span>
    </div>

    {/* Navigation */}
    <ul className={`lp-nav__links ${menuOpen ? "lp-nav__links--open" : ""}`}>

      <li>
        <button
  className={`lp-nav__link ${
    activeSection === "home-section" ? "active-link" : ""
  }`}
  onClick={() => scrollTo("home-section")}
>
  Home
</button>
      </li>

      <li>
        <button
  className={`lp-nav__link ${
    activeSection === "services-section" ? "active-link" : ""
  }`}
  onClick={() => scrollTo("services-section")}
>
  Services
</button>
      </li>

      <li>
       <button
  className={`lp-nav__link ${
    activeSection === "about-section" ? "active-link" : ""
  }`}
  onClick={() => scrollTo("about-section")}
>
  About
</button>
      </li>

      <li>
        <button
  className={`lp-nav__link ${
    activeSection === "contact-section" ? "active-link" : ""
  }`}
  onClick={() => scrollTo("contact-section")}
>
  Contact
</button>
      </li>

      <li>
        <Link
          to="/privacy-policy"
          className="lp-nav__link"
          onClick={() => setMenuOpen(false)}
        >
          Privacy Policy
        </Link>
      </li>

    </ul>

    {/* Hamburger (Mobile Only) */}
    <button
      className="lp-nav__burger"
      onClick={() => setMenuOpen(!menuOpen)}
      aria-label="Toggle Menu"
    >
      {menuOpen ? <FiX /> : <FiMenu />}
    </button>

  </div>
</nav>
      

      {/* ── HERO / SLIDER ──────────────────────────────────── */}
      <section id="home-section" className="lp-hero">
        {SLIDES.map((s, i) => (
          <div key={i} className={`lp-hero__slide${i === current ? " lp-hero__slide--active" : ""}`}
            style={{ backgroundImage: `url(${s.image})` }}>
            <div className="lp-hero__overlay" />
            <div className="lp-hero__content">
              <h1 className="lp-hero__heading">{s.heading}</h1>
              <p className="lp-hero__sub">{s.sub}</p>
              <button className="lp-hero__btn" onClick={() => scrollTo("contact-section")}>{s.cta}</button>
            </div>
          </div>
        ))}
        <button className="lp-hero__arrow lp-hero__arrow--left" onClick={prevSlide}><FiChevronLeft /></button>
        <button className="lp-hero__arrow lp-hero__arrow--right" onClick={nextSlide}><FiChevronRight /></button>
        <div className="lp-hero__dots">
          {SLIDES.map((_, i) => (
            <button key={i} className={`lp-hero__dot${i === current ? " lp-hero__dot--active" : ""}`}
              onClick={() => { setCurrent(i); startTimer(); }} />
          ))}
        </div>
      </section>

      {/* ── QUICK INFO BAR ─────────────────────────────────── */}
      <div className="lp-infobar">
        <div className="lp-infobar__item"><FiMapPin /><span>Opp. Ganga Hotel, B/h Axis Bank, Puna-Patiya, Kadodara Road, Surat 395010</span></div>
        <div className="lp-infobar__divider" />
        <div className="lp-infobar__item"><FiPhone /><span>9099 51 3131</span></div>
        <div className="lp-infobar__divider" />
        <div className="lp-infobar__item"><FiClock /><span>Mon–Fri: 8am–6pm &nbsp;|&nbsp; Sat: 9am–2pm</span></div>
      </div>

      <section id="services-section" className="lp-section lp-services">
  <h1 className="heading">Our Services</h1>

  <div className="lp-services__grid">
    {SERVICES.map((item, index) =>
      item.type === "text" ? (
        <div
          className="lp-service-box"
          key={index}
          data-aos="fade-up"
          data-aos-delay={index * 100}
        >
          <div className="lp-service-card__icon">
            {item.icon}
          </div>

          <h2>{item.title}</h2>
          <p>{item.desc}</p>
        </div>
      ) : (
        <div
          className="lp-service-image"
          key={index}
          data-aos="zoom-in"
          data-aos-delay={index * 100}
        >
          <img src={item.image} alt="service" />
        </div>
      )
    )}
  </div>
</section>
      {/* ── ABOUT ──────────────────────────────────────────── */}
      <section id="about-section" className="lp-section lp-about">
      
      {/* Section Header */}
      <p className="lp-section__eye">Who We Are</p>
      <h2 className="lp-section__title">About Bhavani Motors</h2>

      {/* Main Layout Container */}
      <div className="lp-about-top">

        {/* Left Side: Narrative Paragraphs */}
        <div className="lp-about__text">
          <p className="lp-about__body">
            Bhavani Motors is a trusted name in the automotive service industry,
            conveniently located in the heart of Surat. With over a decade of
            dedicated service, we have built a reputation for honest advice,
            transparent pricing, and reliable repairs.
          </p>

          <p className="lp-about__body">
            Our modern workshop is equipped with advanced diagnostic tools and
            staffed by experienced technicians who treat every vehicle with the
            care it deserves. Whether you drive a hatchback, sedan, or SUV,
            we have the expertise to keep it performing at its best.
          </p>
        </div>

        {/* Right Side: Features List */}
        <div className="lp-about-features">
          <div className="lp-feature-card">
            <span className="lp-feature-card__icon">✔</span>
            <span className="lp-feature-card__text">GST Registered Business — GSTIN 24AKTPT0612Q1ZJ</span>
          </div>

          <div className="lp-feature-card">
            <span className="lp-feature-card__icon">✔</span>
            <span className="lp-feature-card__text">Transparent, itemised billing every time</span>
          </div>

          <div className="lp-feature-card">
            <span className="lp-feature-card__icon">✔</span>
            <span className="lp-feature-card__text">Genuine & OEM-grade spare parts</span>
          </div>

          <div className="lp-feature-card">
            <span className="lp-feature-card__icon">✔</span>
            <span className="lp-feature-card__text">Quick turnaround — no unnecessary waiting</span>
          </div>
        </div>

      </div>

      {/* Bottom Layout Row: Counter Stats */}
      <div className="lp-about__stats">
        {[
          ["10+", "Years in Business"],
          ["3000+", "Happy Customers"],
          ["8000+", "Vehicles Serviced"],
          ["6", "Expert Technicians"],
        ].map(([n, l]) => (
          <div className="lp-stat-card" key={l}>
            <div className="lp-stat-card__num">{n}</div>
            <div className="lp-stat-card__label">{l}</div>
          </div>
        ))}
      </div>

    </section>
      {/* ── WHY CHOOSE US ──────────────────────────────────── */}
      <section className="lp-section lp-why">
        <div className="lp-section__inner">
          <p className="lp-section__eyebrow1">Our Promise</p>
          
          <h2 className="lp-section__title2">Why Choose Us</h2>
          <div className="lp-why__grid">
            {WHY_US.map((w, i) => (
              <div className="lp-why-card" key={i}>
                <div className="lp-why-card__icon">{w.icon}</div>
                <h3 className="lp-why-card__title">{w.title}</h3>
                <p className="lp-why-card__desc">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
       
      </section>

      {/* ── CONTACT ────────────────────────────────────────── */}
      <section id="contact-section" className="lp-section lp-contact">
        <div className="lp-section__inner">
          <p className="lp-section__eyebrow">Reach Us</p>
          <h2 className="lp-section__title">Get In Touch</h2>
          <div className="lp-contact__grid">

            {/* Info cards */}
            <div className="lp-contact__info">
              <div className="lp-contact-card">
                <div className="lp-contact-card__icon"><FiMapPin /></div>
                <div>
                  <h4>Address</h4>
                  <p>Opp. Ganga Hotel, B/h Axis Bank,<br />Puna-Patiya, Kadodara Road,<br />Surat 395010, Gujarat</p>
                </div>
              </div>
              <div className="lp-contact-card">
                <div className="lp-contact-card__icon"><FiPhone /></div>
                <div>
                  <h4>Phone</h4>
                  <p><a href="tel:+919099513131">+91 9099 51 3131</a></p>
                  <p><a href="tel:+919099385151">+91 9099 38 5151</a></p>
                </div>
              </div>
              <div className="lp-contact-card">
                <div className="lp-contact-card__icon"><FiMail /></div>
                <div>
                  <h4>Email</h4>
                  <p><a href="mailto:bhavanimotorsofficial@gmail.com">bhavanimotorsofficial@gmail.com</a></p>
                </div>
              </div>
              <div className="lp-contact-card">
                <div className="lp-contact-card__icon"><FiClock /></div>
                <div>
                  <h4>Working Hours</h4>
                  <p>Monday – Friday: 8:00 am – 6:00 pm</p>
                  <p>Saturday: 9:00 am – 2:00 pm</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="lp-contact__map">
              <iframe
                title="Bhavani Motors Location"
                src="https://www.google.com/maps?q=Opp.+Ganga+Hotel,+B/h+Axis+Bank,+Puna-Patiya,+Kadodara+Road,+Surat&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: "12px" }}
                allowFullScreen=""
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <div className="lp-footer__brand">
            <img src={logo_img} alt="logo" className="lp-footer__logo" />
            <span className="lp-footer__name">Bhavani Motors</span>
            <p className="lp-footer__tagline">Your trusted auto care partner in Surat.</p>
          </div>
          <div className="lp-footer__col">
            <h4>Quick Links</h4>
            <ul>
              <li><button onClick={() => scrollTo("home-section")}>Home</button></li>
              <li><button onClick={() => scrollTo("services-section")}>Services</button></li>
              <li><button onClick={() => scrollTo("about-section")}>About</button></li>
              <li><button onClick={() => scrollTo("contact-section")}>Contact</button></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            </ul>
          </div>
          <div className="lp-footer__col">
            <h4>Contact Info</h4>
            <p><FiMapPin style={{marginRight:6}} />Puna-Patiya, Kadodara Road, Surat 395010</p>
            <p><FiPhone style={{marginRight:6}} />9099 51 3131 &nbsp;|&nbsp; 9099 38 5151</p>
            <p><FiMail style={{marginRight:6}} />bhavanimotorsofficial@gmail.com</p>
          </div>
          <div className="lp-footer__col">
            <h4>Working Hours</h4>
            <p>Mon – Fri: 8:00 am – 6:00 pm</p>
            <p>Saturday: 9:00 am – 2:00 pm</p>
            <p>Sunday: Closed</p>
          </div>
        </div>
        <div className="lp-footer__bottom">
          <p>© {year} Bhavani Motors. All rights reserved. &nbsp;|&nbsp; GSTIN: 24AKTPT0612Q1ZJ</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
