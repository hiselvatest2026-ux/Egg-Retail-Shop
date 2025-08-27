import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { FiHome, FiShoppingCart, FiDollarSign, FiPackage, FiUsers, FiCreditCard } from 'react-icons/fi';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Invoice from './pages/Invoice';
import SaleItems from './pages/SaleItems';
import PurchaseItems from './pages/PurchaseItems';

function App() {
  return (
    <Router>
      <div className="layout">
        <aside className="sidebar">
          <div className="brand">Egg Retail Shop</div>
          <nav className="nav">
            <NavLink to="/" end className={({isActive})=> isActive ? 'active' : ''}><FiHome style={{marginRight:8}} /> DashBoard</NavLink>
            <NavLink to="/sales" className={({isActive})=> isActive ? 'active' : ''}><FiDollarSign style={{marginRight:8}} /> Sales</NavLink>
            <NavLink to="/payments" className={({isActive})=> isActive ? 'active' : ''}><FiCreditCard style={{marginRight:8}} /> Payment Receipts</NavLink>
            <NavLink to="/purchases" className={({isActive})=> isActive ? 'active' : ''}><FiShoppingCart style={{marginRight:8}} /> Purchase</NavLink>
            <NavLink to="/products" className={({isActive})=> isActive ? 'active' : ''}><FiPackage style={{marginRight:8}} /> Products</NavLink>
            <NavLink to="/customers" className={({isActive})=> isActive ? 'active' : ''}><FiUsers style={{marginRight:8}} /> Customer</NavLink>
          </nav>
        </aside>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/invoice/:id" element={<Invoice />} />
            <Route path="/sales/:id/items" element={<SaleItems />} />
            <Route path="/purchases/:id/items" element={<PurchaseItems />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
