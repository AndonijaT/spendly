import './../styles/Footer.css';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaPinterestP, FaHome, FaPhone, FaEnvelope } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="footer dark">
      <div className="footer-columns">
        <div className="footer-col about">
          <h3>About Spendly</h3>
          <p>
            Spendly helps you gain control of your finances by manually tracking income, expenses, and budgets — ideal for anyone who wants to have overview of their spending habits.
          </p>
          <p className="quote">– Andonija Todorova, Founder</p>
        </div>

        <div className="footer-col connect">
          <h3>Keep Connected</h3>
          <ul>
            <li><FaFacebookF /> <a href="#">Like us on Facebook</a></li>
            <li><FaTwitter /> <a href="#">Follow us on Twitter</a></li>
            <li><FaPinterestP /> <a href="#">Follow us on Pinterest</a></li>
          </ul>
        </div>

        <div className="footer-col contact">
          <h3>Contact Information</h3>
         <ul>
  <li><FaHome /> <span>Spendly <br />Maribor, Slovenia</span></li>
  <li>
    <FaPhone />
    <a href="tel:+38669446201">+386 69 446 201</a>
  </li>
  <li>
    <FaEnvelope />
    <a href="mailto:contact@spendly.app">contact@spendly.app</a>
  </li>
</ul>

        </div>
      </div>

      <div className="footer-bottom">
        <p>©2025 Spendly – All rights reserved.</p>
        <div className="footer-links">
          <Link to="/contact">Contact Us</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-use">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
