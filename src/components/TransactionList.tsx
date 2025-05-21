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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("❌ Uporabnik ni prijavljen");
        return;
      }

      console.log("✅ UID uporabnika:", user.uid);

      try {
        const q = query(
          collection(db, 'users', user.uid, 'transactions'),
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

        console.log("🔄 TRANSAKCIJE:", items);
        console.log("💰 BALANCE:", total);

        setTransactions(items);
        setBalance(total);
      } catch (err) {
        console.error("🚨 Napaka pri branju transakcij:", err);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="transaction-list">
      <h2>Stanje: {balance.toFixed(2)} €</h2>
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
