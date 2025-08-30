import React, { useEffect, useState } from 'react';
import Card from '../components/Card';

const Stat = ({ label, value, tone }) => (
  <div className={`stat ${tone || ''}`}>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
  </div>
);

const CreditManagement = () => {
  const [kpis, setKpis] = useState({ total_customers_with_dues: 0, total_outstanding: 0, total_overdue_30: 0 });
  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async()=>{
      try {
        const base = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin.replace('frontend','backend') : '');
        const res = await fetch(`${base}/credit-summary/summary`);
        const data = await res.json();
        setKpis(data.kpis || { total_customers_with_dues: 0, total_outstanding: 0, total_overdue_30: 0 });
        setRows(data.customers || []);
      } catch (e) { console.error('load credit summary failed', e); }
    })();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Credit Management</h1>
          <p className="page-subtitle">Monitor customer dues and risk</p>
        </div>
      </div>

      <Card title="Overview">
        <div className="stat-grid">
          <Stat label="Total Outstanding" value={`₹ ${Number(kpis.total_outstanding||0).toLocaleString()}`} tone="warn" />
          <Stat label="> 30d Overdue" value={`₹ ${Number(kpis.total_overdue_30||0).toLocaleString()}`} tone="danger" />
          <Stat label="Customers with Dues" value={kpis.total_customers_with_dues} tone="info" />
        </div>
      </Card>

      <div style={{height:12}} />

      <Card title="Outstanding by Customer">
        <table className="table table-hover">
          <thead><tr><th>Customer Code</th><th>Customer</th><th>Credit Limit</th><th>Total Due</th><th>Overdue >30d</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.customer_id}>
                <td>{r.customer_code}</td>
                <td>{r.customer_name} (#{r.customer_id})</td>
                <td>₹ {Number(r.credit_limit||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td>₹ {Number(r.total_due||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td>₹ {Number(r.overdue_30||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default CreditManagement;

