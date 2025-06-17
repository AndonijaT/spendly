export type NotificationItem = {
  id: string;
  message: string;
  type: string; // e.g. 'invite_response', 'budget_alert', etc.
  toastType: 'info' | 'success' | 'error';
  timestamp: number;
};

export function saveNotificationToHistory({
  message,
  type,
  toastType,
}: {
  message: string;
  type: string;
  toastType: 'info' | 'success' | 'error';
}) {
  const existing: NotificationItem[] = JSON.parse(localStorage.getItem('notificationHistory') || '[]');

  const newItem: NotificationItem = {
    id: Date.now().toString(),
    message,
    type,
    toastType,
    timestamp: Date.now(),
  };

  localStorage.setItem('notificationHistory', JSON.stringify([newItem, ...existing]));
}
