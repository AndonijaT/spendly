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

export default function TransactionHistory({
  onClose,
  viewMode = 'shared', // default fallback
}: {
  onClose?: () => void;
  viewMode?: 'personal' | 'shared';
}) 
 {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [uidToEmail, setUidToEmail] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTransactions = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const allUIDs = [user.uid];

if (viewMode === 'shared') {
  try {
    const userDocs = await getDocs(collection(db, 'users'));
    userDocs.forEach((doc) => {
      const sharedWith = doc.data().sharedWith || [];
      const docUid = doc.id;

      if (sharedWith.includes(user.uid) && !allUIDs.includes(docUid)) {
        allUIDs.push(docUid);
      }

      if (docUid === user.uid && Array.isArray(sharedWith)) {
        sharedWith.forEach((uid: string) => {
          if (!allUIDs.includes(uid)) allUIDs.push(uid);
        });
      }
    });

    const emailMap: Record<string, string> = {};
    userDocs.forEach((doc) => {
      const email = doc.data().email;
      if (email) emailMap[doc.id] = email;
    });
    setUidToEmail(emailMap);
  } catch (err) {
    console.error("Error fetching shared users:", err);
  }
}


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
    <div className={onClose ? 'modal-backdrop fade-in' : 'history-page'}>
      <div className="history-panel">
        <h2>Transaction History</h2>
        <ul className="transaction-list">
          {transactions.map((tx) => (
            <li key={tx.id} className={`transaction-item ${tx.type}`}>
              <div className="transaction-left">
                <div className="transaction-category">
                  <strong>{tx.category}</strong>
                </div>
                {tx.description && (
                  <div className="transaction-description">{tx.description}</div>
                )}
                <div className="transaction-meta">
                  <span className="transaction-date">{formatDate(tx.timestamp)}</span>
                  {tx.ownerUid !== auth.currentUser?.uid && (
                    <span className="transaction-shared">
                      Shared by: {uidToEmail[tx.ownerUid!] || 'Another user'}
                    </span>
                  )}
                </div>
              </div>
              <div className={`transaction-amount ${tx.type}`}>
                {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} €
              </div>
            </li>
          ))}
        </ul>
        {onClose && (
          <button className="close-modal" onClick={onClose}>
            × Close
          </button>
        )}
      </div>
    </div>
  );
}
