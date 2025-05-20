// src/components/Navbar.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../firebase/firebaseConfig';
import Modal from './Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './Navbar.css';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'| 'forgot'>('login');

  const handleAccountClick = () => {
    if (user) {
      navigate('/account');
    } else {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/">Spendly</Link>
        </div>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/features">Features</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
          {user && <li><Link to="/dashboard">Dashboard</Link></li>}
          <li><button className="account-button" onClick={handleAccountClick}>Account</button></li>
        </ul>
      </nav>

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
    </>
  );
}

export default Navbar;
