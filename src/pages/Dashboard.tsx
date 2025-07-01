import { useEffect, useState, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import '../styles/Dashboard.css';
import { format } from 'date-fns';
import AddTransactionModal from '../components/AddTransactionModal';
import { useNavigate } from 'react-router-dom';
import SettingsSidebar from '../components/SettingsSidebar';
import Joyride from 'react-joyride';
import type { Step } from 'react-joyride';
import { query, where } from 'firebase/firestore';
import TransactionHistory from '../pages/TransactionHistory';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import AIAdviceModal from '../components/AIAdviceModal';
import BudgetManager from '../components/BudgetManager';
import { onSnapshot } from 'firebase/firestore';
import Footer from '../components/Footer';
import { useCurrency, } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

type Transaction = {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  method?: 'cash' | 'card';
  direction?: 'to_cash' | 'to_card';
  category: string;
  amount: number;
  currency: 'EUR' | 'USD';
  description?: string;
  timestamp: { seconds: number };
  ownerUid: string;
};



export default function Dashboard() {
  const [showOverviewBtn, setShowOverviewBtn] = useState(true);
  const overviewAnchorRef = useRef<HTMLDivElement>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { convertToUserCurrency, getSymbol, currency } = useCurrency();
  const { t } = useLanguage();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowOverviewBtn(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const currentRef = overviewAnchorRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();
  // const showAllButton = transactions.length > 10;
  const [showSettings, setShowSettings] = useState(false);
  const symbol = getSymbol();

  const recentTransactions = [...transactions]
    .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
    .slice(0, 3);
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);
  const monthInputRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = [
    {
      target: '.account-toggle',
      placement: 'bottom',
      content: t('tour_account_toggle') || '👥 Switch between "My View"...',
      disableBeacon: true,
    },
    {
      target: '.cash-card-balance-section',
      placement: 'bottom',
      content: t('tour_balance_section') || '💰 This is your total available balance...',
    },
    {
      target: '.floating-advice-button',
      placement: 'left',
      content: t('tour_advice_button') || '🤖 Need help saving money?...',
    },
    {
      target: '.floating-fab',
      placement: 'left',
      content: t('tour_fab') || '☰ Tap here to access settings...',
    }
  ];


  const [viewMode, setViewMode] = useState<'personal' | 'shared'>('shared');

  const [overrunMessage, setOverrunMessage] = useState<string | null>(null);
  const [overrunCategory, setOverrunCategory] = useState<string | null>(null);

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
  const fetchBudgets = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const allUIDs = [user.uid];

    if (viewMode === 'shared') {
      try {
        const q = await getDocs(collection(db, 'users'));
        q.forEach((doc) => {
          const sharedWith = doc.data().sharedWith || [];
          const docUid = doc.id;

          // They shared with me
          if (sharedWith.includes(user.uid) && !allUIDs.includes(docUid)) {
            allUIDs.push(docUid);
          }

          // I shared with them
          if (user.uid === docUid && Array.isArray(sharedWith)) {
            sharedWith.forEach((uid: string) => {
              if (!allUIDs.includes(uid)) {
                allUIDs.push(uid);
              }
            });
          }
        });
      } catch (err) {
        console.error("❌ Error finding shared budgets:", err);
      }
    }

    const nowMonth = format(new Date(), 'yyyy-MM');
    const budgetData: Budget[] = [];

    for (const uid of allUIDs) {
      const q = query(
        collection(db, 'users', uid, 'budgets'),
        where('month', '==', nowMonth)
      );

      try {
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          if (!data.category || !data.type) return;

          budgetData.push({
            id: docSnap.id,
            category: data.category,
            type: data.type,
            currency: data.currency ?? 'EUR',
            limit: convertToUserCurrency(data.limit, data.currency ?? 'EUR'),
          });
        });


      } catch (err) {
        console.error("❌ Error fetching budgets for UID:", uid, err);
      }
    }

    setBudgets(budgetData);
  };

  useEffect(() => {
    const savedMonth = localStorage.getItem('selectedMonth');
    const defaultMonth = format(new Date(), 'yyyy-MM');
    setSelectedMonth(savedMonth || defaultMonth);
  }, []);
  const [uidToEmail, setUidToEmail] = useState<Record<string, string>>({});
  useEffect(() => {
    const fetchUserEmails = async () => {
      const snap = await getDocs(collection(db, 'users'));
      const map: Record<string, string> = {};
      snap.forEach(doc => {
        const email = doc.data().email;
        if (email) map[doc.id] = email;
      });
      setUidToEmail(map);
    };
    fetchUserEmails();
  }, []);

  //  const fetchTransactions = async () => {
  //   const user = auth.currentUser;
  //   if (!user) return;

  //   console.log("Your current user is:", user.uid);

  //   const allUIDs = [user.uid];

  //   if (viewMode === 'shared') {
  //     try {
  //       const q = await getDocs(collection(db, 'users'));
  //       q.forEach((doc) => {
  //         const sharedWith = doc.data().sharedWith || [];
  //         const docUid = doc.id;

  //         // They shared with me
  //         if (sharedWith.includes(user.uid) && !allUIDs.includes(docUid)) {
  //           allUIDs.push(docUid);
  //         }

  //         // I shared with them
  //         if (user.uid === docUid && Array.isArray(sharedWith)) {
  //           sharedWith.forEach((uid: string) => {
  //             if (!allUIDs.includes(uid)) {
  //               allUIDs.push(uid);
  //             }
  //           });
  //         }
  //       });
  //     } catch (err) {
  //       console.error("❌ Error while finding shared accounts:", err);
  //     }
  //   }

  //   console.log("Will fetch transactions from UIDs:", allUIDs);

  //   const allData: Transaction[] = [];

  //   for (const uid of allUIDs) {
  //     try {
  //       const snapshot = await getDocs(collection(db, 'users', uid, 'transactions'));
  //       snapshot.forEach((docSnap) => {
  //         const data = docSnap.data();

  //         if (
  //           data.type &&
  //           data.category &&
  //           data.amount !== undefined &&
  //           data.timestamp?.seconds
  //         ) {
  //           const tx: Transaction = {
  //             id: docSnap.id,
  //             type: data.type,
  //             category: data.category,
  //             amount: data.amount,
  //             timestamp: data.timestamp,
  //             method: data.method,
  //             direction: data.direction,
  //             description: data.description,
  //             ownerUid: uid,
  //           };

  //           allData.push(tx);
  //         } else {
  //           console.warn(`Skipping incomplete transaction from ${uid}:`, data);
  //         }
  //       });

  //       console.log(`Fetched ${snapshot.size} transactions from ${uid}`);
  //     } catch (err) {
  //       console.error(`Error fetching transactions for ${uid}:`, err);
  //     }
  //   }

  //   const filtered = allData.filter((tx) => {
  //     if (!tx.timestamp?.seconds) return false;
  //     const date = new Date(tx.timestamp.seconds * 1000);
  //     return format(date, 'yyyy-MM') === selectedMonth;
  //   });

  //   console.log(`Filtered ${filtered.length} transactions for selected month: ${selectedMonth}`);

  //   setTransactions(filtered);

  //   let income = 0;
  //   let expenses = 0;

  //   filtered.forEach((tx) => {
  //     const amt = Number(tx.amount);
  //     if (tx.type === 'income') income += amt;
  //     else if (tx.type === 'expense') expenses += amt;
  //   });

  //   setIncomeTotal(income);
  //   setExpenseTotal(expenses);
  // };


  //   useEffect(() => {
  //   if (!selectedMonth) return;
  //   fetchTransactions();
  // }, [selectedMonth, viewMode]);


  useEffect(() => {
    if (showHistoryModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showHistoryModal]);

  useEffect(() => {


    fetchBudgets();
  }, [viewMode, currency]);


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
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const currentMonth = format(new Date(), 'yyyy-MM');

    budgetProgress.forEach(async (bp) => {
      if (bp.warningLevel === 'over') {
        const localKey = `dismissed_${bp.category}_${currentMonth}`;
        const wasDismissed = localStorage.getItem(localKey);
        if (wasDismissed) return; // do not show if dismissed already

        const message = `${bp.category} over by ${(bp.spent - bp.limit).toFixed(2)} ${symbol}`;
        setOverrunMessage(message);
        setOverrunCategory(bp.category);

        const notif = {
          type: 'budget_alert',
          message: `🚨 You've exceeded your budget for "${bp.category}"!`,
          toastType: 'error',
          dismissed: false,
          timestamp: serverTimestamp(),
        };

        const ref = collection(db, 'users', user.uid, 'notifications');
        await addDoc(ref, notif);
      }
    });
  }, [budgetProgress, currency]);


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
    const amt = convertToUserCurrency(Number(tx.amount), tx.currency ?? 'EUR');

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
  // const cashCardData = {
  //   labels: ['Cash', 'Card'],
  //   datasets: [
  //     {
  //       data: [cash, card],
  //       backgroundColor: ['#4caf50', '#42a5f5'],
  //       borderWidth: 1,
  //     },
  //   ],
  // };

  const expensesRef = useRef<HTMLDivElement>(null);
  const [showAdviceModal, setShowAdviceModal] = useState(false);
  const [hideAdviceTrigger, setHideAdviceTrigger] = useState(false);
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !selectedMonth) return;

    const allUIDs = [user.uid];
    let unsubscribers: (() => void)[] = [];

    const setupListeners = async () => {
      if (viewMode === 'shared') {
        const snap = await getDocs(collection(db, 'users'));
        snap.forEach((doc) => {
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
      }

      const txMap = new Map<string, Transaction[]>(); // ownerUid => transactions

      for (const uid of allUIDs) {
        const ref = collection(db, 'users', uid, 'transactions');
        const unsubscribe = onSnapshot(ref, (snap) => {
          const txs: Transaction[] = [];

          snap.forEach((doc) => {
            const data = doc.data();
            if (
              data.type &&
              data.category &&
              data.amount !== undefined &&
              data.timestamp?.seconds
            ) {
              const date = new Date(data.timestamp.seconds * 1000);
              const month = format(date, 'yyyy-MM');
              if (month === selectedMonth) {
                txs.push({
                  id: doc.id,
                  type: data.type,
                  category: data.category,
                  amount: convertToUserCurrency(data.amount, data.currency ?? 'EUR'), // Convert ONCE here
                  currency: currency, // store the current user's selected currency
                  timestamp: data.timestamp,
                  method: data.method,
                  direction: data.direction,
                  description: data.description,
                  ownerUid: uid,
                });

              }
            }
          });

          //Store for this UID
          txMap.set(uid, txs);

          // Recompute all transactions from scratch
          const combined = Array.from(txMap.values()).flat();
          combined.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
          setTransactions(combined);

          // Update totals
          let income = 0;
          let expense = 0;
          combined.forEach((tx) => {
            const amt = tx.amount;
            if (tx.type === 'income') income += amt;
            else if (tx.type === 'expense') expense += amt;

          });
          setIncomeTotal(income);
          setExpenseTotal(expense);
        });

        unsubscribers.push(unsubscribe);
      }

    };

    setupListeners();

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [selectedMonth, viewMode, currency]);

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
      <div className="account-toggle">
        <button
          className={viewMode === 'shared' ? 'active' : ''}
          onClick={() => setViewMode('shared')}
        >
          Shared View
        </button>
        <button
          className={viewMode === 'personal' ? 'active' : ''}
          onClick={() => setViewMode('personal')}
        >
          My View
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
            zIndex: 9999, // or 11000 if necessary
            primaryColor: '#d2b109',
            textColor: '#333',
          },
          overlay: {
            zIndex: 9998, // below the joyride tooltip
          },
        }}
        callback={(data) => {
          const { index, status, type } = data;

          if (type === 'step:after' || type === 'error:target_not_found') {
            setStepIndex(index + 1);
          } else if (status === 'finished' || status === 'skipped') {
            setRunTour(false);
            setStepIndex(0);
          }
        }}

      />



      {overrunMessage && (
        <div
          className="budget-alert-overlay"
          onClick={() => {
            if (overrunCategory) {
              const currentMonth = format(new Date(), 'yyyy-MM');
              localStorage.setItem(`dismissed_${overrunCategory}_${currentMonth}`, 'true');
              setOverrunMessage(null);
              setOverrunCategory(null);
            }

          }}
        >
          <div className="budget-alert-box" onClick={(e) => e.stopPropagation()}>
            <div>🚨 <strong>{t('budgetOverrunTitle') || 'Budget Overrun:'}</strong></div>
            <div style={{ marginTop: '0.5rem' }}>{overrunMessage}</div>
            <div className="budget-dismiss-note">{t('dismissClick') || 'Click anywhere to dismiss'}</div>
          </div>
        </div>
      )}





      <div className="summary-group">

        <div className="summary-row" style={{ justifyContent: 'center' }}>
          <div className='dashboard-section'>
            <div className="cash-card-balance-section">
              <h3>{t('totalBalance') || 'Total Balance'}</h3>
              <div className="balance-display">
                {totalBalance >= 0 ? (
                  <span className="balance-positive">{totalBalance.toFixed(2)} {symbol}</span>
                ) : (
                  <span className="balance-negative">- {(Math.abs(totalBalance)).toFixed(2)} {symbol}</span>
                )}
              </div>
              <div className="balance-breakdown">
                <div className="balance-line">
                  <span className="label">{t('cash')}</span>
                  <span>{cash.toFixed(2)} {symbol}</span>
                </div>
                <div className="balance-line">
                  <span className="label">{t('card')}</span>
                  <span>{card.toFixed(2)} {symbol}</span>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="dashboard-section">
          <div className="summary-row">
            <div className="summary-box income">
              {t('income') || 'Income'}: +{incomeTotal.toFixed(2)} {symbol}
            </div><div className="summary-box expense">
              {t('expense') || 'Expenses'}: -{expenseTotal.toFixed(2)} {symbol}
            </div>          </div>
        </div>
      </div>

      <div ref={overviewAnchorRef} className="overview-button-wrapper">
        {showOverviewBtn && (
          <button
            className="overview-button"
            onClick={() => expensesRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="icon">📊</span> {t('spendingOverview') || 'Spending Overview'} →
          </button>
        )}
      </div>



      <div ref={expensesRef} className="dashboard-section expense-breakdown-section">
        <h3>{t('expensesByCategory') || 'Expenses by Category'}</h3>
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
                    {t(category) || category} ({percent}%)
                  </div>
                  <div className="category-amount">
                    {amount.toFixed(2)} {symbol}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>




      <div className="dashboard-section">
        <BudgetManager
          budgets={budgets}
          transactions={transactions}
          onRefresh={fetchBudgets}
          onOverrunDetected={(msg, category) => {
            setOverrunMessage(msg);

            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const ref = collection(db, 'users', currentUser.uid, 'notifications');
            addDoc(ref, {
              type: 'budget_alert',
              message: `🚨 You've exceeded your budget for "${category}"!`,
              toastType: 'error',
              dismissed: false,
              timestamp: serverTimestamp(),
            });
          }}
        />

      </div>
      <div className="dashboard-section" style={{ textAlign: 'center', padding: '1rem' }}>
        <button
          className="go-to-reports-btn"
          onClick={() => navigate('/reports')}
          style={{
            padding: '0.75rem 1.2rem',
            backgroundColor: '#1565c0',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          📈 {t('viewReports') || 'View Full Spending Report'}
        </button>
      </div>

      <div className="dashboard-section">
        <div className="recent-transactions">
          <div className="recent-header">
         <h3>{t('latestTransactions') || 'Latest transactions'} transactions</h3>

            <div className="recent-actions">
              <button className="see-all-link" onClick={() => setShowHistoryModal(true)}>
                {t('seeAll') || 'See all'}
              </button>



            </div>
          </div>

          <ul>
            {recentTransactions.map((tx) => {
              const date = new Date(tx.timestamp.seconds * 1000);
              const today = new Date();
              const formatted =
                date.toDateString() === today.toDateString()
                  ? t('today') || 'Today'
                  : date.toDateString() === new Date(today.getTime() - 86400000).toDateString()
                    ? t('yesterday') || 'Yesterday'
                    : date.toLocaleDateString();
              return (
                <li key={tx.id} className={`recent-item ${tx.type}`}>
                  <div className="recent-left">
                    <div className="recent-category">{tx.category}</div>
                    <div className="recent-date">
                      {formatted}
                      {tx.ownerUid && (
                        <div className="transaction-owner">
                          {uidToEmail[tx.ownerUid] || t('sharedUser') || 'Shared User'}
                        </div>
                      )}
                    </div>


                  </div>
                  <div className="recent-amount">
                    {tx.type === 'income' ? '+' : '-'}
                    {tx.amount.toFixed(2)} {symbol}
                    {/* Optional: Show source currency info */}
                    {(tx.currency !== currency && (tx.currency === 'EUR' || tx.currency === 'USD')) && (
                      <span className="original-currency"> ({tx.currency})</span>
                    )}

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
        />
      )}


      {auth.currentUser && showHistoryModal && (
        <TransactionHistory
          viewMode={viewMode}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showAdviceModal && (
        <div
          className="advice-modal-overlay"
          onClick={() => setShowAdviceModal(false)}
        >
          <div
            className="advice-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-advice-modal"
              onClick={() => setShowAdviceModal(false)}
              aria-label="Close"
            >
              ×
            </button>

            <AIAdviceModal
              budgets={budgets}
              transactions={transactions}
              onClose={() => setShowAdviceModal(false)}
            />
          </div>
        </div>
      )}
      {!hideAdviceTrigger && (
        <div className="floating-advice-button">
          <span onClick={() => setShowAdviceModal(true)}>💬 {t('assistantMessage') || 'Hey! I am here to help!'}</span>
          <button className="close-advice" onClick={() => setHideAdviceTrigger(true)}>×</button>
        </div>
      )}

      <Footer />


    </div>


  );
}
