// src/components/ForgotPasswordForm.tsx
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Reset link sent. Check your inbox.');
      setSent(true);
    } catch (err: any) {
      toast.error('Failed to send reset email.');
    }
  };

  return (
    <div className="auth-form">
      <h2>Reset Password</h2>
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button onClick={handleReset}>Send Reset Link</button>
      {sent && <p className="info-msg">Email sent. Check your inbox.</p>}
      <p className="form-footer">
        <span className="form-link" onClick={onBack}>Back to login</span>
      </p>
    </div>
  );
}

export default ForgotPasswordForm;
