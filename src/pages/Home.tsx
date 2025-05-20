import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import usePageTitle from '../hooks/usePageTitle';
import './../styles/Home.css';
import Modal from '../components/Modal';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

function Home() {
  usePageTitle('Home');
  const [isGuest, setIsGuest] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'| 'forgot'>('register');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsGuest(!user);
    });
    return () => unsubscribe();
  }, []);

  const openRegisterModal = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  return (
    <div className="home">
      <div className="hero">
        <video className="bg-video" autoPlay muted loop>
          <source src="/video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {isGuest && (
          <div className="hero-text">
            <h1>The smarter way to manage money</h1>
            <p>
              Spendly helps you track every expense, plan smarter budgets, and
              achieve your savings goals — all in one beautifully simple app.
            </p>
            <button className="cta-button" onClick={openRegisterModal}>
              Get started
            </button>
          </div>
        )}
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
        switchToForgot={() => setAuthMode('forgot')} //  new prop to LoginForm
      />
    )}
    {authMode === 'forgot' && (
      <ForgotPasswordForm onBack={() => setAuthMode('login')} />
    )}
  </Modal>
)}

    </div>
  );
}

export default Home;
