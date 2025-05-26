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
}


export default function TransactionHistory({ onClose }: { onClose: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'users', user.uid, 'transactions'),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const data: Transaction[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Transaction);
      });

      setTransactions(data);
    };

    fetchTransactions();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString('en-GB'); // UK English format (DD/MM/YYYY, HH:MM)
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
