
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
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
    Title
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
    Filler,
    Title
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
    const [selectedMonth, setSelectedMonth] = useState<string>('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) return;
            const snapshot = await getDocs(collection(db, 'users', user.uid, 'transactions'));
            const allData: Transaction[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                allData.push({ id: doc.id, ...data } as Transaction);
            });
            setTransactions(allData);
        });
        return () => unsubscribe();
    }, []);

    const allMonths = Array.from(
        new Set(transactions.map((tx) => format(new Date(tx.timestamp.seconds * 1000), 'yyyy-MM')))
    ).sort().reverse();


    const getMonthFromTimestamp = (seconds: number) =>
        format(new Date(seconds * 1000), 'yyyy-MM');

    const today = new Date();
    const thisMonth = format(today, 'yyyy-MM');
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonth = format(lastMonthDate, 'yyyy-MM');

    const actualMonth =
        selectedMonth === '__this_month' ? thisMonth :
            selectedMonth === '__last_month' ? lastMonth :
                selectedMonth;

    const filtered = actualMonth

        ? transactions.filter((t) =>
            format(new Date(t.timestamp.seconds * 1000), 'yyyy-MM') === selectedMonth
        )
        : transactions;

    const expenses = filtered.filter((t) => t.type === 'expense');
    const income = filtered.filter((t) => t.type === 'income');

    const dailyExpenses = expenses.reduce((acc, tx) => {
        const date = format(new Date(tx.timestamp.seconds * 1000), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + tx.amount;
        return acc;
    }, {} as Record<string, number>);

    const monthlyTotals = filtered.reduce((acc, tx) => {
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
    const sortedByDate = [...filtered].sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
    sortedByDate.forEach((tx) => {
        const date = format(new Date(tx.timestamp.seconds * 1000), 'yyyy-MM-dd');
        runningTotal += tx.type === 'income' ? tx.amount : -tx.amount;
        cumulativeBalance.push({ x: date, y: runningTotal });
    });

    return (
        <div className="reports-container">
            <h1>📊 Financial Reports</h1>

            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <label htmlFor="month" style={{ fontWeight: 'bold', marginRight: '1rem' }}>
                    Select Month:
                </label>
                <select
                    id="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', fontSize: '1rem', borderRadius: '6px' }}
                >

                    <option value="">All Time</option>
                    <option value="__this_month">This Month</option>
                    <option value="__last_month">Last Month</option>

                    {allMonths.map((month) => (
                        <option key={month} value={month}>
                            {month}
                        </option>
                    ))}
                </select>
            </div>

            <div className="chart-card">
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
                    options={{
                        responsive: true,
                        plugins: {
                            title: { display: true, text: 'Daily Expenses Over Time' },
                            legend: { position: 'bottom' },
                        },
                    }}
                />
            </div>

            <div className="chart-card">
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
                    options={{
                        responsive: true,
                        plugins: {
                            title: { display: true, text: 'Income vs Expenses by Month' },
                            legend: { position: 'bottom' },
                        },
                    }}
                />
            </div>

            <div className="chart-grid">
                <div className="chart-card">
                    {Object.keys(byCategory).length > 0 ? (
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
                            options={{
                                plugins: {
                                    title: { display: true, text: 'Expenses by Category' },
                                    legend: { position: 'bottom' },
                                },
                            }}
                        />
                    ) : (
                        <p>No expense categories available.</p>
                    )}
                </div>

                <div className="chart-card">
                    {Object.keys(methodBreakdown).length > 1 ? (
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
                            options={{
                                plugins: {
                                    title: { display: true, text: 'Spending: Card vs Cash' },
                                    legend: { position: 'bottom' },
                                },
                            }}
                        />
                    ) : (
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            fontSize: '1.1rem',
                            color: '#777',
                            border: '1px dashed #ccc',
                            borderRadius: '10px'
                        }}>
                            Only one payment method used this month.
                        </div>

                    )}
                </div>
            </div>

            <div className="chart-card">
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
                    options={{
                        responsive: true,
                        plugins: {
                            title: { display: true, text: 'Cumulative Balance Over Time' },
                            legend: { position: 'bottom' },
                        },
                    }}
                />
            </div>
        </div>
    );
}
