// src/components/LoginForm.tsx
import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

function LoginForm({
  onSuccess,
  switchToRegister,
}: {
  onSuccess: () => void;
  switchToRegister: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
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
        Don’t have an account?{' '}
        <span onClick={switchToRegister} className="form-link">
          Sign up
        </span>
      </p>

      {error && <p className="error-msg">{error}</p>}
    </form>
  );
}

export default LoginForm;
