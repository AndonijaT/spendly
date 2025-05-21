import '../styles/SettingsSidebar.css'
import { useState } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { deleteDoc, collection, getDocs, doc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsSidebar({ onClose }: { onClose: () => void }) {
const { language, setLanguage, t } = useLanguage();
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'MKD'>('EUR');

  const handleDeleteAll = async () => {
    const confirm = window.confirm("Are you sure you want to erase all transactions?");
    if (!confirm) return;

    const user = auth.currentUser;
    if (!user) return;

    const q = await getDocs(collection(db, 'users', user.uid, 'transactions'));
    const deletes = q.docs.map((docItem) => deleteDoc(doc(db, 'users', user.uid, 'transactions', docItem.id)));
    await Promise.all(deletes);

    alert("All transactions erased.");
    window.location.reload();
  };

  return (
    <div className="settings-overlay">
      <div className="settings-sidebar">
        <button className="close-btn" onClick={onClose}>✕</button>

        <h2>Settings</h2>

        <div className="setting-group">
          <label>Language</label>
<select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'sl')}>
            <option value="en">English</option>
            <option value="sl">Slovenian</option>
          </select>
        </div>

        <div className="setting-group">
          <label>Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as 'EUR' | 'USD' | 'MKD')}>
            <option value="EUR">€ Euro</option>
            <option value="USD">$ US Dollar</option>
            <option value="MKD">ден Macedonian Denar</option>
          </select>
        </div>

        <div className="setting-group">
          <label>Data</label>
          <button className="danger-btn" onClick={handleDeleteAll}>Erase All Transactions</button>
        </div>

        <div className="setting-group links">
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          <a href="/terms-of-use" target="_blank" rel="noopener noreferrer">Terms of Use</a>
        </div>
      </div>
    </div>
  );
}
