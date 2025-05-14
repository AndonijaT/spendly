// src/pages/About.tsx
import usePageTitle from '../hooks/usePageTitle';
import '../styles/About.css';

function About() {
  usePageTitle('About Us');

  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>About Spendly</h1>
        <p>Your personal guide to smarter spending and saving.</p>
      </div>

      <section className="about-section">
        <h2>Why Spendly?</h2>
        <p>
          Spendly was created to make personal finance simple, visual, and collaborative. In a world
          of complex apps and disconnected bank feeds, we focus on what matters — helping you
          manually track your expenses, set clear budgets, and stay accountable with partners.
        </p>
      </section>

      <section className="about-section">
        <h2>How It Works</h2>
        <ul className="about-list">
          <li><strong>Manual Tracking:</strong> Quickly log income and expenses by category.</li>
          <li><strong>Smart Budgets:</strong> Set spending limits per category and get alerts when you’re near or over budget.</li>
          <li><strong>Multi-Device Sync:</strong> Access your data from anywhere, with support for shared accounts (e.g. couples).</li>
          <li><strong>Clear Visuals:</strong> View interactive graphs showing where your money goes.</li>
          <li><strong>Lightweight AI:</strong> Get gentle reminders and spending insights.</li>
        </ul>
      </section>

      <section className="about-section highlight-banner">
        <h2>Built for Simplicity</h2>
        <p>
          Spendly is intentionally simple. No bank integrations, no complex dashboards — just a clean,
          intuitive interface that keeps you in control of your finances.
        </p>
      </section>

      <section className="about-section mission-section">
        <h2>Our Mission</h2>
        <p>
          To empower individuals and households to become financially aware, intentional, and
          confident — one transaction at a time.
        </p>
      </section>

      <footer className="about-footer">
        <p>© {new Date().getFullYear()} Spendly. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default About;
