import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Budget from './pages/Budget.tsx';
import Statistics from './pages/Statistics.tsx';
import NotFound from './pages/NotFound.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
