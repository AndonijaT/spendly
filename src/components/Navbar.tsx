import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../firebase/firebaseConfig'; // adjust if needed

function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAccountClick = () => {
    if (user) {
      navigate('/account');
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Spendly</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About Us</Link></li>
        <li><Link to="/features">Features</Link></li>
        <li><Link to="/contact">Contact Us</Link></li>

        {/* ✅ Show Dashboard only if logged in */}
        {user && (
          <li><Link to="/dashboard">Dashboard</Link></li>
        )}

        <li>
          <button className="account-button" onClick={handleAccountClick}>
            Account
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
