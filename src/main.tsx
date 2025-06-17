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
import TransactionHistory from './pages/TransactionHistory';
import PrivateRoute from './components/PrivateComponent';
import './emailInit';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import Reports from './pages/Reports';
import GlobalNotificationProvider from './components/GlobalNotificationProvider';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} pauseOnHover theme="light" />
        <GlobalNotificationProvider>
          <Routes>
            {/* All pages that should show the global Navbar */}
            <Route path="/" element={<Layout />}>
              {/* PUBLIC routes */}
              <Route index element={<App />} />
              <Route path="about" element={<About />} />
              <Route path="features" element={<Features />} />
              <Route path="contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="/reports" element={<Reports />} />

              {/* PROTECTED routes */}
              <Route path="account" element={<PrivateRoute><Account /></PrivateRoute>} />
              <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="budget" element={<PrivateRoute><Budget /></PrivateRoute>} />
              <Route path="statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />
              <Route path="transaction-history" element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
            </Route>


            { }


            { }
            <Route path="*" element={<NotFound />} />
          </Routes>
        </GlobalNotificationProvider>
      </Router>
    </LanguageProvider>

  </React.StrictMode>
);
