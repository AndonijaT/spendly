import { useEffect, useState, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import '../styles/Dashboard.css';
import { format, parse } from 'date-fns';
import AddTransactionModal from '../components/AddTransactionModal';
import { useNavigate } from 'react-router-dom';
import SettingsSidebar from '../components/SettingsSidebar';
import Joyride from 'react-joyride';
import type { Step } from 'react-joyride';
import SetCategoryBudgetModal from '../components/SetCategoryBudgetModal';
import { query, where } from 'firebase/firestore';
import { Doughnut } from 'react-chartjs-2';

type Transaction = {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  method?: 'cash' | 'card'; // optional for transfer
  direction?: 'to_cash' | 'to_card'; // only for transfers
  category: string;
  amount: number;
  description?: string;
  timestamp: { seconds: number };
};


export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();
  const showAllButton = transactions.length > 10;
  const [showSettings, setShowSettings] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const handleBudgetMode = () => {
    setShowSettings(false); // Close sidebar
    setShowBudgetModal(true); // Open budget modal
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
    .slice(0, 3);
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
const [fabOpen, setFabOpen] = useState(false);
const monthInputRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = [
    {
      target: '.dashboard-container',
      placement: 'center',
      content: '👋 Welcome to your Spendly Dashboard! This is your financial overview.',
      disableBeacon: true,
    },
    {
      target: '.floating-add',
      content: '➕ Click here to add a new income or expense. Select category and fill in the details.',
    },
    {
      target: '.summary-row',
      content: '📊 Here’s a quick look at your income, expenses, and current balance.',
    },
    {
      target: '.chart-wrapper',
      content: '🎯 This chart shows where your money goes by category.',
    },
    {
      target: '.floating-settings',
      content: '⚙️ Access your language, currency, app settings and also add budget for each category, if you want to remove a budget just set the limit to 0.',
    }
  ];


  useEffect(() => {
    const seen = localStorage.getItem('seenSpendlyTutorial');
    if (!seen) {
      setTimeout(() => {
        setRunTour(true);
        localStorage.setItem('seenSpendlyTutorial', 'true');
      }, 400);
    }
  }, []);

  type Budget = {
    id: string;
    category: string;
    limit: number;
    currency: string;
    type: 'expense' | 'income';
  };

  const [budgets, setBudgets] = useState<Budget[]>([]);


  useEffect(() => {
    const savedMonth = localStorage.getItem('selectedMonth');
    const defaultMonth = format(new Date(), 'yyyy-MM');
    setSelectedMonth(savedMonth || defaultMonth);
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;

    const fetchTransactions = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snapshot = await getDocs(collection(db, 'users', user.uid, 'transactions'));
      const allData: Transaction[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        allData.push({ id: doc.id, ...data } as Transaction);
      });


      const filtered = allData.filter((tx) => {
        if (!tx.timestamp?.seconds) return false;
        const date = new Date(tx.timestamp.seconds * 1000);
        return format(date, 'yyyy-MM') === selectedMonth;
      });

      setTransactions(filtered);

      let income = 0;
      let expenses = 0;

      filtered.forEach((tx) => {
        const amt = Number(tx.amount);
        if (tx.type === 'income') income += amt;
        else expenses += amt;
      });

      setIncomeTotal(income);
      setExpenseTotal(expenses);
    };

    fetchTransactions();
  }, [selectedMonth]);
  useEffect(() => {
    const fetchBudgets = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const nowMonth = format(new Date(), 'yyyy-MM');
      const q = query(
        collection(db, 'users', user.uid, 'budgets'),
        where('month', '==', nowMonth)
      );

      const snapshot = await getDocs(q);
      const budgetData: Budget[] = [];

      snapshot.forEach((docSnap) => {
        budgetData.push({ id: docSnap.id, ...docSnap.data() } as Budget);
      });

      setBudgets(budgetData);
    };

    fetchBudgets();
  }, []);

  const expenseByCategory = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
  const budgetProgress = budgets.map((budget) => {
    const spent = transactions
      .filter((tx) => tx.type === budget.type && tx.category === budget.category)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const percent = (spent / budget.limit) * 100;

    let warningLevel: 'none' | 'mid' | 'high' | 'over' = 'none';
    if (percent >= 100) warningLevel = 'over';
    else if (percent >= 75) warningLevel = 'high';
    else if (percent >= 50) warningLevel = 'mid';
    return {
      ...budget,
      spent,
      percent,
      warningLevel,
    };
  });

  const pieData = {
    labels: Object.keys(expenseByCategory),
    datasets: [
      {
        label: 'Expenses',
        data: Object.values(expenseByCategory),
        backgroundColor: [
          '#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0',
          '#9966ff', '#ff9f40', '#c9cbcf', '#cc65fe',
        ],
        borderWidth: 1,
      },
    ],
  };
  let cash = 0;
  let card = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount);

    if (tx.type === 'income') {
      if (tx.method === 'cash') cash += amt;
      if (tx.method === 'card') card += amt;
    }

    if (tx.type === 'expense') {
      if (tx.method === 'cash') cash -= amt;
      if (tx.method === 'card') card -= amt;
    }

    if (tx.type === 'transfer') {
      if (tx.direction === 'to_cash') {
        card -= amt;
        cash += amt;
      } else if (tx.direction === 'to_card') {
        cash -= amt;
        card += amt;
      }
    }
  });

  const totalBalance = cash + card;
  const cashCardData = {
    labels: ['Cash', 'Card'],
    datasets: [
      {
        data: [cash, card],
        backgroundColor: ['#4caf50', '#42a5f5'],
        borderWidth: 1,
      },
    ],
  };

  const expensesRef = useRef<HTMLDivElement>(null);

  return (
    <div className="dashboard-container">

      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="floating-tutorial" onClick={() => {
          setStepIndex(0);
          setRunTour(true);
        }}>
          🎓
        </div>

      </div>



      <Joyride
        steps={steps}
        run={runTour}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        disableScrolling
        styles={{
          options: {
            zIndex: 9999, // or 11000 if necessary
            primaryColor: '#d2b109',
            textColor: '#333',
          },
          overlay: {
            zIndex: 9998, // below the joyride tooltip
          },
        }}
        callback={(data) => {
          const { action, index, status, type } = data;

          if (type === 'step:after' || type === 'error:target_not_found') {
            setStepIndex(index + 1);
          } else if (status === 'finished' || status === 'skipped') {
            setRunTour(false);
            setStepIndex(0);
          }
        }}

      />


    



      <div className="summary-group">

        <div className="summary-row" style={{ justifyContent: 'center' }}>
  <div className='dashboard-section'>
    <div className="cash-card-balance-section">
      <h3>Total Balance</h3>
      <div className="balance-display">
        {totalBalance >= 0 ? (
          <span className="balance-positive">{totalBalance.toFixed(2)} €</span>
        ) : (
          <span className="balance-negative">- {(Math.abs(totalBalance)).toFixed(2)} €</span>
        )}
      </div>
      <div className="balance-breakdown">
        <div className="balance-line">
          <span className="label">Cash</span>
          <span>{cash.toFixed(2)} €</span>
        </div>
        <div className="balance-line">
          <span className="label">Card</span>
          <span>{card.toFixed(2)} €</span>
        </div>
      </div>
    </div>
  </div>
</div>


        <div className="dashboard-section">
          <div className="summary-row">
            <div className="summary-box income">Income: +{incomeTotal.toFixed(2)} €</div>
            <div className="summary-box expense">Expenses: -{expenseTotal.toFixed(2)} €</div>
          </div>
        </div>
      </div>

<div className="overview-button-wrapper">
  <button className="overview-button" onClick={() => expensesRef.current?.scrollIntoView({ behavior: 'smooth' })}>
    <span className="icon">📊</span> Spending Overview →
  </button>
</div>


<div ref={expensesRef} className="dashboard-section expense-breakdown-section">
  <h3>Expenses by Category</h3>
  <div className="expense-layout">
    <div className="expense-chart">
      <Pie data={pieData} options={{
        cutout: '60%',
        plugins: { legend: { display: false } }
      }} />
    </div>
    <div className="category-expense-list">
      {Object.entries(expenseByCategory).map(([category, amount], i) => {
        const color = pieData.datasets[0].backgroundColor[i] as string;
        const percent = ((amount / expenseTotal) * 100).toFixed(1);
        return (
          <div key={category} className="category-expense-item">
            <div className="category-color-box" style={{ backgroundColor: color }}></div>
            <div className="category-label" style={{ color }}>
              {category} ({percent}%)
            </div>
            <div className="category-amount">
              {amount.toFixed(2)} €
            </div>
          </div>
        );
      })}
    </div>
  </div>
</div>


      <div className="dashboard-section">
      <div className="budget-usage-section">
        <h3>Budget Usage</h3>
        {budgetProgress.map((bp) => (
          <div key={bp.category} className="budget-bar">
            <div className="label">
              <strong>{bp.category}</strong>: {bp.spent.toFixed(2)} / {bp.limit.toFixed(2)} {bp.currency} ({Math.min(bp.percent, 100).toFixed(0)}%)
            </div>
            <div className="progress-bar-container">
              <div
                className="progress"
                style={{
                  width: `${Math.min(bp.percent, 100)}%`,
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
            {bp.warningLevel === 'mid' && <p className="warning-text">⚠️ 50% of your budget used.</p>}
            {bp.warningLevel === 'high' && <p className="warning-text">⚠️ 75% of your budget used!</p>}
            {bp.warningLevel === 'over' && <p className="warning-text">🚨 Over budget!</p>}
          </div>
        ))}
      </div>
</div>

<div className="dashboard-section">
      <div className="recent-transactions">
        <div className="recent-header">
          <h3>Latest transactions</h3>
          <button className="see-all-link" onClick={() => navigate('/transaction-history')}>
            See all
          </button>
        </div>
        <ul>
          {recentTransactions.map((tx) => {
            const date = new Date(tx.timestamp.seconds * 1000);
            const today = new Date();
            const formatted =
              date.toDateString() === today.toDateString()
                ? 'Today'
                : date.toDateString() === new Date(today.getTime() - 86400000).toDateString()
                  ? 'Yesterday'
                  : date.toLocaleDateString();

            return (
              <li key={tx.id} className={`recent-item ${tx.type}`}>
                <div className="recent-left">
                  <div className="recent-category">{tx.category}</div>
                  <div className="recent-date">{formatted}</div>
                </div>
                <div className="recent-amount">
                  {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} €
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      </div>



{/* Expandable floating menu */}
<div className="fab-container">
  <div className={`fab-button calendar ${fabOpen ? 'show' : ''}`} onClick={() => monthInputRef.current?.showPicker()}>
    📅
    <input
      type="month"
      ref={monthInputRef}
      className="hidden-month-input"
      value={selectedMonth}
      onChange={(e) => {
        setSelectedMonth(e.target.value);
        localStorage.setItem('selectedMonth', e.target.value);
      }}
    />
  </div>
  <div className={`fab-button add ${fabOpen ? 'show' : ''}`} onClick={() => setShowAddModal(true)}>+</div>
  <div className={`fab-button settings ${fabOpen ? 'show' : ''}`} onClick={() => setShowSettings(true)}>⚙️</div>
  <div className="floating-fab" onClick={() => setFabOpen(!fabOpen)}>
    {fabOpen ? '×' : '☰'}
  </div>
</div>


     
      {showAddModal && (
        <AddTransactionModal onClose={() => setShowAddModal(false)} />
      )}
   
      {showSettings && (
        <SettingsSidebar
          onClose={() => setShowSettings(false)}
          onBudgetModeClick={handleBudgetMode}
        />
      )}

      {showBudgetModal && (
        <SetCategoryBudgetModal onClose={() => setShowBudgetModal(false)} />
      )}

    </div>
    

  );
}
