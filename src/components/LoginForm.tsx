import { useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    getMultiFactorResolver,
    PhoneAuthProvider,
    PhoneMultiFactorGenerator,
    RecaptchaVerifier
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
    const [isLoading, setIsLoading] = useState(false);

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
      await auth.signOut();
      toast.error('Please verify your email before logging in.');
      return;
    }

    onSuccess(); // 🎉
  } catch (err: any) {
    // MFA flow
    if (err.code === 'auth/multi-factor-auth-required') {
      setError('');
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
      } catch (verifyErr: any) {
        toast.error('Failed to send SMS verification code.');
        return;
      }
    }

    // Soft catch for network failure
    if (err.code === 'auth/network-request-failed') {
      console.warn('[Network] Firebase login delayed:', err.message);
      toast.warning('Network slow… retrying silently.');

      // Retry silently after delay
      setTimeout(() => handleLogin(e), 2000);
      return;
    }

    setError(err.message); // Other real errors
  } finally {
    setLoading(false);
  }
};



    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
            onSuccess();
        } catch (err: any) {
            setError(err.message);
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

            toast.success('MFA verification successful');
            setMfaVisible(false);
            onSuccess();
        } catch (err: any) {
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in…' : 'Log In'}
                </button>


                <div className="auth-separator">or</div>

                <button className="google-btn" type="button" onClick={handleGoogleLogin} disabled={loading}>
                    <img
                        src="/google-icon.png"
                        alt="Google"
                        style={{ width: '20px', marginRight: '8px' }}
                    />
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
