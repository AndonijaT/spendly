import { useState } from 'react';
import AddTransactionModal from '../components/AddTransactionModal';
import '../styles/Dashboard.css';
import TransactionList from '../components/TransactionList';
import TransactionHistory from './TransactionHistory';

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <span className="icon left" onClick={() => setShowHistory(true)}>
          ⏰
        </span>
        <h1>Spendly</h1>
        <span className="icon right" onClick={() => alert('Open settings')}>
          ⚙️
        </span>
      </header>

      <div className="plus-button" onClick={() => setShowModal(true)}>
        +
      </div>
      <TransactionList />

      {showModal && (
        <AddTransactionModal onClose={() => setShowModal(false)} />
        
      )}

      {showHistory && <TransactionHistory onClose={() => setShowHistory(false)} />}

    </div>
  );
}
