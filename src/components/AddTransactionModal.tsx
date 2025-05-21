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
    if (!user) return toast.error("User not logged in");

    try {
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type,
        method,
        category,
        amount: parseFloat(amount),
        timestamp: serverTimestamp(),
      });
      toast.success("Transaction added!");
      onClose();
    } catch (err) {
      toast.error("Error saving.");
      console.error(err);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>Add transaction</h2>

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
          <label>Method:
            <select value={method} onChange={(e) => setMethod(e.target.value as 'cash' | 'card')}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
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
            <label>Source:
              <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">Choose</option>
                <option value="salary">Salary</option>
                <option value="scholarship">Scholarship</option>
                <option value="donation">Donation</option>
                <option value="other">Other</option>
              </select>
            </label>
          )}

          <label>Amount (€):
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>

          <div className="form-buttons">
            <button type="submit">Add</button>
            <button type="button" onClick={onClose} className="cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
