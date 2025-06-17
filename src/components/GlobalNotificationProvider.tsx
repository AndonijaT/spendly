// src/components/GlobalNotificationProvider.tsx
import type { ReactNode } from 'react';
import useGlobalNotifications from '../hooks/useGlobalNotifications';

export default function GlobalNotificationProvider({ children }: { children: ReactNode }) {
  useGlobalNotifications(); // Hook is called here
  return <>{children}</>;
}
