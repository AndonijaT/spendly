import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../firebase/firebaseConfig';
import Modal from './Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import './Navbar.css';

function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  const handleAccountClick = () => {
    if (user) {
      navigate('/account');
    } else {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };

  // Detect if route needs dark navbar
  const useDarkText =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/account') ||
    location.pathname.startsWith('/budget') ||
    location.pathname.startsWith('/statistics');

  return (
    <>
      <nav className={`navbar ${useDarkText ? 'navbar-light' : ''}`}>
        <div className="navbar-logo">
          <Link to="/">Spendly</Link>
        </div>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/features">Features</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
          {user && <li><Link to="/dashboard">Dashboard</Link></li>}
          <li>
            <button className="account-button" onClick={handleAccountClick}>Account</button>
          </li>
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
              switchToForgot={() => setAuthMode('forgot')}
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
