// src/pages/PrivacyPolicy.tsx
import '../styles/LegalPages.css';

export default function PrivacyPolicy() {
  return (
    <div className="legal-container">
      <h1>Privacy Policy</h1>
      <p>Last updated: May 26, 2025</p>

      <p>
        At <strong>Spendly</strong>, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal data.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li>Email and name during registration</li>
        <li>Optional phone number for 2FA</li>
        <li>Financial data you enter (transactions, budgets)</li>
        <li>Browser/device info for app improvement</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide personalized finance features</li>
        <li>To protect your account via 2FA</li>
        <li>To analyze usage and improve user experience</li>
      </ul>

      <h2>3. Data Security</h2>
      <p>We use Firebase Authentication and Firestore with encrypted connections. Your data is never shared with third parties without consent.</p>

      <h2>4. Your Rights</h2>
      <p>You may request to view, modify, or delete your data at any time by contacting us.</p>

      <h2>5. Changes</h2>
      <p>This policy may change. Users will be notified of any significant updates.</p>
    </div>
  );
}
