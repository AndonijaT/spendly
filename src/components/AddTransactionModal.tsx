import { useState, useEffect } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../styles/AddTransactionModal.css';
import { useLanguage } from '../context/LanguageContext';
import { getDocs } from 'firebase/firestore';

const categories = [
  "groceries", "home", "eating out", "food delivery", "coffee", "car", "health",
  "sport", "subscriptions", "tech", "entertainment", "personal", "clothing", "gifts",
  "education", "business", "charity", "pets"
];

export default function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [method, setMethod] = useState<'cash' | 'card'>('cash');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'to_cash' | 'to_card'>('to_cash');
  const { t } = useLanguage();
  const [description, setDescription] = useState('');
const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error(t('userNotLoggedIn'));

    try {
      const payload: any = {
        type,
        amount: parseFloat(amount),
        timestamp: serverTimestamp(),
        description: description.trim(),
      };

      if (type === 'income' || type === 'expense') {
        payload.method = method;
        payload.category = category;
      }

      if (type === 'transfer') {
        payload.direction = direction;
      }
if (type === 'expense') {
  const amt = parseFloat(amount);
  if (method === 'cash' && amt > currentCash) {
    setErrorMessage('🚨 Balance too low! Not enough cash.');
    return;
  }
  if (method === 'card' && amt > currentCard) {
    setErrorMessage('🚨 Balance too low! Not enough card balance.');
    return;
  }
}

      await addDoc(collection(db, 'users', user.uid, 'transactions'), payload);

      toast.success(t('transactionAdded'));
      onClose();
    } catch (err) {
      toast.error(t('errorSaving'));
      console.error(err);
    }
  };
const [currentCash, setCurrentCash] = useState(0);
const [currentCard, setCurrentCard] = useState(0);

useEffect(() => {
  const fetchBalances = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await getDocs(collection(db, 'users', user.uid, 'transactions'));
    let cash = 0;
    let card = 0;

    snapshot.forEach((doc) => {
      const tx = doc.data();
      const amt = Number(tx.amount);
      if (tx.type === 'income') {
        if (tx.method === 'cash') cash += amt;
        if (tx.method === 'card') card += amt;
      } else if (tx.type === 'expense') {
        if (tx.method === 'cash') cash -= amt;
        if (tx.method === 'card') card -= amt;
      } else if (tx.type === 'transfer') {
        if (tx.direction === 'to_cash') {
          card -= amt;
          cash += amt;
        } else if (tx.direction === 'to_card') {
          cash -= amt;
          card += amt;
        }
      }
    });

    setCurrentCash(cash);
    setCurrentCard(card);
  };

  fetchBalances();
}, []);

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>{t('addTransaction')}</h2>

        <div className="type-toggle">
          <button className={type === 'expense' ? 'active' : ''} onClick={() => setType('expense')}>
            {t('expense')}
          </button>
          <button className={type === 'income' ? 'active' : ''} onClick={() => setType('income')}>
            {t('income')}
          </button>
          <button className={type === 'transfer' ? 'active' : ''} onClick={() => setType('transfer')}>
            🔄 {t('transfer') || 'Transfer'}
          </button>
        </div>
{errorMessage && (
  <div className="error-warning">{errorMessage}</div>
)}

        <form onSubmit={handleSubmit}>
          {type !== 'transfer' && (
            <label>{t('method')}:
              <select value={method} onChange={(e) => setMethod(e.target.value as 'cash' | 'card')}>
                <option value="cash">{t('cash')}</option>
                <option value="card">{t('card')}</option>
              </select>
            </label>
          )}

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

          {type === 'transfer' && (
            <label>{t('direction') || 'Transfer direction'}:
              <select value={direction} onChange={(e) => setDirection(e.target.value as 'to_cash' | 'to_card')}>
                <option value="to_cash">💶 Card → Cash</option>
                <option value="to_card">💳 Cash → Card</option>
              </select>
            </label>
          )}

          <label>{t('amount')}:
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>

          <label>{t('description')} ({t('optional')}):
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. grocery trip, salary, or cash transfer"
              rows={2}
            />
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
