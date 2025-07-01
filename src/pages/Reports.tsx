import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { format, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [filterType, setFilterType] = useState<'all' | 'day' | 'week' | 'month' | 'range' | 'year'>('month');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [selectedDate, setSelectedDate] = useState<string>('');

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

  const isInRange = (ts: number, start: string, end: string) => {
    const date = new Date(ts * 1000);
    return date >= new Date(start) && date <= new Date(end);
  };

  const filtered = transactions.filter((t) => {
    const date = new Date(t.timestamp.seconds * 1000);

    switch (filterType) {
      case 'day':
        return format(date, 'yyyy-MM-dd') === selectedDate;
      case 'week': {
        const start = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
        const end = endOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
        return isWithinInterval(date, { start, end });
      }
      case 'month':
        return format(date, 'yyyy-MM') === selectedDate;
      case 'year':
        return format(date, 'yyyy') === selectedDate;
      case 'range':
        return isInRange(t.timestamp.seconds, customRange.start, customRange.end);
      default:
        return true;
    }
  });

  const expenses = filtered.filter((t) => t.type === 'expense');

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
const handleExportPDF = async () => {
  const reportSection = document.querySelector('.reports-container') as HTMLElement;
  if (!reportSection) return;

  const canvas = await html2canvas(reportSection, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#fff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pageWidth;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  let position = 0;

  // If image is taller than one page, split into multiple pages
  if (imgHeight < pageHeight) {
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  } else {
    let heightLeft = imgHeight;

    while (heightLeft > 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;

      if (heightLeft > 0) pdf.addPage();
    }
  }

  pdf.save('Spendly_Report.pdf');
};


  return (
    <div className="reports-container">
      <h1>📊 Financial Reports</h1>

     {/* Filter controls + Export */}
<div
  style={{
    marginBottom: '2rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  }}
>
  <label style={{ fontWeight: '600' }}>Filter by:</label>
  <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
    <option value="all">All time</option>
    <option value="day">Day</option>
    <option value="week">Week</option>
    <option value="month">Month</option>
    <option value="year">Year</option>
    <option value="range">Custom range</option>
  </select>

  {filterType === 'day' && (
    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
    />
  )}

  {filterType === 'week' && (
    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
    />
  )}

  {filterType === 'month' && (
    <input
      type="month"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
    />
  )}

  {filterType === 'year' && (
    <select
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      style={{ padding: '0.5rem 0.75rem', borderRadius: '8px' }}
    >
      <option value="">Select Year</option>
      {Array.from(
        new Set(transactions.map((t) => new Date(t.timestamp.seconds * 1000).getFullYear()))
      )
        .sort((a, b) => b - a)
        .map((year) => (
          <option key={year} value={year.toString()}>
            {year}
          </option>
        ))}
    </select>
  )}

  {filterType === 'range' && (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <input
        type="date"
        value={customRange.start}
        onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
      />
      <input
        type="date"
        value={customRange.end}
        onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
      />
    </div>
  )}

  <button
    onClick={handleExportPDF}
    style={{
      padding: '0.6rem 1rem',
      backgroundColor: '#d2b109',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
    }}
  >
    📄 Export to PDF
  </button>
</div>

      






      <div className="chart-card">
        <Line
  data={{
    labels: Object.keys(dailyExpenses),
    datasets: [
      {
        label: 'Daily Expenses (€)',
        data: Object.values(dailyExpenses),
        borderColor: '#e53935',
        backgroundColor: 'rgba(229, 57, 53, 0.15)',
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
      },
    ],
  }}
  options={{
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Daily Spending Trends (€)',
        font: {
          size: 18,
          weight: 'bold'
        },
        color: '#333'
      },
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `€ ${context.parsed.y.toFixed(2)} spent`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 14
          }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 20
        }
      },
      y: {
        title: {
          display: true,
          text: 'Amount',
          font: {
            size: 14
          }
        },
        beginAtZero: true
      }
    }
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
        backgroundColor: '#43a047',
        borderRadius: 6,
        barThickness: 40,
      },
      {
        label: 'Expenses',
        data: Object.values(monthlyTotals).map((m) => m.expense),
        backgroundColor: '#e53935',
        borderRadius: 6,
        barThickness: 40,
      },
    ],
  }}
  options={{
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Monthly Incomes vs Expenses (€)',
        font: {
          size: 18,
          weight: 'bold'
        },
        color: '#333'
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: €${ctx.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month',
          font: {
            size: 14
          }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
        stacked: false,
      },
      y: {
        title: {
          display: true,
          text: 'Amount',
          font: {
            size: 14
          }
        },
        beginAtZero: true,
        stacked: false,
      }
    }
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
              Only one payment method used in this filter.
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
        label: 'Balance (€)',
        data: cumulativeBalance.map((p) => p.y),
        borderColor: '#1565c0',
        backgroundColor: 'rgba(21, 101, 192, 0.1)',
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3,
        tension: 0.3,
      },
    ],
  }}
  options={{
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Your Account Balance Over Time',
        font: {
          size: 18,
          weight: 'bold',
        },
        color: '#333',
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          title: (ctx) => `Date: ${ctx[0].label}`,
          label: (ctx) => `Balance: €${ctx.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 14,
          },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 20,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Balance (€)',
          font: {
            size: 14,
          },
        },
        beginAtZero: false,
      },
    },
  }}
/>

      </div>
    </div>
  );
}
