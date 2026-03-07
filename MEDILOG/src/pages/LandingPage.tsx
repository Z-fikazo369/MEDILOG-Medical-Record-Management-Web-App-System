import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";
import campusBg from "../assets/97122 (1).png";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="landing-container">
      {/* --- NAVBAR --- */}
      <nav className={`landing-nav ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-brand">
          <img
            src="/assets/isu-logo-300x300.png"
            alt="ISU Logo"
            className="nav-logo-img"
          />
          <img
            src="/medilog-icon.svg"
            alt="Medilog Logo"
            className="nav-logo-img"
          />
          <span className="nav-title">MEDILOG</span>
        </div>

        <div className="nav-links d-none d-md-flex">
          <button
            onClick={() => scrollToSection("hero")}
            className="nav-link-item"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection("features")}
            className="nav-link-item"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="nav-link-item"
          >
            How It Works
          </button>
          <button
            onClick={() => setShowAboutUs(true)}
            className="nav-link-item"
          >
            About Us
          </button>
        </div>

        <div className="nav-actions">
          <button
            className="btn-login-nav"
            onClick={() => navigate("/login/student")}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section id="hero" className="hero-section">
        <img
          src={campusBg}
          alt="Isabela State University Campus"
          className="hero-bg-img"
        />
        <div className="hero-overlay"></div>
        <div className="hero-content-wrapper">
          <div className="hero-text-block">
            <span className="hero-badge">Campus Health Solutions</span>
            <h1 className="hero-headline">Securing Health on Campus.</h1>
            <p className="hero-subtext">
              A streamlined Medical Service Management System designed to
              empower campus infirmaries with accurate records, smart inventory,
              and seamless operations.
            </p>
            <div className="hero-buttons">
              <button
                className="btn-primary-action"
                onClick={() => navigate("/signup")}
              >
                Get Started
              </button>
              <button
                className="btn-secondary-action"
                onClick={() => scrollToSection("features")}
              >
                Explore Features
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- CORE FEATURES SECTION --- */}
      <section id="features" className="features-section">
        <div className="section-header text-center">
          <h2 className="section-title">Platform Features</h2>
          <p className="section-subtitle">
            Powerful tools for students and medical staff — all in one secure
            platform.
          </p>
        </div>

        <div className="features-grid container">
          <div className="feature-card">
            <div className="feature-icon-box">
              <i className="bi bi-file-earmark-medical"></i>
            </div>
            <h3>Online Medical Forms</h3>
            <p>
              Students can submit physical exam requests, medical certificates,
              lab requests, and monitoring records directly from their
              dashboard.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <i className="bi bi-bell"></i>
            </div>
            <h3>Real-Time Notifications</h3>
            <p>
              Get instant alerts when your records are submitted, reviewed,
              approved, or if any action is needed — no more guessing.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <i className="bi bi-shield-lock"></i>
            </div>
            <h3>Secure Health Records</h3>
            <p>
              All patient data is encrypted and access-controlled. Only
              authorized medical staff can view and manage sensitive records.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <i className="bi bi-capsule"></i>
            </div>
            <h3>Pharmacy & Inventory</h3>
            <p>
              Staff can track medicine stock levels, expiration dates, and
              issuance history. Students see what medicines are available.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <i className="bi bi-robot"></i>
            </div>
            <h3>AI-Powered Insights</h3>
            <p>
              Built-in AI assistant helps staff with medical summaries,
              transcription, and predictive analytics for smarter decisions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <i className="bi bi-download"></i>
            </div>
            <h3>Export & Reports</h3>
            <p>
              Generate and download CSV or Excel reports for records, tallying,
              and analytics — ready for compliance and institutional use.
            </p>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header text-center">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Getting started with Medilog is simple. Here's your journey as a
            student.
          </p>
        </div>

        <div className="steps-container container">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">
              <i className="bi bi-person-plus"></i>
            </div>
            <h3>Create Your Account</h3>
            <p>
              Sign up with your university email and complete your student
              profile in minutes.
            </p>
          </div>

          <div className="step-connector">
            <i className="bi bi-arrow-right"></i>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">
              <i className="bi bi-file-earmark-medical"></i>
            </div>
            <h3>Submit Medical Forms</h3>
            <p>
              Request physical exams, medical certificates, lab tests, or
              monitoring records online.
            </p>
          </div>

          <div className="step-connector">
            <i className="bi bi-arrow-right"></i>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">
              <i className="bi bi-bell"></i>
            </div>
            <h3>Get Notified</h3>
            <p>
              Receive real-time updates when your records are reviewed and
              approved by the clinic.
            </p>
          </div>

          <div className="step-connector">
            <i className="bi bi-arrow-right"></i>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-icon">
              <i className="bi bi-download"></i>
            </div>
            <h3>Access Your Records</h3>
            <p>
              View, download, or print your approved medical documents anytime
              from your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* --- BENEFITS SECTION --- */}
      <section id="benefits" className="benefits-section">
        <div className="container">
          <div className="benefits-wrapper row align-items-center">
            <div className="col-lg-6">
              <h2 className="section-title text-start">
                Built for the modern educational institution.
              </h2>
              <p className="benefits-lead">
                Medilog bridges the gap between traditional healthcare and
                modern digital efficiency, specifically tailored for university
                environments.
              </p>

              <ul className="benefits-checklist">
                <li>
                  <i className="bi bi-check-circle-fill"></i> Streamlines
                  high-volume clinic visits
                </li>
                <li>
                  <i className="bi bi-check-circle-fill"></i> Reduces
                  administrative workload for nurses
                </li>
                <li>
                  <i className="bi bi-check-circle-fill"></i> Ensures data
                  privacy compliance
                </li>
                <li>
                  <i className="bi bi-check-circle-fill"></i> Prevents medicine
                  stock-outs
                </li>
              </ul>
            </div>

            <div className="col-lg-6 mt-5 mt-lg-0">
              <div className="audience-cards">
                <div className="audience-card">
                  <i className="bi bi-hospital text-success"></i>
                  <h4>Campus Infirmaries</h4>
                </div>
                <div className="audience-card mt-4 ms-lg-4">
                  <i className="bi bi-person-badge text-primary"></i>
                  <h4>Medical Staff</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- ABOUT US OVERLAY --- */}
      {showAboutUs && (
        <div className="aboutus-overlay" onClick={() => setShowAboutUs(false)}>
          <div
            className="aboutus-showcase"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="aboutus-close"
              onClick={() => setShowAboutUs(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <div className="aboutus-header">
              <span className="aboutus-badge">Meet the Team</span>
              <h2>The Minds Behind Medilog</h2>
              <p>
                A group of passionate student developers from Isabela State
                University, dedicated to improving campus healthcare through
                technology.
              </p>
            </div>

            <div className="aboutus-team-grid">
              <div className="aboutus-team-card">
                <img
                  src="/assets/joyce.jpg"
                  alt="Ma. Richlyn Joyce Santos"
                  className="aboutus-avatar-img"
                />
                <h4>Ma. Richlyn Joyce Santos</h4>
                <span className="aboutus-role">Front-end / UI/UX</span>
                <a
                  href="mailto:marichlynjoyce.c.santos@isu.edu.ph"
                  className="aboutus-email"
                >
                  <i className="bi bi-envelope"></i>
                  marichlynjoyce.c.santos@isu.edu.ph
                </a>
              </div>

              <div className="aboutus-team-card lead">
                <div className="aboutus-lead-badge">LEAD</div>
                <img
                  src="/assets/zyril.jpg"
                  alt="Zyril Anne Villanueva"
                  className="aboutus-avatar-img"
                />
                <h4>Zyril Anne Villanueva</h4>
                <span className="aboutus-role highlight">
                  Lead Programmer | Full Stack
                </span>
                <a
                  href="mailto:zyrilanne.c.villanueva@isu.edu.ph"
                  className="aboutus-email"
                >
                  <i className="bi bi-envelope"></i>
                  zyrilanne.c.villanueva@isu.edu.ph
                </a>
              </div>

              <div className="aboutus-team-card">
                <img
                  src="/assets/lady.jpg"
                  alt="Lady Christaine Iñigo"
                  className="aboutus-avatar-img"
                />
                <h4>Lady Christaine Iñigo</h4>
                <span className="aboutus-role">Front-end / UI/UX</span>
                <a
                  href="mailto:ladychristaine.g.inigo@isu.edu.ph"
                  className="aboutus-email"
                >
                  <i className="bi bi-envelope"></i>
                  ladychristaine.g.inigo@isu.edu.ph
                </a>
              </div>
            </div>

            <div className="aboutus-footer-note">
              <i className="bi bi-building"></i>
              Isabela State University — College of Computing Studies,
              Information and Communication Technology
            </div>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="corporate-footer">
        <div className="footer-content container">
          <div className="footer-brand">
            <div className="footer-logo-row">
              <img
                src="/assets/isu-logo-300x300.png"
                alt="ISU Logo"
                className="footer-logo-img"
              />
              <img
                src="/medilog-icon.svg"
                alt="Medilog"
                className="footer-logo-img"
              />
              <span className="footer-brand-name">MEDILOG</span>
            </div>
            <p className="footer-tagline">
              A Medical Service Management System for Isabela State University
              campus infirmaries.
            </p>
          </div>

          <div className="footer-links">
            <h5>Quick Links</h5>
            <ul>
              <li>
                <button onClick={() => scrollToSection("hero")}>Home</button>
              </li>
              <li>
                <button onClick={() => scrollToSection("features")}>
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection("how-it-works")}>
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => setShowAboutUs(true)}>About Us</button>
              </li>
            </ul>
          </div>

          <div className="footer-contact">
            <h5>Contact Us</h5>
            <ul>
              <li>
                <i className="bi bi-envelope"></i>
                <a href="mailto:medilogisu@gmail.com">medilogisu@gmail.com</a>
              </li>
              <li>
                <i className="bi bi-geo-alt"></i>
                <span>Isabela State University, Echague, Isabela</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom container">
          <p>© 2026 MEDILOG — Isabela State University. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
