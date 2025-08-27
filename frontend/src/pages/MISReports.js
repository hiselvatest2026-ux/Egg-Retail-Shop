import React from 'react';
import Card from '../components/Card';

const ReportCard = ({ title, desc, onDownload }) => (
  <div className="card">
    <div className="card-body">
      <div className="card-title">{title}</div>
      <div style={{color:'#475569', marginTop:4, fontSize:13}}>{desc}</div>
      <div className="btn-group" style={{marginTop:12}}>
        <button className="btn" onClick={onDownload}>Download CSV</button>
      </div>
    </div>
  </div>
);

const MISReports = () => {
  const API_URL = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? window.location.origin.replace('frontend','backend') : '');
  const download = (path) => {
    const url = `${API_URL}/reports/${path}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">MIS Reports</h1>
          <p className="page-subtitle">Analyze performance across purchases, sales, collection, and stock</p>
        </div>
      </div>
      <Card title="Reports">
        <div className="stat-grid">
          <ReportCard title="Purchase Report" desc="Date-wise purchases with supplier totals" onDownload={()=>download('purchases.csv')} />
          <ReportCard title="Sales Report" desc="Daily sales, customer breakup, and top items" onDownload={()=>download('sales.csv')} />
          <ReportCard title="Collection Report" desc="Receipts by mode and invoice mapping" onDownload={()=>download('collections.csv')} />
          <ReportCard title="Stock Report" desc="On hand, reserved, and reorder suggestions" onDownload={()=>download('stock.csv')} />
        </div>
      </Card>
    </div>
  );
};

export default MISReports;

