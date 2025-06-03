import '../styles/SettingsSidebar.css';
import { useState } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { deleteDoc, collection, getDocs, doc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import ConfirmModal from './ConfirmModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SettingsSidebar({
  onClose,
  onBudgetModeClick,
}: {
  onClose: () => void;
  onBudgetModeClick: () => void;
}) {
  const { language, setLanguage, t } = useLanguage();
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'MKD'>('EUR');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const deleteAllConfirmed = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = await getDocs(collection(db, 'users', user.uid, 'transactions'));
    const deletes = q.docs.map((docItem) =>
      deleteDoc(doc(db, 'users', user.uid, 'transactions', docItem.id))
    );
    await Promise.all(deletes);

    setConfirmSuccess(true); // Show success message in modal
  };

  const handleCloseSuccess = () => {
    setShowConfirm(false);
    setConfirmSuccess(false);
    window.location.reload();
  };

  const handleExportCSV = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await getDocs(collection(db, 'users', user.uid, 'transactions'));
    const transactions = snapshot.docs.map((doc) => doc.data());

    const headers = ['Type', 'Category', 'Amount', 'Description', 'Date'];
    const rows = transactions.map(tx => [
      tx.type,
      tx.category,
      tx.amount,
      tx.description || '',
      new Date(tx.timestamp.seconds * 1000).toLocaleString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await getDocs(collection(db, 'users', user.uid, 'transactions'));
    const transactions = snapshot.docs.map((doc) => doc.data());

    const docPDF = new jsPDF();
    docPDF.text('Transactions Report', 14, 15);

    autoTable(docPDF, {
      startY: 20,
      head: [['Type', 'Category', 'Amount', 'Description', 'Date']],
      body: transactions.map(tx => [
        tx.type,
        tx.category,
        tx.amount,
        tx.description || '',
        new Date(tx.timestamp.seconds * 1000).toLocaleString()
      ]),
    });

    docPDF.save('transactions.pdf');
  };

  return (
    <div className="settings-overlay">
      <div className="settings-sidebar">
        <button className="close-btn" onClick={onClose}>✕</button>
        <h2>{t('settings')}</h2>

        <div className="setting-group">
          <label>{t('language')}</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'sl')}>
            <option value="en">English</option>
            <option value="sl">Slovenian</option>
          </select>
        </div>

        <div className="setting-group">
          <label>{t('currency')}</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as 'EUR' | 'USD' | 'MKD')}>
            <option value="EUR">€ Euro</option>
            <option value="USD">$ US Dollar</option>
            <option value="MKD">ден Macedonian Denar</option>
          </select>
        </div>

        <div className="setting-group">
          <label>{t('data')}</label>
          <button className="danger-btn" onClick={() => setShowConfirm(true)}>
            {t('erase')}
          </button>
        </div>

        <div className="setting-group">
          <label>Budget</label>
          <button className="budget-mode-btn" onClick={onBudgetModeClick}>
            💼 Budget Mode
          </button>
        </div>

        <div className="setting-group">
          <label>Export</label>
          <button onClick={handleExportCSV}>📁 Export CSV</button>
          <button onClick={handleExportPDF}>📄 Export PDF</button>
        </div>

        <div className="setting-group links">
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
            {t('privacy')}
          </a>
          <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">
            {t('terms')}
          </a>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          message={confirmSuccess ? t('eraseSuccess') : t('confirmErase')}
          onConfirm={confirmSuccess ? handleCloseSuccess : deleteAllConfirmed}
          onCancel={confirmSuccess ? undefined : () => setShowConfirm(false)}
          successMode={confirmSuccess}
        />
      )}
    </div>
  );
}
