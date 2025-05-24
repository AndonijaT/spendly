import { useEffect } from 'react';
import { getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AuthHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          toast.success('Signed in successfully!');
          navigate('/dashboard');
        }
      })
      .catch((err) => {
        console.error('[Redirect Error]', err.code, err.message);
      });
  }, []);

  return null;
};

export default AuthHandler;