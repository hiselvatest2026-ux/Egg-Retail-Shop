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
      <div className="min-h-screen flex">
        <aside className="w-64 bg-gray-100 p-4">
          <h1 className="text-xl font-bold mb-4">Egg Retail Shop</h1>
          <nav className="flex flex-col space-y-3">
            <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">DashBoard</Link>
            <Link to="/sales" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Sales</Link>
            <Link to="/payments" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Payment Receipts</Link>
            <Link to="/purchases" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Purchase</Link>
            <Link to="/products" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Products</Link>
            <Link to="/customers" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Customer</Link>
          </nav>
        </aside>
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/invoice/:id" element={<Invoice />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
