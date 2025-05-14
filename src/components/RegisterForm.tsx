// src/components/RegisterForm.tsx
import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

function RegisterForm({
  onSuccess,
  switchToLogin,
}: {
  onSuccess: () => void;
  switchToLogin: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSignup} className="auth-form">
      <h2>Sign Up</h2>
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
      <button type="submit">Sign Up</button>

      <div className="auth-separator">or</div>

      <button className="google-btn" type="button" onClick={handleGoogleSignup}>
        <img
          src="/google-icon.png"
          alt="Google"
          style={{ width: '20px', marginRight: '8px' }}
        />
        Continue with Google
      </button>

      <p className="form-footer">
        Already have an account?{' '}
        <span onClick={switchToLogin} className="form-link">
          Sign in
        </span>
      </p>

      {error && <p className="error-msg">{error}</p>}
    </form>
  );
}

export default RegisterForm;
