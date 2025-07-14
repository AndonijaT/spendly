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
import ReviewsSection from '../components/ReviewSection';


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
<section className="home-mission-section">
  <div className="mission-grid">
    <div className="mission-text">
      <h2>We’re on a mission to make money feel simple, human, and stress-free.</h2>
      <p>
        Spendly is not just an app. It's a mindset shift. We believe that personal finance should feel empowering — not overwhelming. 
        That’s why we’ve built a tool that helps you understand your finances visually, manually, and meaningfully.
      </p>
      <p>
        Our goal is to make budgeting something you actually enjoy. Whether you're splitting groceries with a partner,
        planning for a big move, or just want to know where your coffee money went — Spendly is here to help you see clearly and act wisely.
      </p>
      <p>
        We design Spendly with real humans in mind. No bank syncing. No subscription traps. Just clarity, control, and a bit of joy in every click.
      </p>
      <p>
        And we’re just getting started. From personalized AI tips to shared budgets and real-time alerts,
        we’re building the future of mindful money management — together.
      </p>
      <button className="about-link-button" onClick={() => window.location.href = '/about'}>
        Learn More About Our Vision
      </button>
    </div>
    <div className="mission-images">
      <img src="/man.png" alt="Man holding phone" />
      <img src="/people.png" alt="Analytics chart" />
    </div>
  </div>
</section>

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
        <ReviewsSection />


        <Footer />
    </>
  );
}

export default Home;
