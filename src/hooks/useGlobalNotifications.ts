import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  onSnapshot,
  collection,
  query,
  orderBy,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';

export default function useGlobalNotifications() {
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      const q = query(notificationsRef, orderBy('timestamp', 'desc'));

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const id = change.doc.id;

            // Skip if already dismissed
            if (data.dismissed) return;

            let toastFn = toast.info;
            let message = data.message || '';

            if (data.type === 'invite_response') {
              message = `📬 ${data.fromEmail} ${data.status} your invite.`;
              toastFn = toast.info;
            } else if (data.type === 'invite-accepted') {
              toastFn = toast.success;
            } else if (data.type === 'invite-declined') {
              toastFn = toast.error;
            }

            //  toast with dismiss handler
            toastFn(message, {
              toastId: id,
              onClose: async () => {
                try {
                  const docRef = doc(db, 'users', user.uid, 'notifications', id);
                  await updateDoc(docRef, { dismissed: true });
                } catch (err) {
                  console.error('❌ Failed to update dismissed status:', err);
                }
              },
            });
          }
        });
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);
}
