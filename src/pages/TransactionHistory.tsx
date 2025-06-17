import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import '../styles/TransactionList.css';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  method: 'cash' | 'card';
  category: string;
  amount: number;
  description?: string;
  timestamp?: { seconds: number };
  ownerUid?: string;
}

export default function TransactionHistory({ onClose }: { onClose: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [uidToEmail, setUidToEmail] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTransactions = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const allUIDs = [user.uid];

      // fetermine all shared accounts
      try {
        const userDocs = await getDocs(collection(db, 'users'));

        userDocs.forEach((doc) => {
          const sharedWith = doc.data().sharedWith || [];
          const docUid = doc.id;

          // they shared with me
          if (sharedWith.includes(user.uid) && !allUIDs.includes(docUid)) {
            allUIDs.push(docUid);
          }

          // i shared with them
          if (docUid === user.uid && Array.isArray(sharedWith)) {
            sharedWith.forEach((uid: string) => {
              if (!allUIDs.includes(uid)) allUIDs.push(uid);
            });
          }
        });

        // build UID-to-email map
        const emailMap: Record<string, string> = {};
        userDocs.forEach((doc) => {
          const email = doc.data().email;
          if (email) emailMap[doc.id] = email;
        });
        setUidToEmail(emailMap);
      } catch (err) {
        console.error("Error fetching shared users:", err);
      }

      // fetch transactions from all UIDs
      const allData: Transaction[] = [];

      for (const uid of allUIDs) {
        try {
          const q = query(
            collection(db, 'users', uid, 'transactions'),
            orderBy('timestamp', 'desc')
          );
          const snapshot = await getDocs(q);
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.type && data.category && data.amount !== undefined && data.timestamp?.seconds) {
              allData.push({
                id: doc.id,
                type: data.type,
                method: data.method,
                category: data.category,
                amount: data.amount,
                description: data.description,
                timestamp: data.timestamp,
                ownerUid: uid,
              });
            }
          });
        } catch (err) {
          console.error(`Error fetching transactions for ${uid}:`, err);
        }
      }

      // sort and save
      allData.sort((a, b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0));
      setTransactions(allData);
    };

    fetchTransactions();
  }, []);

  const formatDate = (timestamp?: { seconds: number }) => {
    if (!timestamp?.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString('en-GB');
  };

  return (
    <div className="history-backdrop">
      <div className="history-panel">
        <h2>Transaction History</h2>
        <ul>
          {transactions.map((tx) => (
            <li key={tx.id} className={tx.type}>
              <div>
                <strong>{tx.category}</strong>
                {tx.description && (
                  <div className="tx-description">{tx.description}</div>
                )}
                <div className="tx-date">{formatDate(tx.timestamp)}</div>
                {tx.ownerUid !== auth.currentUser?.uid && (
                  <div className="tx-shared">
                    Shared by: {uidToEmail[tx.ownerUid!] || 'Another user'}
                  </div>
                )}
              </div>
              <span>{tx.amount.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
