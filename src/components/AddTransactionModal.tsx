import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../styles/AddTransactionModal.css';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

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
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const { currency, getSymbol } = useCurrency();
  const [currentCash, setCurrentCash] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);

  const scrollCategory = (dir: -1 | 1) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  useEffect(() => {
  const fetchBalances = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const allUIDs = [user.uid];

  // Get shared users (same logic as Dashboard)
  const usersSnap = await getDocs(collection(db, 'users'));
  usersSnap.forEach((doc) => {
    const sharedWith = doc.data().sharedWith || [];
    const docUid = doc.id;

    if (sharedWith.includes(user.uid) && !allUIDs.includes(docUid)) {
      allUIDs.push(docUid);
    }

    if (user.uid === docUid && Array.isArray(sharedWith)) {
      sharedWith.forEach((uid: string) => {
        if (!allUIDs.includes(uid)) {
          allUIDs.push(uid);
        }
      });
    }
  });

  let cash = 0;
  let card = 0;

  for (const uid of allUIDs) {
    const snapshot = await getDocs(collection(db, 'users', uid, 'transactions'));
    snapshot.forEach((doc) => {
      const tx = doc.data();
      if (tx.currency !== currency) return;

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
  }

  setCurrentCash(cash);
  setCurrentCard(card);
};


    fetchBalances();
  }, [currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error(t('userNotLoggedIn'));

    try {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) {
        setErrorMessage(t('invalidAmount') || '🚨 Please enter a valid amount greater than 0.');
        return;
      }

      const payload: any = {
        type,
        amount: amt,
        timestamp: serverTimestamp(),
        description: description.trim(),
        currency,
      };

      if (type === 'income' || type === 'expense') {
        payload.method = method;
        payload.category = category;
      }

      if (type === 'transfer') {
        payload.direction = direction;
      }

      if (type === 'expense') {
        if (method === 'cash' && amt > currentCash) {
          setErrorMessage(t('notEnoughCash') || '🚨 Balance too low! Not enough cash.');
          return;
        }
        if (method === 'card' && amt > currentCard) {
          setErrorMessage(t('notEnoughCard') || '🚨 Balance too low! Not enough card balance.');
          return;
        }
      }

      if (type === 'transfer') {
        if (direction === 'to_card' && amt > currentCash) {
          setErrorMessage(t('transferNotEnoughCash') || '🚨 Cannot transfer. Not enough cash balance.');
          return;
        }
        if (direction === 'to_cash' && amt > currentCard) {
          setErrorMessage(t('transferNotEnoughCard') || '🚨 Cannot transfer. Not enough card balance.');
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
            🔄 {t('transfer')}
          </button>
        </div>

        {errorMessage && <div className="error-warning">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          {type !== 'transfer' && (
            <div className="method-toggle">
              <label>{t('method')}:</label>
              <div className="method-buttons">
                <button type="button" className={method === 'cash' ? 'active' : ''} onClick={() => setMethod('cash')}>
                  {t('cash')}
                </button>
                <button type="button" className={method === 'card' ? 'active' : ''} onClick={() => setMethod('card')}>
                  {t('card')}
                </button>
              </div>
            </div>
          )}

          {type === 'expense' && (
            <>
              <label style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{t('category')}:</label>
              <div className="category-carousel-wrapper">
                <button type="button" className="carousel-arrow left" onClick={() => scrollCategory(-1)}>‹</button>
                <div className="category-carousel" ref={carouselRef}>
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
                <button type="button" className="carousel-arrow right" onClick={() => scrollCategory(1)}>›</button>
              </div>
            </>
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
            <label>{t('direction')}:
              <select value={direction} onChange={(e) => setDirection(e.target.value as 'to_cash' | 'to_card')}>
                <option value="to_cash">💶 {t('cardToCash') || 'Card → Cash'}</option>
                <option value="to_card">💳 {t('cashToCard') || 'Cash → Card'}</option>
              </select>
            </label>
          )}

          <label>{t('amount')} ({getSymbol()}):
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
