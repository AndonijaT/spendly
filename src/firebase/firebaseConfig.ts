import {
  onAuthStateChanged,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeApp } from 'firebase/app'; // ⬅️ You need this

// ✅ Your new Firebase project config
const firebaseConfig = {
  apiKey: 'AIzaSyBuOqk6uiUNynIvVw3zu8ZpyBtJZj-wjAE',
  authDomain: 'spendly-971fa.firebaseapp.com',
  projectId: 'spendly-971fa',
  storageBucket: 'spendly-971fa.appspot.com', // 🔧 fixed typo (was .firebasestorage.app — invalid)
  messagingSenderId: '715487572745',
  appId: '1:715487572745:web:3c809dd75e5931e6bed9d8',
  measurementId: 'G-2YN0LZSBR7',
};
const app = initializeApp(firebaseConfig); // ⬅️ This was missing


export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);



// ✅ Auth (with session persistence)

// ✅ Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Auth hook for current user
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
