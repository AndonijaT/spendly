import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import AuthHandler from './AuthHandler';
import FloatingNotificationButton from './FloatingNotificationButton';
import NotificationCenter from './NotificationCenter';
import SplashScreen from './SplashScreen';

function Layout() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(location.pathname === '/');
  const [showNotifications, setShowNotifications] = useState(false);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <>
      <AuthHandler />
      <Navbar />
      <main>
        <Outlet />
      </main>

      {/* Notification button and sidebar only after splash screen */}
      <FloatingNotificationButton onClick={() => setShowNotifications(true)} />
      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}

export default Layout;
