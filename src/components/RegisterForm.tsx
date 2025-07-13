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
import { useLanguage } from '../context/LanguageContext';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

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
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError(t('acceptTerms') || 'Please accept the terms and privacy policy.');
      return;
    }
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });
      await userCred.user.reload(); // 🔧 ensures metadata is fresh
      await sendEmailVerification(userCred.user, {
        url: 'https://spendly-971fa.web.app/?verified=true',
      });
      toast.success(t('verificationSent') || 'Verification email sent. Please check your inbox or spam folder.');
      await auth.signOut();
      onSuccess();
    } catch (err: any) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError(t('emailInUse') || 'An account with this email already exists.');
          break;
        case 'auth/invalid-email':
          setError(t('invalidEmail') || 'Invalid email address.');
          break;
        case 'auth/weak-password':
          setError(t('weakPassword') || 'Password must be at least 6 characters.');
          break;
        default:
          setError(t('signupFailed') || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      setError(t('googleSignupFailed') || 'Google sign-up failed.');
    }
  };

  return (
    <form onSubmit={handleSignup} className="auth-form">
      <h2>{t('signUp') || 'Sign Up'}</h2>
      <input
        type="text"
        placeholder={t('fullName') || 'Full Name'}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder={t('email') || 'Email'}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div className="password-input-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={t('password') || 'Password'}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <span
          className="toggle-password"
          onClick={() => setShowPassword((prev) => !prev)}
          style={{
            userSelect: 'none',
            cursor: 'pointer',
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#555',
            fontSize: '20px',
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setShowPassword((prev) => !prev);
          }}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
        </span>
      </div>


      <div className="terms-container">
        <input
          type="checkbox"
          id="accept"
          checked={acceptedTerms}
          onChange={(e) => {
            setAcceptedTerms(e.target.checked);
            setError('');
          }}
          required
        />
        <label htmlFor="accept" className="terms-label">
          {t('termsConfirm') || 'I have read and accepted the '}
          <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">
            {t('termsOfService') || 'Terms of Service'}
          </a>{' '}
          {t('and') || 'and'}{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
            {t('privacyPolicy') || 'Privacy Policy'}
          </a>.
        </label>
      </div>

      <button type="submit">
        {t('signUp') || 'Sign Up'}
      </button>

      <div className="auth-separator">{t('or') || 'or'}</div>

      <button className="google-btn" type="button" onClick={handleGoogleSignup}>
        <img src="/google-icon.png" alt="Google" style={{ width: '20px', marginRight: '8px' }} />
        {t('continueWithGoogle') || 'Continue with Google'}
      </button>
      {error && (
        <p
          style={{
            color: 'red',
            fontSize: '0.9rem',
            marginTop: '10px',
            textAlign: 'center',
          }}
        >
          {error}
        </p>
      )}

      <p className="form-footer">
        {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
        <span onClick={switchToLogin} className="form-link">
          {t('signIn') || 'Sign in'}
        </span>
      </p>
    </form>
  );
}

export default RegisterForm;
