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
        <nav className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link to="/purchases" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">Purchase</Link>
            <Link to="/sales" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">Sales</Link>
            <Link to="/payments" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">Payment Receipts</Link>
            <Link to="/products" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">Products</Link>
            <Link to="/customers" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">Customer</Link>
            <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">Dashboard</Link>
          </div>
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
