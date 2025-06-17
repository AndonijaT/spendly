import './../styles/NotificationCenter.css';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

type NotificationItem = {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: number;
};

export default function NotificationCenter({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('notificationHistory');
    if (saved) setNotifications(JSON.parse(saved));
  }, []);

  return (
    <div className="notification-center">
      <div className="header">
        <h3>Notifications</h3>
        <button onClick={onClose}>✕</button>
      </div>
      <ul>
        {notifications.length === 0 && <p>No past notifications yet.</p>}
        {notifications.map((n) => (
          <li key={n.id} className={`notif ${n.type}`}>
            <div className="message">{n.message}</div>
            <div className="timestamp">{format(new Date(n.timestamp), 'PPpp')}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
