import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import usePageTitle from '../hooks/usePageTitle';
import './../styles/Home.css';
import Modal from '../components/Modal';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import Footer from '../components/Footer';
import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';



function Home() {
  usePageTitle('Home');
  const { t } = useLanguage();
  const [isGuest, setIsGuest] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('register');
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsGuest(!user);
      if (user) {
        setUserName(user.displayName || user.email || 'there');
      } else {
        setUserName(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const openRegisterModal = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  return (
    <>
      <div className="video-background">
        <video autoPlay loop muted playsInline>
          <source src="/video.mp4" type="video/mp4" />
          {t('videoNotSupported') || 'Your browser does not support the video tag.'}
        </video>
      </div>

      <div className="home">
        <div className="hero">
          {isGuest ? (
            <div className="hero-text guest">
              <h1>{t('heroTitle') || 'The smarter way to manage money'}</h1>
              <p>{t('heroSubtitle') || 'Spendly helps you track every expense...'}</p>
              <button className="cta-button" onClick={openRegisterModal}>
                {t('getStarted') || 'Get started'}
              </button>
            </div>
          ) : (
            <div className="hero-text user">
              <h1>{t('greeting') || 'Hi'}, {userName}</h1>
              <p>{t('greetingMessage') || "Hope you're having a good day! ☀️"}</p>
            </div>
          )}
        </div>
        <div className="convincing-section">
  <h2 className="section-title">{t('whyJoinSpendly') || 'Why Join Spendly?'}</h2>
  
  <div className="feature-scroll">
    <div className="feature-card">
      <img src="/dashboard1.png" alt="Overview" className="feature-wavy-img" />
      <div className="feature-content">
        <h3>{t('overviewAtGlance') || 'Overview at a glance'}</h3>
        <p>{t('overviewText') || 'Instantly see your financial health with clear, beautiful visuals.'}</p>
      </div>
    </div>

    
    <div className="feature-card">
      <img src="/dashboard3.png" alt="Categorization" className="feature-wavy-img" />
      <div className="feature-content">
        <h3>{t('categorizeExpenses') || 'Categorize Expenses'}</h3>
        <p>{t('categorizeText') || 'Sort your spending into categories with ease.'}</p>
      </div>
    </div>

    <div className="feature-card reverse">
      <img src="/dashboard4.png" alt="Analytics" className="feature-wavy-img flipped" />
      <div className="feature-content">
        <h3>{t('detailedAnalytics') || 'Detailed Analytics'}</h3>
        <p>{t('analyticsText') || 'Understand your spending habits with insightful analytics.'}</p>
      </div>
    </div>

    <div className="feature-card">
      <img src="/dashboard5.png" alt="Full History" className="feature-wavy-img" />
      <div className="feature-content">
        <h3>{t('fullHistory') || 'Full Transaction History'}</h3>
        <p>{t('historyText') || 'Your entire spending history, beautifully displayed.'}</p>
      </div>
    </div>

   
  </div>
</div>


        {showAuthModal && (
          <Modal onClose={() => setShowAuthModal(false)}>
            {authMode === 'register' && (
              <RegisterForm
                onSuccess={() => setShowAuthModal(false)}
                switchToLogin={() => setAuthMode('login')}
              />
            )}
            {authMode === 'login' && (
              <LoginForm
                onSuccess={() => setShowAuthModal(false)}
                switchToRegister={() => setAuthMode('register')}
                switchToForgot={() => setAuthMode('forgot')}
              />
            )}
            {authMode === 'forgot' && <ForgotPasswordForm onBack={() => setAuthMode('login')} />}
          </Modal>
        )}
      </div>

      <div className="footer-wrapper">
        <Footer />
      </div>
    </>
  );
}

export default Home;
