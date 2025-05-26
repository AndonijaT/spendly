// src/pages/TermsOfUse.tsx
import '../styles/LegalPages.css';

export default function TermsOfUse() {
  return (
    <div className="legal-container">
      <h1>Terms of Use</h1>
      <p>Last updated: May 26, 2025</p>

      <h2>1. Introduction</h2>
      <p>These terms govern the use of the Spendly web application. By using the app, you agree to these terms.</p>

      <h2>2. Use of the Service</h2>
      <ul>
        <li>You must be at least 16 years old</li>
        <li>All data entered should be accurate and lawful</li>
        <li>Do not misuse the platform for illegal activities</li>
      </ul>

      <h2>3. Account</h2>
      <p>You are responsible for maintaining the security of your account, including enabling two-factor authentication if desired.</p>

      <h2>4. Limitation of Liability</h2>
      <p>Spendly is not responsible for financial decisions made based on data displayed in the app.</p>

      <h2>5. Changes</h2>
      <p>We reserve the right to update these terms. Continued use of the app after changes means you accept the new terms.</p>
    </div>
  );
}
