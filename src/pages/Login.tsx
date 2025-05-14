import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AuthForm.css';
import { toast } from 'react-toastify';


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    toast.success('Welcome back!');
    navigate('/');
  } catch (err: any) {
    toast.error('Invalid email or password.');
    setError(err.message);
  }
};


  const handleForgotPassword = async () => {
    if (!email) return setError('Please enter your email first.');
    try {
      await sendPasswordResetEmail(auth, email);
      toast.info('Password reset email sent!');
    } catch (err: any) {
      toast.error('Could not send reset email.');
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast.success('Signed in with Google!');
      navigate('/');
    } catch (err: any) {
      toast.error('Google login failed.');
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
