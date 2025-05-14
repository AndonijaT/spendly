import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AuthForm.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return setError('Please enter your email first.');
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <h2>Log In</h2>


      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Log In</button>
      </form>

        <div className="auth-separator">or</div>
              <button className="google-btn" onClick={handleGoogleLogin}><img src="/google-icon.png" alt="Google" style={{ width: '20px', marginRight: '8px' }} />Continue with Google</button>

      <p>
        <button className="forgot-password" type="button" onClick={handleForgotPassword}>
          Forgot Password?
        </button>
      </p>

      <p>Don't have an account? <Link className="auth-link" to="/register">Sign up</Link></p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default Login;
