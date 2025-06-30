import { motion, AnimatePresence } from 'framer-motion';
import './../styles/Features.css';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import Modal from '../components/Modal';
import RegisterForm from '../components/RegisterForm';
import LoginForm from '../components/LoginForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import Footer from '../components/Footer'; 


type Feature = {
  icon: string;
  title: string;
  description: string;
  details: string;
};

const features: Feature[] = [
  {
    icon: '💸',
    title: 'Expense Tracking',
    description: 'Record where your money goes with just a few clicks.',
    details:
      'Easily log every expense with a single tap and categorize your spending. Get a full picture of your cash flow with monthly breakdowns.',
  },
  {
    icon: '📊',
    title: 'Interactive Graphs',
    description: 'Visualize your monthly spending and savings patterns.',
    details:
      'Beautiful, dynamic charts help you quickly understand trends in your income and spending, empowering smarter financial decisions.',
  },
  {
    icon: '🛡️',
    title: 'Secure Sync',
    description: 'Keep your data safe across all your devices.',
    details:
      'Data is stored securely in the cloud with 2FA support. Access your budget from your phone, tablet, or desktop seamlessly.',
  },
  {
    icon: '🔔',
    title: 'AI Notifications',
    description: 'Get alerts when you’re close to overspending.',
    details:
      'Smart alerts notify you of risky patterns in your spending and recommend better ways to stick to your budget.',
  },
  {
    icon: '🤝',
    title: 'Shared Accounts',
    description: 'Budget together with your partner or family.',
    details:
      'Invite others to manage finances together — perfect for couples, roommates, or families aiming for common financial goals.',
  },
];

function Features() {
  const [showTip, setShowTip] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('register');

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
    <div className="features-container">
      <motion.h1
        className="features-title"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Spend Smarter with Spendly!
      </motion.h1>

      <motion.p
        className="features-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Discover features that help you take full control of your personal finances.
      </motion.p>

      <div className="features-grid">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="feature-card cursor-pointer"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedFeature(feature)}
          >
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="features-tip">
        <button onClick={() => setShowTip(true)}>💡 Fun Fact</button>

        {showTip && (
          <div className="features-modal-wrapper">
            <div className="features-modal-center">
              <div className="features-overlay" onClick={() => setShowTip(false)} />

              <div className="features-popup">
                <p>
                  <strong>Did you know?</strong> People who track expenses save up to <u>20%</u> more each month!
                </p>
                <button onClick={() => setShowTip(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>


      <AnimatePresence>
        {selectedFeature && (
          <div className="features-modal-wrapper">
            <motion.div
              className="features-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeature(null)}
            />
            <div className="features-modal-center"> {/* NEW WRAPPER */}
              <motion.div
                className="features-popup large"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <button className="features-close" onClick={() => setSelectedFeature(null)}>❌</button>
                <h3>{selectedFeature.icon} {selectedFeature.title}</h3>
                <p>{selectedFeature.details}</p>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>



      <motion.div
        className="features-cta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h2>Ready to save smarter?</h2>
        {isGuest && (
          <button className="cta-button" onClick={openRegisterModal}>
            Create an Account
          </button>
        )}{showAuthModal && (
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
            {authMode === 'forgot' && (
              <ForgotPasswordForm onBack={() => setAuthMode('login')} />
            )}
          </Modal>
        )}

      </motion.div>
      <Footer />

    </div>

  );
}

export default Features;
