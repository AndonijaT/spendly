import { useState } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../styles/AddTransactionModal.css';
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error(t('userNotLoggedIn'));

    try {
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        type,
        method,
        category,
        amount: parseFloat(amount),
        timestamp: serverTimestamp(),
      });
      toast.success(t('transactionAdded'));
      onClose();
    } catch (err) {
      toast.error(t('errorSaving'));
      console.error(err);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>{t('addTransaction')}</h2>

        <div className="type-toggle">
          <button
            className={type === 'expense' ? 'active' : ''}
            onClick={() => setType('expense')}
          >
            {t('expense')}
          </button>
          <button
            className={type === 'income' ? 'active' : ''}
            onClick={() => setType('income')}
          >
            {t('income')}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>{t('method')}:
            <select value={method} onChange={(e) => setMethod(e.target.value as 'cash' | 'card')}>
              <option value="cash">{t('cash')}</option>
              <option value="card">{t('card')}</option>
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
                  <span>{t(cat)}</span>
                </div>
              ))}
            </div>
          )}

          {type === 'income' && (
            <label>{t('source')}:
              <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">{t('choose')}</option>
                <option value="salary">{t('salary')}</option>
                <option value="scholarship">{t('scholarship')}</option>
                <option value="donation">{t('donation')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </label>
          )}

          <label>{t('amount')}:
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>

          <div className="form-buttons">
            <button type="submit">{t('add')}</button>
            <button type="button" onClick={onClose} className="cancel">{t('cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
