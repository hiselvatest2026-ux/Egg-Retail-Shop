import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Invoice from './pages/Invoice';

function App() {
  return (
    <Router>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Egg Retail Shop</h1>
        <nav className="flex gap-4 mb-6 flex-wrap">
          <Link to="/" className="text-blue-600">Dashboard</Link>
          <Link to="/purchases" className="text-blue-600">Purchase</Link>
          <Link to="/sales" className="text-blue-600">Sales</Link>
          <Link to="/payments" className="text-blue-600">Payment Receipts</Link>
          <Link to="/products" className="text-blue-600">Products</Link>
          <Link to="/customers" className="text-blue-600">Customers</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/invoice/:id" element={<Invoice />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
