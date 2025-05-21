import { useState } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify'; // opcijsko za feedback
import '../styles/AddTransactionModal.css'; // opcijsko za stilizacijo

export default function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [method, setMethod] = useState<'cash' | 'card'>('cash');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Uporabnik:", auth.currentUser);
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      toast.error("Uporabnik ni prijavljen.");
      return;
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type,
        method,
        category,
        amount: parseFloat(amount),
        timestamp: serverTimestamp()
      });

      toast.success("Transakcija dodana!");
      onClose();
    } catch (error) {
      console.error("Napaka pri dodajanju:", error.message,error);
      toast.error("Napaka pri shranjevanju transakcije.");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Dodaj transakcijo</h2>
        <form onSubmit={handleSubmit}>
          <label>Tip:
            <select value={type} onChange={(e) => setType(e.target.value as 'income' | 'expense')}>
              <option value="expense">Strošek</option>
              <option value="income">Prihodek</option>
            </select>
          </label>

          <label>Način:
            <select value={method} onChange={(e) => setMethod(e.target.value as 'cash' | 'card')}>
              <option value="cash">Gotovina</option>
              <option value="card">Kartica</option>
            </select>
          </label>

          <label>Kategorija:
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required />
          </label>

          <label>Znesek (€):
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>

          <button type="submit">Dodaj</button>
          <button type="button" onClick={onClose}>Prekliči</button>
        </form>
      </div>
    </div>
  );
}
