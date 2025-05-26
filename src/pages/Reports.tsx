import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import '../styles/Reports.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  method: string;
  timestamp: { seconds: number };
};

export default function Reports() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snapshot = await getDocs(collection(db, 'users', user.uid, 'transactions'));
      const allData: Transaction[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        allData.push({ id: doc.id, ...data } as Transaction);
      });

      setTransactions(allData);
    };

    fetchTransactions();
  }, []);

  const expenses = transactions.filter((t) => t.type === 'expense');
  const income = transactions.filter((t) => t.type === 'income');

  const dailyExpenses = expenses.reduce((acc, tx) => {
    const date = format(new Date(tx.timestamp.seconds * 1000), 'yyyy-MM-dd');
    acc[date] = (acc[date] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyTotals = transactions.reduce((acc, tx) => {
    const month = format(new Date(tx.timestamp.seconds * 1000), 'yyyy-MM');
    acc[month] = acc[month] || { income: 0, expense: 0 };
    acc[month][tx.type] += tx.amount;
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  const byCategory = expenses.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const methodBreakdown = expenses.reduce((acc, tx) => {
    acc[tx.method] = (acc[tx.method] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  let cumulativeBalance: { x: string; y: number }[] = [];
  let runningTotal = 0;

  const sortedByDate = [...transactions].sort(
    (a, b) => a.timestamp.seconds - b.timestamp.seconds
  );
  sortedByDate.forEach((tx) => {
    const date = format(new Date(tx.timestamp.seconds * 1000), 'yyyy-MM-dd');
    runningTotal += tx.type === 'income' ? tx.amount : -tx.amount;
    cumulativeBalance.push({ x: date, y: runningTotal });
  });

  return (
    <div className="reports-container">
      <h1>📊 Financial Reports</h1>

      <div className="chart-card">
        <h3>Daily Expenses</h3>
        <Line
          data={{
            labels: Object.keys(dailyExpenses),
            datasets: [
              {
                label: 'Expenses €',
                data: Object.values(dailyExpenses),
                borderColor: '#c62828',
                backgroundColor: 'rgba(198, 40, 40, 0.2)',
                fill: true,
              },
            ],
          }}
        />
      </div>

      <div className="chart-card">
        <h3>Income vs Expenses by Month</h3>
        <Bar
          data={{
            labels: Object.keys(monthlyTotals),
            datasets: [
              {
                label: 'Income',
                data: Object.values(monthlyTotals).map((m) => m.income),
                backgroundColor: '#4caf50',
              },
              {
                label: 'Expenses',
                data: Object.values(monthlyTotals).map((m) => m.expense),
                backgroundColor: '#f44336',
              },
            ],
          }}
        />
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Expenses by Category</h3>
          <Pie
            data={{
              labels: Object.keys(byCategory),
              datasets: [
                {
                  data: Object.values(byCategory),
                  backgroundColor: [
                    '#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff',
                    '#ff9f40', '#c9cbcf', '#cc65fe', '#aed581', '#ffab91',
                  ],
                },
              ],
            }}
          />
        </div>

        <div className="chart-card">
          <h3>Spending: Card vs Cash</h3>
          <Doughnut
            data={{
              labels: Object.keys(methodBreakdown),
              datasets: [
                {
                  data: Object.values(methodBreakdown),
                  backgroundColor: ['#42a5f5', '#ffca28'],
                },
              ],
            }}
          />
        </div>
      </div>

      <div className="chart-card">
        <h3>Cumulative Balance Over Time</h3>
        <Line
          data={{
            labels: cumulativeBalance.map((p) => p.x),
            datasets: [
              {
                label: 'Balance €',
                data: cumulativeBalance.map((p) => p.y),
                borderColor: '#1565c0',
                backgroundColor: 'rgba(21, 101, 192, 0.2)',
                fill: true,
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
