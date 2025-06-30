import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';

function RegisterForm({
  onSuccess,
  switchToLogin,
}: {
  onSuccess: () => void;
  switchToLogin: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
     if (!acceptedTerms) {
    toast.error('Please accept the terms and privacy policy.');
    return;
  }
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });
await sendEmailVerification(userCred.user, {
  url: 'https://spendly-f30b5.web.app/?verified=true'
});

      toast.success('Verification email sent. Please check your inbox.');

      await auth.signOut(); // ✅ Sign them out immediately
      onSuccess(); // Optional: close modal or redirect
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists.');
      } else if (err.code === 'auth/invalid-email') {
        toast.error('Invalid email address.');
      } else if (err.code === 'auth/weak-password') {
        toast.error('Password must be at least 6 characters.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    }
  }; const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      toast.error('Google sign-up failed.');
    }
  };

  return (
    <form onSubmit={handleSignup} className="auth-form">
      <h2>Sign Up</h2>
      <input type="text" placeholder="Full Name" onChange={(e) => setName(e.target.value)} required />
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
     <div className="terms-container">
  <input
    type="checkbox"
    id="accept"
    checked={acceptedTerms}
    onChange={(e) => setAcceptedTerms(e.target.checked)}
    required
  />
  <label htmlFor="accept" className="terms-label">
    I have read and accepted the{' '}
    <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>{' '}
    and{' '}
    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
  </label>
</div>

  <button type="submit" disabled={!acceptedTerms}>
    Sign Up
  </button>
      <div className="auth-separator">or</div>
      <button className="google-btn" type="button" onClick={handleGoogleSignup}>
        <img src="/google-icon.png" alt="Google" style={{ width: '20px', marginRight: '8px' }} />
        Continue with Google
      </button>

      <p className="form-footer">
        Already have an account?{' '}
        <span onClick={switchToLogin} className="form-link">Sign in</span>
      </p>
    </form>
  );
}

export default RegisterForm;
