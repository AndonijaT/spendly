import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import './../styles/LoginForm.css';
import { useLanguage } from '../context/LanguageContext';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

function LoginForm({
  onSuccess,
  switchToRegister,
  switchToForgot,
}: {
  onSuccess: () => void;
  switchToRegister: () => void;
  switchToForgot: () => void;
}) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resolver, setResolver] = useState<any>(null);
  const [verificationId, setVerificationId] = useState('');
  const [mfaVisible, setMfaVisible] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

 useEffect(() => {
  if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
    const container = document.getElementById('recaptcha-container');

    if (!container) {
      console.error('Missing reCAPTCHA container');
      return;
    }

    try {
      const verifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: (response: string) => {
            console.log('reCAPTCHA solved:', response);
          },
          'expired-callback': () => {
            console.warn('reCAPTCHA expired.');
          },
        }
      );

      verifier.render().then(() => {
        window.recaptchaVerifier = verifier;
        console.log('reCAPTCHA rendered.');
      }).catch((err) => {
        console.error('Failed to render reCAPTCHA:', err);
      });
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
    }
  }

  return () => {
    // Cleanup
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      } catch {}
    }
  };
}, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      if (!userCred.user.emailVerified) {
        toast.warn(t('emailNotVerified') || 'Email not verified. Please check your inbox.');
        await auth.signOut();
        return;
      }

      onSuccess();
    } catch (err: any) {
      const code = err?.code;
if (code === 'auth/multi-factor-auth-required') {
  try {
    const resolver = getMultiFactorResolver(auth, err);
    const phoneInfoOptions = {
      multiFactorHint: resolver.hints[0],
      session: resolver.session,
    };

    // Wait for reCAPTCHA to render if it hasn’t
    if (!window.recaptchaVerifier) {
      throw new Error('reCAPTCHA not initialized.');
    }

    const verifier = window.recaptchaVerifier;

    if (verifier.render) {
      await verifier.render();
    }

    const phoneProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneProvider.verifyPhoneNumber(
      phoneInfoOptions,
      verifier
    );

    setResolver(resolver);
    setVerificationId(verificationId);
    setMfaVisible(true);
    return;
  } catch (mfaErr: any) {
    console.error('MFA SMS send failed:', mfaErr);
    toast.error(t('smsFailed') || 'Failed to send SMS verification code.');
    return;
  }
}


      if (code === 'auth/network-request-failed') {
        toast.warning(t('networkIssue') || 'Network issue. Retrying...');
        setTimeout(() => handleLogin(e), 2000);
        return;
      }

      switch (code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError(t('errorWrongPassword') || 'Incorrect email or password.');
          break;
        case 'auth/user-not-found':
          setError(t('errorUserNotFound') || 'No account found with this email.');
          break;
        case 'auth/too-many-requests':
          setError(t('errorTooManyRequests') || 'Too many attempts. Try again later.');
          break;
        case 'auth/invalid-email':
          setError(t('errorInvalidEmail') || 'Invalid email format.');
          break;
        case 'auth/internal-error':
          setError(t('errorInternal') || 'An internal error occurred. Please try again.');
          break;
        default:
          console.error('[Unhandled Firebase Error]', err);
          setError(t('errorLoginFailed') || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);

      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        toast.warn(t('emailNotVerifiedGoogle') || 'Google account is not verified.');
        await auth.signOut();
        return;
      }

      onSuccess();
    } catch (err: any) {
      switch (err.code) {
        case 'auth/popup-blocked':
        case 'auth/popup-closed-by-user':
          toast.info(t('popupBlocked') || 'Popup blocked. Switching to redirect login...');
          await signInWithRedirect(auth, provider);
          break;
        case 'auth/account-exists-with-different-credential':
          setError(t('errorAccountExists') || 'Account already exists with this email.');
          break;
        case 'auth/invalid-credential':
          setError(t('errorGoogleInvalid') || 'Invalid Google credentials.');
          break;
        default:
          console.error('[Google Login Error]', err.code);
          setError(t('errorGoogleGeneric') || 'Google sign-in failed.');
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySMS = async () => {
    try {
      const cred = PhoneAuthProvider.credential(verificationId, smsCode);
      const assertion = PhoneMultiFactorGenerator.assertion(cred);
      const userCred = await resolver.resolveSignIn(assertion);

      if (!userCred.user.emailVerified) {
        await auth.signOut();
        toast.error(t('emailNotVerified') || 'Please verify your email.');
        return;
      }

      toast.success(t('verificationSuccess') || 'Verification successful.');
      setMfaVisible(false);
      onSuccess();
    } catch {
      toast.error(t('smsInvalid') || 'Invalid code. Please try again.');
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="auth-form">
        <h2>{t('login') || 'Log In'}</h2>

        <input
          id="login-email"
          name="email"
          type="email"
          placeholder={t('email') || 'Email'}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          required
        />

        <div className="password-input-wrapper">
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('password') || 'Password'}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            required
          />
          <span
  className="toggle-password"
  onClick={() => setShowPassword((prev) => !prev)}
  style={{ userSelect: 'none', cursor: 'pointer' }}
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


        <button type="submit" disabled={loading}>
          {loading ? t('loggingIn') || 'Logging in…' : t('login') || 'Log In'}
        </button>

        <div className="auth-separator">{t('or') || 'or'}</div>

        <button
          className="google-btn"
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <img src="/google-icon.png" alt="Google" style={{ width: '20px', marginRight: '8px' }} />
          {t('continueGoogle') || 'Continue with Google'}
        </button>

        <p className="form-footer">
          {t('forgotPassword') || 'Forgot password?'}{' '}
          <span onClick={switchToForgot} className="form-link">
            {t('reset') || 'Reset'}
          </span>
        </p>

        <p className="form-footer">
          {t('noAccount') || 'Don’t have an account?'}{' '}
          <span onClick={switchToRegister} className="form-link">
            {t('signUp') || 'Sign up'}
          </span>
        </p>

        {error && <p className="error-msg">{error}</p>}

        {mfaVisible && (
          <div className="mfa-verification">
            <input
              type="text"
              placeholder={t('enterCode') || 'Enter SMS code'}
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
            />
            <button type="button" onClick={handleVerifySMS}>
              {t('verify') || 'Verify Code'}
            </button>
          </div>
        )}
      </form>

      <div id="recaptcha-container"></div>
    </>
  );
}

export default LoginForm;
