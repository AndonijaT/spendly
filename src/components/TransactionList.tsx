import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/TransactionList.css';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  method: 'cash' | 'card';
  category: string;
  amount: number;
  timestamp?: { seconds: number };
}

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);

  const fetchTransactions = async (userId: string) => {
    try {
      const q = query(
        collection(db, 'users', userId, 'transactions'),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const items: Transaction[] = [];
      let total = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Transaction, 'id'>;
        const amount = Number(data.amount);
        if (data.type === 'income') total += amount;
        else total -= amount;

        items.push({ id: doc.id, ...data });
      });

      setTransactions(items);
      setBalance(total);
    } catch (err) {
      console.error("🚨 Error fetching transactions:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchTransactions(user.uid);
      } else {
        console.log("❌ User not logged in");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    const user = auth.currentUser;
    if (user) {
      fetchTransactions(user.uid);
    }
  };

  return (
    <div className="transaction-list">
      <div className="balance-header">
        <h2>Balance: {balance.toFixed(2)} €</h2>
        <button className="refresh-btn" onClick={handleRefresh} title="Refresh list">🔄</button>
      </div>
      <ul>
        {transactions.map((tx) => (
          <li key={tx.id} className={tx.type}>
            <span>{tx.category}</span>
            <span>{tx.amount.toFixed(2)} €</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
