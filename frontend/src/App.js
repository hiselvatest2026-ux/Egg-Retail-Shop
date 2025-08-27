import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Payments from './pages/Payments';

function App() {
  return (
    <Router>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Egg Retail Shop</h1>
        <nav className="flex gap-4 mb-6">
          <Link to="/purchases" className="text-blue-600">Purchases</Link>
          <Link to="/sales" className="text-blue-600">Sales</Link>
          <Link to="/payments" className="text-blue-600">Payment Receipts</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Navigate to="/purchases" replace />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/payments" element={<Payments />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
