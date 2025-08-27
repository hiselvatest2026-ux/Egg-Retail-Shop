import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { FiHome, FiShoppingCart, FiDollarSign, FiPackage, FiUsers, FiCreditCard } from 'react-icons/fi';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Dashboard from './pages/Dashboard';
import Invoice from './pages/Invoice';
import SaleItems from './pages/SaleItems';
import PurchaseItems from './pages/PurchaseItems';
import CreditManagement from './pages/CreditManagement';
import InventoryManagement from './pages/InventoryManagement';
import CollectionSettlement from './pages/CollectionSettlement';
import InvoicePrinting from './pages/InvoicePrinting';
import MISReports from './pages/MISReports';

function App() {
  return (
    <Router>
      <div className="layout">
        <aside className="sidebar">
          <div className="brand">Egg Retail Shop</div>
          <nav className="nav">
            <NavLink to="/purchases" className={({isActive})=> isActive ? 'active' : ''}><FiShoppingCart style={{marginRight:8}} /> Purchase</NavLink>
            <NavLink to="/sales" className={({isActive})=> isActive ? 'active' : ''}><FiDollarSign style={{marginRight:8}} /> Sales</NavLink>
            <NavLink to="/payments" className={({isActive})=> isActive ? 'active' : ''}><FiCreditCard style={{marginRight:8}} /> Payment receipts</NavLink>
            <NavLink to="/credit" className={({isActive})=> isActive ? 'active' : ''}><FiUsers style={{marginRight:8}} /> Credit Management</NavLink>
            <NavLink to="/inventory" className={({isActive})=> isActive ? 'active' : ''}><FiPackage style={{marginRight:8}} /> Inventory Management</NavLink>
            <NavLink to="/collection" className={({isActive})=> isActive ? 'active' : ''}><FiDollarSign style={{marginRight:8}} /> Collection settlement</NavLink>
            <NavLink to="/mis" className={({isActive})=> isActive ? 'active' : ''}><FiHome style={{marginRight:8}} /> MIS</NavLink>
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
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/invoice/:id" element={<Invoice />} />
            <Route path="/sales/:id/items" element={<SaleItems />} />
            <Route path="/purchases/:id/items" element={<PurchaseItems />} />
            <Route path="/credit" element={<CreditManagement />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/collection" element={<CollectionSettlement />} />
            <Route path="/invoice-print" element={<InvoicePrinting />} />
            <Route path="/mis" element={<MISReports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
