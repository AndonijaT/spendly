import { motion, AnimatePresence } from 'framer-motion';
import './../styles/Features.css';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import Modal from '../components/Modal';
import RegisterForm from '../components/RegisterForm';
import LoginForm from '../components/LoginForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import { useLanguage } from '../context/LanguageContext';

type Feature = {
  icon: string;
  title: string;
  description: string;
  details: string;
};

function Features() {
  const { t } = useLanguage();
  const [showTip, setShowTip] = useState(false);
  const [randomFact, setRandomFact] = useState('');
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

  const features: Feature[] = [
    {
      icon: '💸',
      title: t('feature.expenseTitle'),
      description: t('feature.expenseDesc'),
      details: t('feature.expenseDetails'),
    },
    {
      icon: '📊',
      title: t('feature.graphsTitle'),
      description: t('feature.graphsDesc'),
      details: t('feature.graphsDetails'),
    },
    {
      icon: '🛡️',
      title: t('feature.syncTitle'),
      description: t('feature.syncDesc'),
      details: t('feature.syncDetails'),
    },
    {
      icon: '🔔',
      title: t('feature.aiTitle'),
      description: t('feature.aiDesc'),
      details: t('feature.aiDetails'),
    },
    {
      icon: '🤝',
      title: t('feature.sharedTitle'),
      description: t('feature.sharedDesc'),
      details: t('feature.sharedDetails'),
    },
  ];

  const funFacts: string[] = [
    t('fact1'),
    t('fact2'),
    t('fact3'),
    t('fact4'),
    t('fact5'),
    t('fact6'),
    t('fact7'),
    t('fact8'),
    t('fact9'),
    t('fact10'),
  ];

  const showRandomTip = () => {
    const index = Math.floor(Math.random() * funFacts.length);
    setRandomFact(funFacts[index]);
    setShowTip(true);
  };

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
        {t('spendSmarter')}
      </motion.h1>

      <motion.p
        className="features-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {t('discoverFeatures')}
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
        <button onClick={showRandomTip}>💡 {t('funFact')}</button>

        {showTip && (
          <div className="features-modal-wrapper">
            <div className="features-modal-center">
              <div className="features-overlay" onClick={() => setShowTip(false)} />
              <div className="features-popup">
                <p>
                  <strong>{t('didYouKnow')}</strong> {randomFact}
                </p>
                <button onClick={() => setShowTip(false)}>{t('close')}</button>
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
            <div className="features-modal-center">
              <motion.div
                className="features-popup large"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <button className="features-close" onClick={() => setSelectedFeature(null)}>
                  ❌
                </button>
                <h3>
                  {selectedFeature.icon} {selectedFeature.title}
                </h3>
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
        <h2>{t('saveSmarter')}</h2>
        {isGuest && (
          <button className="cta-button" onClick={openRegisterModal}>
            {t('createAccount')}
          </button>
        )}

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
      </motion.div>
    </div>
  );
}

export default Features;
