import React from 'react';
import Card from '../components/Card';

const Stat = ({ label, value, tone }) => (
  <div className={`stat ${tone || ''}`}>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
  </div>
);

const CreditManagement = () => (
  <div className="page">
    <div className="page-header">
      <div>
        <h1 className="page-title">Credit Management</h1>
        <p className="page-subtitle">Monitor customer credit limits, dues, and risk</p>
      </div>
    </div>

    <Card title="Overview">
      <div className="stat-grid">
        <Stat label="Total Outstanding" value="₹ 3,42,500" tone="warn" />
        <Stat label="Overdue > 30 days" value="₹ 1,05,200" tone="danger" />
        <Stat label="At-risk Customers" value="12" tone="danger" />
        <Stat label="Credit Limit Utilization" value="68%" tone="info" />
      </div>
    </Card>

    <div style={{height:12}} />

    <Card title="Actions">
      <div className="btn-group">
        <button className="btn">Send Payment Reminders</button>
        <button className="btn secondary">Export Outstanding List</button>
        <button className="btn secondary">Adjust Credit Limits</button>
      </div>
    </Card>
  </div>
);

export default CreditManagement;

