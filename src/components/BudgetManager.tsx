import { useState, useRef, useEffect, useMemo } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import '../styles/BudgetManager.css';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

type Budget = {
  id: string;
  category: string;
  limit: number;
  currency: string;
  type: 'expense' | 'income';
};

type Transaction = {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
};

export default function BudgetManager({
  budgets,
  transactions,
  onRefresh,
  onOverrunDetected,
}: {
  budgets: Budget[];
  transactions: Transaction[];
  onRefresh: () => void;
  onOverrunDetected?: (msg: string, category: string) => void;
}) {
  const { currency: appCurrency, getSymbol } = useCurrency();
  const { t } = useLanguage();

  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [currency, setCurrency] = useState<'EUR' | 'USD'>(appCurrency as 'EUR' | 'USD');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setCategory('');
    setLimit('');
    setCurrency(appCurrency as 'EUR' | 'USD');
    setEditingId(null);
  };

  const formRef = useRef<HTMLDivElement>(null);

  const startEditBudget = (b: Budget) => {
    setCategory(b.category);
    setLimit(b.limit.toString());
    setCurrency(b.currency as 'EUR' | 'USD');
    setEditingId(b.id);
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteBudget = async (b: Budget) => {
    const user = auth.currentUser;
    if (!user) return;

    if (!window.confirm(`${t('confirmDeleteBudget') || 'Delete budget for'} ${b.category}?`)) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'budgets', b.id));
      toast.success(`${t('deletedBudget') || 'Deleted'} ${b.category}`);
      onRefresh();
    } catch (err) {
      toast.error(t('deleteBudgetFailed') || 'Failed to delete budget');
      console.error(err);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !category || !limit) {
      toast.error(t('fillAllFields') || 'Fill all fields');
      return;
    }

    try {
      const data = {
        category,
        limit: Number(limit),
        currency,
        type: 'expense',
        month: format(new Date(), 'yyyy-MM')
      };

      if (editingId) {
        await updateDoc(doc(db, 'users', user.uid, 'budgets', editingId), data);
        toast.success(`${t('updateBudget') || 'Updated'} ${category}`);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'budgets'), data);
        toast.success(`${t('submitBudget') || 'Added'} ${category}`);
      }

      resetForm();
      onRefresh();
    } catch (err) {
      toast.error(t('saveFailed') || 'Save failed');
      console.error(err);
    }
  };

  const budgetProgress = useMemo(() => {
    return budgets.map((b) => {
      const spent = transactions
        .filter((tx) => tx.type === b.type && tx.category === b.category)
        .reduce((sum, tx) => sum + tx.amount, 0);

      const rawPercent = (spent / b.limit) * 100;
      const percent = Math.min(rawPercent, 100);

      let warningLevel: 'none' | 'mid' | 'high' | 'over' = 'none';
      if (rawPercent >= 100) warningLevel = 'over';
      else if (rawPercent >= 75) warningLevel = 'high';
      else if (rawPercent >= 50) warningLevel = 'mid';

      return { ...b, spent, percent, rawPercent, warningLevel };
    });
  }, [budgets, transactions]);

  useEffect(() => {
    const nowMonth = format(new Date(), 'yyyy-MM');
    budgetProgress.forEach((bp) => {
      if (bp.warningLevel === 'over') {
        const key = `dismissed_${bp.category}_${nowMonth}`;
        if (!localStorage.getItem(key) && onOverrunDetected) {
          const msg = `${bp.category} over by ${(bp.spent - bp.limit).toFixed(2)} ${bp.currency}`;
          onOverrunDetected(msg, bp.category);
        }
      }
    });
  }, [budgetProgress, onOverrunDetected]);

  return (
    <div className="budget-manager-section">
      <h3>{t('budgetsTitle') || 'Budgets'}</h3>

      {budgetProgress.map((bp) => (
        <div key={bp.id} className={`budget-bar ${bp.warningLevel}`}>
          <div className="label">
            <strong>{bp.category}:</strong> {bp.spent.toFixed(2)} / {bp.limit.toFixed(2)} {getSymbol()}

            <span className="budget-actions">
              <button onClick={() => startEditBudget(bp)}>✏️</button>
              <button onClick={() => handleDeleteBudget(bp)}>🗑️</button>
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress"
              style={{
                width: `${bp.percent}%`,
                backgroundColor:
                  bp.warningLevel === 'over'
                    ? '#c62828'
                    : bp.warningLevel === 'high'
                      ? '#ff9800'
                      : bp.warningLevel === 'mid'
                        ? '#fbc02d'
                        : '#d2b109',
              }}
            />
          </div>
          {bp.warningLevel !== 'none' && (
            <p className="warning-text">
              {bp.warningLevel === 'over'
                ? t('overBudget') || '🚨 Over budget!'
                : `${t('percentUsed') || '⚠️ Used'}: ${bp.rawPercent.toFixed(0)}%`}
            </p>
          )}
        </div>
      ))}

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="add-budget-toggle">
          {t('addBudgetButton') || '➕ Add Budget'}
        </button>
      )}

      {showForm && (
        <div className="budget-form-wrapper" ref={formRef}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="budget-form-inline"
          >
            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">{t('selectCategory') || '-- Select Category --'}</option>
              <option value="groceries">{t('groceries') || 'Groceries'}</option>
              <option value="home">{t('home') || 'Home'}</option>
              <option value="eating out">{t('eating out') || 'Eating Out'}</option>
              <option value="food delivery">{t('food delivery') || 'Food Delivery'}</option>
              <option value="coffee">{t('coffee') || 'Coffee'}</option>
              <option value="car">{t('car') || 'Car'}</option>
              <option value="health">{t('health') || 'Health'}</option>
              <option value="sport">{t('sport') || 'Sport'}</option>
              <option value="subscriptions">{t('subscriptions') || 'Subscriptions'}</option>
              <option value="tech">{t('tech') || 'Tech'}</option>
              <option value="entertainment">{t('entertainment') || 'Entertainment'}</option>
              <option value="personal">{t('personal') || 'Personal'}</option>
              <option value="clothing">{t('clothing') || 'Clothing'}</option>
              <option value="gifts">{t('gifts') || 'Gifts'}</option>
              <option value="education">{t('education') || 'Education'}</option>
              <option value="business">{t('business') || 'Business'}</option>
              <option value="charity">{t('charity') || 'Charity'}</option>
              <option value="pets">{t('pets') || 'Pets'}</option>
            </select>

            <input
              type="number"
              placeholder={t('limit') || 'Limit'}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              required
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit">
                {editingId ? t('updateBudget') || 'Update Budget' : t('submitBudget') || 'Add Budget'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="cancel-btn"
              >
                {t('cancel') || 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
