import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/AuthForm.css';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate('/account');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
            navigate('/account');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-page">
            <h2>Sign Up</h2>

            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
                <button type="submit">Sign Up</button>
            </form>
            <div className="auth-separator">or</div>

            <button className="google-btn" onClick={handleGoogleSignup}>
                <img src="/google-icon.png" alt="Google" style={{ width: '20px', height: '20px' }} />
                Continue with Google
            </button>


            <p>Already have an account? <Link className="auth-link" to="/login">Sign in</Link></p>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <p>
                By signing up, you agree to our <Link className="auth-link" to="/terms">Terms of Service</Link> and <Link className="auth-link" to="/privacy">Privacy Policy</Link>.        </p>
        </div>

    );
}

export default Register;
