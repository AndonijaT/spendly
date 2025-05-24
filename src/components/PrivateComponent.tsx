import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

// All public routes
const publicPaths = ['/', '/about', '/features', '/contact'];

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const currentPath = location.pathname.toLowerCase().replace(/\/+$/, '') || '/';

  const isPublic = publicPaths.includes(currentPath);

  if (loading) return <div>Loading...</div>;

  if (isPublic) return children;

  return isAuthenticated ? children : <Navigate to="/" />;
};
export default PrivateRoute;
