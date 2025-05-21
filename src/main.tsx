import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import App from './App'; 
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import Statistics from './pages/Statistics';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Features from './pages/Features';
import Contact from './pages/Contact';
import Account from './pages/Account';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LanguageProvider } from './context/LanguageContext';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
        <LanguageProvider>
    <Router>
        <ToastContainer position="top-right" autoClose={3000} pauseOnHover theme="light" />
      <Routes>
        {/* All pages that should show the global Navbar */}
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} /> {/* splash + home */}
          <Route path="about" element={<About />} />
          <Route path="features" element={<Features />} />
          <Route path="contact" element={<Contact />} />
          <Route path="account" element={<Account />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="budget" element={<Budget />} />
          <Route path="statistics" element={<Statistics />} />
        </Route>

        {/* Auth routes (separate, without layout if needed) */}
        

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
        </LanguageProvider>

  </React.StrictMode>
);
