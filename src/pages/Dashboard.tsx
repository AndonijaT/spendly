import { useEffect, useState } from 'react';
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

type Transaction = {
  id: string;
  type: 'income' | 'expense';
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

  const recentTransactions = [...transactions]
    .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
    .slice(0, 10);
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
    {
      target: '.dashboard-container',
      placement: 'center',
      content: '👋 Welcome to your Spendly Dashboard! This is your financial overview.',
      disableBeacon: true,
    },
    {
      target: '.floating-add',
      content: '➕ Click here to add a new income or expense.',
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
      content: '⚙️ Access your language, currency, and app settings here.',
    }
  ];
useEffect(() => {
  const seen = localStorage.getItem('seenSpendlyTutorial');
  if (!seen) {
    setTimeout(() => {
      setRunTour(true);
      localStorage.setItem('seenSpendlyTutorial', 'true');
    }, 400); // Wait for DOM to fully mount
  }
}, []);



  // Load selected month from localStorage on first render
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

      // Filter by selected month
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

  const expenseByCategory = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

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

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Your Dashboard</h1>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="dashboard-title">Your Dashboard</h1>
        <button
          className="start-tutorial-btn"
          onClick={() => {
            setStepIndex(0);
            setRunTour(true);
          }}
        >
          🎓 Tutorial
        </button>
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
            zIndex: 9999, // or try 11000 if necessary
            primaryColor: '#d2b109',
            textColor: '#333',
          },
          overlay: {
            zIndex: 9998, // below the Joyride tooltip
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


      <div className="month-picker">
        <label>Select Month: </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            localStorage.setItem('selectedMonth', e.target.value);
          }}
        />
      </div>

      {selectedMonth && (
        <h2 className="selected-month-title">
          Showing data for: {format(parse(selectedMonth, 'yyyy-MM', new Date()), 'MMMM yyyy')}
        </h2>
      )}

      <div className="summary-row">
        <div className="summary-box income">Income: +{incomeTotal.toFixed(2)} €</div>
        <div className="summary-box expense">Expenses: -{expenseTotal.toFixed(2)} €</div>
        <div className="summary-box balance">Balance: {(incomeTotal - expenseTotal).toFixed(2)} €</div>
      </div>

      <div className="chart-section">
        <h3>Expenses by Category</h3>
        <div className="chart-wrapper">
          <Pie data={pieData} />
        </div>
      </div>

      <div className="recent-transactions">
        <h3>Recent Transactions</h3>
        <ul>
          {recentTransactions.map((tx) => {
            const date = new Date(tx.timestamp.seconds * 1000).toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <li key={tx.id} className={tx.type}>
                <span className="category">{tx.category}</span>
                {tx.description && (
                  <span className="description">{tx.description}</span>
                )}
                <span className="datetime">{date}</span>
                <span className="amount">
                  {tx.type === 'income' ? '+' : '-'}
                  {tx.amount.toFixed(2)} €
                </span>
              </li>
            );
          })}
        </ul>

        {showAllButton && (
          <button className="see-all-btn" onClick={() => navigate('/transaction-history')}>
            See All Transactions →
          </button>
        )}
      </div>

      <div className="floating-add" onClick={() => setShowAddModal(true)}>
        +
      </div>

      {showAddModal && (
        <AddTransactionModal onClose={() => setShowAddModal(false)} />
      )}
      <div className="floating-settings" onClick={() => setShowSettings(true)}>
        ⚙️
      </div>

      {showSettings && (
        <SettingsSidebar onClose={() => setShowSettings(false)} />
      )}

    </div>

  );
}
