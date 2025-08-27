import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, NavLink } from 'react-router-dom';
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
            <NavLink to="/" end className={({isActive})=>`px-4 py-2 rounded text-white ${isActive ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}>DashBoard</NavLink>
            <NavLink to="/sales" className={({isActive})=>`px-4 py-2 rounded text-white ${isActive ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}>Sales</NavLink>
            <NavLink to="/payments" className={({isActive})=>`px-4 py-2 rounded text-white ${isActive ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}>Payment Receipts</NavLink>
            <NavLink to="/purchases" className={({isActive})=>`px-4 py-2 rounded text-white ${isActive ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}>Purchase</NavLink>
            <NavLink to="/products" className={({isActive})=>`px-4 py-2 rounded text-white ${isActive ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}>Products</NavLink>
            <NavLink to="/customers" className={({isActive})=>`px-4 py-2 rounded text-white ${isActive ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}>Customer</NavLink>
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
