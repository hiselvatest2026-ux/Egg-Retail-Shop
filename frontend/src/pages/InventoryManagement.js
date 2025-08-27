import React from 'react';
import Card from '../components/Card';

const InventoryManagement = () => (
  <div className="page">
    <div className="page-header">
      <div>
        <h1 className="page-title">Inventory Management</h1>
        <p className="page-subtitle">Track stock levels, batches, and expiries</p>
      </div>
    </div>

    <Card title="Stock Overview">
      <div className="stat-grid">
        <div className="stat"><div className="stat-label">Total SKUs</div><div className="stat-value">84</div></div>
        <div className="stat warn"><div className="stat-label">Low Stock Items</div><div className="stat-value">9</div></div>
        <div className="stat danger"><div className="stat-label">Expired Batches</div><div className="stat-value">2</div></div>
        <div className="stat info"><div className="stat-label">Stock Value</div><div className="stat-value">₹ 12,45,800</div></div>
      </div>
    </Card>

    <div style={{height:12}} />

    <Card title="Quick Actions">
      <div className="btn-group">
        <button className="btn">Reorder Low Stock</button>
        <button className="btn secondary">Import Inventory</button>
        <button className="btn secondary">Export Inventory</button>
      </div>
    </Card>
  </div>
);

export default InventoryManagement;

