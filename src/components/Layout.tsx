import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import AuthHandler from './AuthHandler';
import SplashScreen from './SplashScreen';

function Layout() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(location.pathname === '/');

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
    </>
  );
}

export default Layout;
