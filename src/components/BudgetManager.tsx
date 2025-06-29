import { useState } from 'react';
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
import { useRef } from 'react';
import { useEffect } from 'react';
import { useMemo } from 'react';

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
    const [category, setCategory] = useState('');
    const [limit, setLimit] = useState('');
    const [currency, setCurrency] = useState('EUR');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const resetForm = () => {
        setCategory('');
        setLimit('');
        setCurrency('EUR');
        setEditingId(null);
    };



const formRef = useRef<HTMLDivElement>(null);

const startEditBudget = (b: Budget) => {
  setCategory(b.category);
  setLimit(b.limit.toString());
  setCurrency(b.currency);
  setEditingId(b.id);
  setShowForm(true);
  setTimeout(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
};

    const handleDeleteBudget = async (b: Budget) => {
        const user = auth.currentUser;
        if (!user) return;

        if (!window.confirm(`Delete budget for ${b.category}?`)) return;

        try {
            await deleteDoc(doc(db, 'users', user.uid, 'budgets', b.id));
            toast.success(`Deleted ${b.category}`);
            onRefresh();
        } catch (err) {
            toast.error('Failed to delete budget');
            console.error(err);
        }
    };

    const handleSave = async () => {
        const user = auth.currentUser;
        if (!user || !category || !limit) {
            toast.error('Fill all fields');
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
                toast.success(`Updated ${category}`);
            } else {
                await addDoc(collection(db, 'users', user.uid, 'budgets'), data);
                toast.success(`Added ${category}`);
            }

            resetForm();
            onRefresh();
        } catch (err) {
            toast.error('Save failed');
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
            <h3>Budgets</h3>

            {budgetProgress.map((bp) => (
  <div key={bp.id} className={`budget-bar ${bp.warningLevel}`}>
    <div className="label">
      <strong>{bp.category}:</strong> {bp.spent.toFixed(2)} / {bp.limit.toFixed(2)} {bp.currency} ({bp.percent.toFixed(0)}%)
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
          ? '🚨 Over budget!'
          : `⚠️ ${bp.rawPercent.toFixed(0)}% used!`}
      </p>
    )}
  </div>
))}


            {!showForm && (
                <button onClick={() => setShowForm(true)} className="add-budget-toggle">
                    ➕ Add Budget
                </button>
            )}


            {showForm && (
                <div className="budget-form-wrapper"  ref={formRef}>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSave();
                        }}
                        className="budget-form-inline"
                    >
                        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                            <option value="">-- Select Category --</option>
                            <option value="groceries">Groceries</option>
                            <option value="home">Home</option>
                            <option value="eating out">Eating Out</option>
                            <option value="food delivery">Food Delivery</option>
                            <option value="coffee">Coffee</option>
                            <option value="car">Car</option>
                            <option value="health">Health</option>
                            <option value="sport">Sport</option>
                            <option value="subscriptions">Subscriptions</option>
                            <option value="tech">Tech</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="personal">Personal</option>
                            <option value="clothing">Clothing</option>
                            <option value="gifts">Gifts</option>
                            <option value="education">Education</option>
                            <option value="business">Business</option>
                            <option value="charity">Charity</option>
                            <option value="pets">Pets</option>
                        </select>

                        <input
                            type="number"
                            placeholder="Limit"
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            required
                        />

                        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                            <option value="EUR">€ EUR</option>
                            <option value="USD">$ USD</option>
                            <option value="MKD">MKD</option>
                        </select>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit">
                                {editingId ? 'Update Budget' : 'Add Budget'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm();
                                    setShowForm(false);
                                }}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
}
