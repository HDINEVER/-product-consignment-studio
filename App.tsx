import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shop from './components/Shop';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* Redirect unknown routes to Shop */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;