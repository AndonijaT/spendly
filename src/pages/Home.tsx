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
import ImageStackSection from '../components/ImageStackSection';



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
        
        
<ImageStackSection/>

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
