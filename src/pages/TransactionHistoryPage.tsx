import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  timestamp: { seconds: number };
};


export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDocs(collection(db, 'users', user.uid, 'transactions'));
      const data: Transaction[] = [];
      snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds));
    };
    fetch();
  }, []);

  return (
    <div style={{ 
  fontFamily: 'Segoe UI, sans-serif', padding: '2rem', maxWidth: '900px', margin: 'auto' }}>
      <h2>All Transactions</h2>
     <ul style={{ padding: 0, listStyle: 'none' }}>
  {transactions.map((tx) => {
    const date = new Date(tx.timestamp.seconds * 1000).toLocaleString();

    return (
      <li key={tx.id} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        padding: '0.75rem 1rem',
        margin: '0.5rem 0',
        borderLeft: `5px solid ${tx.type === 'income' ? '#4caf50' : '#f44336'}`,
        background: '#fdfdfd',
        borderRadius: '6px'
      }}>
        <div style={{ fontWeight: 600 }}>{tx.category}</div>
        {tx.description && (
          <div style={{ fontSize: '0.95rem', color: '#666' }}>
            {tx.description}
          </div>
        )}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.95rem',
          color: '#444'
        }}>
          <span>{date}</span>
          <span>
            {tx.type === 'income' ? '+' : '-'}
            {tx.amount.toFixed(2)} €
          </span>
        </div>
      </li>
    );
  })}
</ul>

    </div>
  );
}
