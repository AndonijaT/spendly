import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA0WIq67lltQMsI6baO1pvcSCNVErvt2HQ",
  authDomain: "spendly-f30b5.firebaseapp.com",
  projectId: "spendly-f30b5",
  storageBucket: "spendly-f30b5.firebasestorage.app",
  messagingSenderId: "991569579968",
  appId: "1:991569579968:web:49c2f7ec8f8c0342084225",
  measurementId: "G-RE9KL0NLMD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

export function useAuth() {
  const [user, setUser] = useState<null | any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}