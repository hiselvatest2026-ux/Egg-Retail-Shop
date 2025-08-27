import React from 'react';
import Card from '../components/Card';

const ReportCard = ({ title, desc }) => (
  <div className="card">
    <div className="card-body">
      <div className="card-title">{title}</div>
      <div style={{color:'#475569', marginTop:4, fontSize:13}}>{desc}</div>
      <div className="btn-group" style={{marginTop:12}}>
        <button className="btn">View</button>
        <button className="btn secondary">Download CSV</button>
      </div>
    </div>
  </div>
);

const MISReports = () => (
  <div className="page">
    <div className="page-header">
      <div>
        <h1 className="page-title">MIS Reports</h1>
        <p className="page-subtitle">Analyze performance across purchases, sales, collection, and stock</p>
      </div>
    </div>
    <Card title="Reports">
      <div className="stat-grid">
        <ReportCard title="Purchase Report" desc="Date-wise purchases with supplier totals" />
        <ReportCard title="Sales Report" desc="Daily sales, customer breakup, and top items" />
        <ReportCard title="Collection Report" desc="Receipts by mode and invoice mapping" />
        <ReportCard title="Stock Report" desc="On hand, reserved, and reorder suggestions" />
      </div>
    </Card>
  </div>
);

export default MISReports;

