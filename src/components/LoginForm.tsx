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

function LoginForm({
  onSuccess,
  switchToRegister,
  switchToForgot,
}: {
  onSuccess: () => void;
  switchToRegister: () => void;
  switchToForgot: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resolver, setResolver] = useState<any>(null);
  const [verificationId, setVerificationId] = useState('');
  const [mfaVisible, setMfaVisible] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.recaptchaVerifier && typeof window !== 'undefined') {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
      });

      window.recaptchaVerifier.render().catch((err) => {
        console.error('Failed to render reCAPTCHA:', err);
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      if (!userCred.user.emailVerified) {
        toast.warn('Email not verified. Please check your inbox.');
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

          const phoneProvider = new PhoneAuthProvider(auth);
          const verificationId = await phoneProvider.verifyPhoneNumber(
            phoneInfoOptions,
            window.recaptchaVerifier
          );

          setResolver(resolver);
          setVerificationId(verificationId);
          setMfaVisible(true);
          return;
        } catch {
          toast.error('Failed to send SMS verification code.');
          return;
        }
      }

      if (code === 'auth/network-request-failed') {
        toast.warning('Network issue. Retrying...');
        setTimeout(() => handleLogin(e), 2000);
        return;
      }

      switch (code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Incorrect email or password.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Try again later.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format.');
          break;
        case 'auth/internal-error':
          setError('An internal error occurred. Please try again.');
          break;
        default:
          console.error('[Unhandled Firebase Error]', err);
          setError('Login failed. Please check your credentials.');
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
        toast.warn('Google account is not verified. Please verify your email.');
        await auth.signOut();
        return;
      }

      onSuccess();
    } catch (err: any) {
      switch (err.code) {
        case 'auth/popup-blocked':
        case 'auth/popup-closed-by-user':
          toast.info('Popup blocked. Switching to redirect login...');
          await signInWithRedirect(auth, provider);
          break;
        case 'auth/account-exists-with-different-credential':
          setError('Account already exists with this email using another login method.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid Google credentials. Try again.');
          break;
        default:
          console.error('[Google Login Error]', err.code);
          setError('Google sign-in failed. Please try again.');
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
        toast.error('Please verify your email before logging in.');
        return;
      }

      toast.success('Verification successful.');
      setMfaVisible(false);
      onSuccess();
    } catch {
      toast.error('Invalid code. Please try again.');
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="auth-form">
        <h2>Log In</h2>

        <input
          id="login-email"
          name="email"
          type="email"
          placeholder="Email"
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          required
        />

        <input
          id="login-password"
          name="password"
          type="password"
          placeholder="Password"
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>

        <div className="auth-separator">or</div>

        <button
          className="google-btn"
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <img src="/google-icon.png" alt="Google" style={{ width: '20px', marginRight: '8px' }} />
          Continue with Google
        </button>

        <p className="form-footer">
          Forgot password?{' '}
          <span onClick={switchToForgot} className="form-link">
            Reset
          </span>
        </p>

        <p className="form-footer">
          Don’t have an account?{' '}
          <span onClick={switchToRegister} className="form-link">
            Sign up
          </span>
        </p>

        {error && <p className="error-msg">{error}</p>}

        {mfaVisible && (
          <div className="mfa-verification">
            <input
              type="text"
              placeholder="Enter SMS code"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
            />
            <button type="button" onClick={handleVerifySMS}>
              Verify Code
            </button>
          </div>
        )}
      </form>

      <div id="recaptcha-container"></div>
    </>
  );
}

export default LoginForm;
