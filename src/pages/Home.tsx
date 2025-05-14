// src/pages/Home.tsx
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import usePageTitle from '../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import './../styles/Home.css';

function Home() {
  usePageTitle('Home');
  const [isGuest, setIsGuest] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsGuest(!user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="home">
      <div className="hero">
        <video className="bg-video" autoPlay muted loop>
          <source src="/video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Only show hero text for guests */}
        {isGuest && (
          <div className="hero-text">
            <h1>The smarter way to manage money</h1>
            <p>
              Spendly helps you track every expense, plan smarter budgets, and
              achieve your savings goals — all in one beautifully simple app.
            </p>
            <button className="cta-button" onClick={() => navigate('/register')}>
              Get started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
