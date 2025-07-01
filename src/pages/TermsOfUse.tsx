import '../styles/LegalPages.css';
import { useLanguage } from '../context/LanguageContext';

export default function TermsOfUse() {
    const { t } = useLanguage();

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>{t('termsTitle') || 'Terms of Service'}</h1>
      <p><strong>{t('termsEffectiveDate') || 'Effective Date'}:</strong> July 1, 2025</p>

      <h2>{t('termsAcceptance') || '1. Acceptance of Terms'}</h2>
      <p>{t('termsAcceptanceText') || 'By using Spendly, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use of the application.'}</p>

      <h2>{t('termsUse') || '2. Use of the Service'}</h2>
      <p>{t('termsUseText') || 'Spendly is a personal finance tracking app intended for individuals over the age of 16. You agree not to misuse the service or access data belonging to others.'}</p>

      <h2>{t('termsSecurity') || '3. Account & Security'}</h2>
      <p>{t('termsSecurityText') || 'You are responsible for keeping your login credentials safe. Enabling two-factor authentication (2FA) is recommended for added security.'}</p>

      <h2>{t('termsPrivacy') || '4. Data and Privacy'}</h2>
      <p>{t('termsPrivacyText') || 'Your financial data is stored securely in a Firebase cloud database. We do not sell or share your data with third parties.'}</p>

      <h2>{t('termsLimitations') || '5. Limitations'}</h2>
      <p>{t('termsLimitationsText') || 'Spendly does not connect to bank APIs or provide accounting, tax, or legal advice. All data must be entered manually.'}</p>

      <h2>{t('termsAI') || '6. AI Insights'}</h2>
      <p>{t('termsAIText') || 'Any AI-generated suggestions are informational only and do not constitute financial advice.'}</p>

      <h2>{t('termsTermination') || '7. Termination'}</h2>
      <p>{t('termsTerminationText') || 'We reserve the right to suspend or terminate any account that violates these terms.'}</p>

      <h2>{t('termsChanges') || '8. Changes'}</h2>
      <p>{t('termsChangesText') || 'These Terms may change from time to time. Continued use of the app constitutes acceptance of the updated terms.'}</p>

      <h2>{t('termsContact') || '9. Contact'}</h2>
      <p>{t('termsContactText') || 'If you have questions, contact us at: andonija.todorova@student.um.si'}</p>
    </div>
  );
}
