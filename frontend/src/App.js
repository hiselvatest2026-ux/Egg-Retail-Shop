import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { FiHome, FiShoppingCart, FiDollarSign, FiPackage, FiUsers, FiCreditCard } from 'react-icons/fi';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Dashboard from './pages/Dashboard';
import Invoice from './pages/Invoice';
import SaleItems from './pages/SaleItems';
import PurchaseItems from './pages/PurchaseItems';
import CreditManagement from './pages/CreditManagement';
import InventoryManagement from './pages/InventoryManagement';
import StockAdjustments from './pages/StockAdjustments';
import CollectionSettlement from './pages/CollectionSettlement';
import InvoicePrinting from './pages/InvoicePrinting';
import MISReports from './pages/MISReports';
import MetalMaster from './pages/MetalMaster';
import PricingMaster from './pages/PricingMaster';
import Vendors from './pages/Vendors';

function App() {
  return (
    <Router>
      <div className="layout">
        <aside className="sidebar">
          <div className="brand">
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <img src="https://raw.githubusercontent.com/hiselvatest2026-ux/Egg-Retail-Shop/main/ZeroEgg.jpeg" alt="Company Logo" width="40" height="40" style={{borderRadius:8, border:'1px solid #1f2937'}} />
              <span>TRY ZEROEGG POS</span>
            </div>
          </div>
          <nav className="nav">
            <NavLink to="/purchases" className={({isActive})=> isActive ? 'active' : ''}><FiShoppingCart style={{marginRight:8}} /> Purchase</NavLink>
            <NavLink to="/sales" className={({isActive})=> isActive ? 'active' : ''}><FiDollarSign style={{marginRight:8}} /> Sales</NavLink>
            
            <NavLink to="/credit" className={({isActive})=> isActive ? 'active' : ''}><FiUsers style={{marginRight:8}} /> Credit Management</NavLink>
            <NavLink to="/inventory" className={({isActive})=> isActive ? 'active' : ''}><FiPackage style={{marginRight:8}} /> Inventory Management</NavLink>
            <NavLink to="/inventory/adjustments" className={({isActive})=> isActive ? 'active' : ''}><FiPackage style={{marginRight:8}} /> Stock Adjustments</NavLink>
            
            <NavLink to="/collection" className={({isActive})=> isActive ? 'active' : ''}><FiDollarSign style={{marginRight:8}} /> Collection settlement</NavLink>
            <NavLink to="/mis" className={({isActive})=> isActive ? 'active' : ''}><FiHome style={{marginRight:8}} /> MIS</NavLink>
            <NavLink to="/customers" className={({isActive})=> isActive ? 'active' : ''}><FiUsers style={{marginRight:8}} /> Customer Master</NavLink>
            <NavLink to="/vendors" className={({isActive})=> isActive ? 'active' : ''}><FiUsers style={{marginRight:8}} /> Vendor Master</NavLink>
            <NavLink to="/Material-master" className={({isActive})=> isActive ? 'active' : ''}><FiHome style={{marginRight:8}} /> Material Master</NavLink>
            <NavLink to="/pricing-master" className={({isActive})=> isActive ? 'active' : ''}><FiDollarSign style={{marginRight:8}} /> Pricing Master</NavLink>
          </nav>
        </aside>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/payments" element={<Navigate to="/sales?tab=payments" replace />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/invoice/:id" element={<Invoice />} />
            <Route path="/sales/:id/items" element={<SaleItems />} />
            <Route path="/purchases/:id/items" element={<PurchaseItems />} />
            <Route path="/credit" element={<CreditManagement />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/inventory/adjustments" element={<StockAdjustments />} />
            
            <Route path="/collection" element={<CollectionSettlement />} />
            <Route path="/invoice-print" element={<InvoicePrinting />} />
            <Route path="/mis" element={<MISReports />} />
            <Route path="/Material-master" element={<MetalMaster />} />
            <Route path="/pricing-master" element={<PricingMaster />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
