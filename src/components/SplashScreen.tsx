import { useEffect } from 'react';
import './SplashScreen.css';

const coinLogo = '/coin_logo.png';

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(() => onFinish(), 4000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="splash">
      <img src={coinLogo} alt="Spendly Coin Logo" className="splash-logo" />
    </div>
  );
}

export default SplashScreen;
