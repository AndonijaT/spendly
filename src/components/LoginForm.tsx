// src/components/LoginForm.tsx
import { useState } from 'react';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    getMultiFactorResolver,
    PhoneAuthProvider,
    PhoneMultiFactorGenerator
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import './../styles/LoginForm.css';
import { RecaptchaVerifier } from 'firebase/auth';
import { RecaptchaVerifier as ModularRecaptchaVerifier, type Auth } from 'firebase/auth';

function LoginForm({ onSuccess, switchToRegister, switchToForgot, }: { onSuccess: () => void; switchToRegister: () => void; switchToForgot: () => void; }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [resolver, setResolver] = useState<any>(null);
    const [verificationId, setVerificationId] = useState('');
    const [mfaVisible, setMfaVisible] = useState(false);
    const [smsCode, setSmsCode] = useState('');
    console.log('typeof RecaptchaVerifier:', RecaptchaVerifier.length);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);

            if (!userCred.user.emailVerified) {
                await auth.signOut();
                setError('');
                toast.error("Please verify your email before logging in.");
                return;
            }

            onSuccess();
        } catch (err: any) {
            console.log(auth);

            if (err.code === 'auth/multi-factor-auth-required') {
                try {
                    const resolver = getMultiFactorResolver(auth, err);
                    
                    
                    if (window.recaptchaVerifier) {
                            window.recaptchaVerifier.clear?.(); // Clear if already exists
                            window.recaptchaVerifier = undefined;
                        }

                    
                    const recaptcha = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });

                    await recaptcha.render(); // ✅ ensures reCAPTCHA is injected into DOM

                    const phoneInfoOptions = {
                        multiFactorHint: resolver.hints[0],
                        session: resolver.session,
                    };

                    const phoneProvider = new PhoneAuthProvider(auth);
                    const verificationId = await phoneProvider.verifyPhoneNumber(phoneInfoOptions, recaptcha);

                    setResolver(resolver);
                    setVerificationId(verificationId);
                    setMfaVisible(true); // show custom input modal
                } catch (err: any) {
                    console.error(err)
                    toast.error('Failed to send SMS verification code.');
                }
            } else {
                setError(err.message);
            }
        }
    };


    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
            onSuccess();
        } catch (err: any) {
            setError(err.message);
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
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Log In</button>

      <div className="auth-separator">or</div>

      <button className="google-btn" type="button" onClick={handleGoogleLogin}>
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

      {/* ✅ MFA SMS input */}
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

    {/* ✅ reCAPTCHA must stay outside form */}
    <div id="recaptcha-container"></div>
  </>
);


}

export default LoginForm;
