// src/components/LoginForm.tsx
import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getMultiFactorResolver,
  RecaptchaVerifier,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';

function LoginForm({ onSuccess, switchToRegister, switchToForgot, }: { onSuccess: () => void; switchToRegister: () => void;   switchToForgot: () => void; }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    if (err.code === 'auth/multi-factor-auth-required') {
      const resolver = getMultiFactorResolver(auth, err);
      const recaptcha = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });

      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[0],
        session: resolver.session,
      };

      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(phoneInfoOptions, recaptcha);
      const code = prompt('Enter SMS code:');
      const cred = PhoneAuthProvider.credential(verificationId, code!);
      const assertion = PhoneMultiFactorGenerator.assertion(cred);
      const userCred = await resolver.resolveSignIn(assertion);

      if (!userCred.user.emailVerified) {
        await auth.signOut();
        toast.error("Please verify your email before logging in.");
        return;
      }

      onSuccess();
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

  return (
    <form onSubmit={handleLogin} className="auth-form">
      <h2>Log In</h2>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Log In</button>

      <div className="auth-separator">or</div>

      <button className="google-btn" type="button" onClick={handleGoogleLogin}>
        <img src="/google-icon.png" alt="Google" style={{ width: '20px', marginRight: '8px' }} />
        Continue with Google
      </button>

<p className="form-footer">
  Forgot password?{' '}
  <span onClick={switchToForgot} className="form-link">Reset</span>
</p>






      <p className="form-footer">
        Don’t have an account?{' '}
        <span onClick={switchToRegister} className="form-link">Sign up</span>
      </p>

      {error && <p className="error-msg">{error}</p>}
      <div id="recaptcha-container" style={{ display: 'none' }}></div>
    </form>
  );
}

export default LoginForm;
