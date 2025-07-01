import '../styles/LegalPages.css';
import { useLanguage } from '../context/LanguageContext';

export default function PrivacyPolicy() {
  const { t } = useLanguage();

  return (
    <div className="legal-container">
      <h1>{t('privacyPolicyTitle') || 'Privacy Policy'}</h1>
      <p>{t('lastUpdated') || 'Last updated: May 26, 2025'}</p>

      <p>
        {t('privacyIntro') ||
          'At'} <strong>Spendly</strong>{' '}
        {t('privacyIntroCont') ||
          ', your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal data.'}
      </p>

      <h2>{t('section1Title') || '1. Information We Collect'}</h2>
      <ul>
        <li>{t('infoEmailName') || 'Email and name during registration'}</li>
        <li>{t('infoPhone') || 'Optional phone number for 2FA'}</li>
        <li>{t('infoFinancialData') || 'Financial data you enter (transactions, budgets)'}</li>
        <li>{t('infoBrowserData') || 'Browser/device info for app improvement'}</li>
      </ul>

      <h2>{t('section2Title') || '2. How We Use Your Information'}</h2>
      <ul>
        <li>{t('usePersonalizedFeatures') || 'To provide personalized finance features'}</li>
        <li>{t('use2FA') || 'To protect your account via 2FA'}</li>
        <li>{t('useAnalytics') || 'To analyze usage and improve user experience'}</li>
      </ul>

      <h2>{t('section3Title') || '3. Data Security'}</h2>
      <p>
        {t('dataSecurity') ||
          'We use Firebase Authentication and Firestore with encrypted connections. Your data is never shared with third parties without consent.'}
      </p>

      <h2>{t('section4Title') || '4. Your Rights'}</h2>
      <p>
        {t('yourRights') ||
          'You may request to view, modify, or delete your data at any time by contacting us.'}
      </p>

      <h2>{t('section5Title') || '5. Changes'}</h2>
      <p>
        {t('changesNotice') ||
          'This policy may change. Users will be notified of any significant updates.'}
      </p>
    </div>
  );
}
