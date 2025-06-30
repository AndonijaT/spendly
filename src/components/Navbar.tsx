import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../firebase/firebaseConfig';
import Modal from './Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import './Navbar.css';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';

function Navbar({ toggleNotifications }: { toggleNotifications: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAccountClick = () => {
    if (user) {
      navigate('/account');
    } else {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };

  const useDarkText =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/account') ||
    location.pathname.startsWith('/budget') ||
    location.pathname.startsWith('/statistics') ||
    location.pathname.startsWith('/about') ||
    location.pathname.startsWith('/features') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/contact');
const isAboutPage = location.pathname === '/about';
const handleSignOut = async () => {
  try {
    await signOut(auth);
    navigate('/');
  } catch {
    toast.error('Sign out failed.');
  }
};


  return (
    <>
<nav className={`navbar 
  ${useDarkText ? 'navbar-light' : ''} 
  ${menuOpen ? 'open' : ''} 
  ${scrolled ? 'scrolled' : ''} 
  ${isAboutPage ? 'navbar-about' : ''}`}>
        <div className="navbar-logo">
          <Link to="/">Spendly</Link>
        </div>

        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <li><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><Link to="/about" onClick={() => setMenuOpen(false)}>About Us</Link></li>
          <li><Link to="/features" onClick={() => setMenuOpen(false)}>Features</Link></li>
          <li><Link to="/contact" onClick={() => setMenuOpen(false)}>Contact Us</Link></li>
          {user && <li><Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>}
          <li>
            <button className="account-button" onClick={() => { setMenuOpen(false); handleAccountClick(); }}>
              Account
            </button>
          </li>
          
          {user && (
  <li>
    <button
      className="account-button"
      onClick={() => { toggleNotifications(); setMenuOpen(false); }}
      aria-label="Notifications"
    >
      Notifications
    </button>
  </li>

)}
{user && (
  <li>
    <button
      className="account-button"
      onClick={() => { handleSignOut(); setMenuOpen(false); }}
    >
      Sign Out
    </button>
  </li>
)}


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
          {authMode == 'login' && (
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
