import { useState } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import './/../styles/AddTransactionModal.css';

const categories = [
  "groceries", "home", "eating out", "food delivery", "coffee", "car", "health",
  "sport", "subscriptions", "tech", "entertainment", "personal", "clothing", "gifts",
  "education", "business", "charity", "pets"
];

export default function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [method, setMethod] = useState<'cash' | 'card'>('cash');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error("Ni prijavljenega uporabnika");

    try {
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type,
        method,
        category,
        amount: parseFloat(amount),
        timestamp: serverTimestamp(),
      });
      toast.success("Transakcija dodana!");
      onClose();
    } catch (err) {
      toast.error("Napaka pri shranjevanju.");
      console.error(err);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>Dodaj transakcijo</h2>

        <div className="type-toggle">
          <button
            className={type === 'expense' ? 'active' : ''}
            onClick={() => setType('expense')}
          >
            Strošek
          </button>
          <button
            className={type === 'income' ? 'active' : ''}
            onClick={() => setType('income')}
          >
            Prihodek
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Način:
            <select value={method} onChange={(e) => setMethod(e.target.value as 'cash' | 'card')}>
              <option value="cash">Gotovina</option>
              <option value="card">Kartica</option>
            </select>
          </label>

          {type === 'expense' && (
            <div className="category-grid">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className={`category-item ${category === cat ? 'selected' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  <img src={`/categories/${cat.replace(/ /g, '_')}.png`} alt={cat} />
                  <span>{cat}</span>
                </div>
              ))}
            </div>
          )}

          {type === 'income' && (
            <label>Vir:
              <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">Izberi</option>
                <option value="plača">Plača</option>
                <option value="štipendija">Štipendija</option>
                <option value="donacija">Donacija</option>
                <option value="drugo">Drugo</option>
              </select>
            </label>
          )}

          <label>Znesek (€):
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>

          <div className="form-buttons">
            <button type="submit">Dodaj</button>
            <button type="button" onClick={onClose} className="cancel">Prekliči</button>
          </div>
        </form>
      </div>
    </div>
  );
}
