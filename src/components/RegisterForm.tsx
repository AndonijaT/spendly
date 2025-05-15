// src/components/RegisterForm.tsx
import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
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

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCred.user, { displayName: name });
    await sendEmailVerification(userCred.user);
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
};

  return (
    <form onSubmit={handleSignup} className="auth-form">
      <h2>Sign Up</h2>
      <input type="text" placeholder="Full Name" onChange={(e) => setName(e.target.value)} required />
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Sign Up</button>

      <div className="auth-separator">or</div>

      <p className="form-footer">
        Already have an account?{' '}
        <span onClick={switchToLogin} className="form-link">Sign in</span>
      </p>
    </form>
  );
}

export default RegisterForm;
