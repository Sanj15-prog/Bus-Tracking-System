import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './pages/AdminDashboard';


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/student-dashboard" element={<Dashboard role="Student" />} />
      <Route path="/admin-dashboard" element={<Dashboard role="Admin" />} />
      <Route path="/driver-panel" element={<Dashboard role="Driver" />} />
    </Routes>
  );
}
