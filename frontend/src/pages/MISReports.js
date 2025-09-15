import React, { useState } from 'react';
import Card from '../components/Card';
// Removed ShopChip
import axios from 'axios';
import { API_BASE_URL } from '../api/api';

const parseCsv = (text) => {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { rows.push(row); row = []; };
  const s = text.replace(/\r/g, '');
  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i+1] === '"') { field += '"'; i += 2; continue; } // escaped quote
        inQuotes = false; i++; continue;
      } else { field += ch; i++; continue; }
    } else {
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { pushField(); i++; continue; }
      if (ch === '\n') { pushField(); pushRow(); i++; continue; }
      field += ch; i++; continue;
    }
  }
  // flush last field/row
  pushField();
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) pushRow();
  return rows;
};

const DataTable = ({ rows }) => {
  if (!rows || rows.length === 0) return null;
  const [head, ...body] = rows;
  return (
    <div className="overflow-x-auto">
      <table className="table table-hover table-zebra mt-2">
        <thead>
          <tr>{head.map((h, i) => (<th key={i}>{h}</th>))}</tr>
        </thead>
        <tbody>
          {body.map((r, idx) => (
            <tr key={idx}>{r.map((c, i) => (<td key={i}>{c}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MISReports = () => {
  const API_URL = API_BASE_URL;
  const [reportRows, setReportRows] = useState({ purchases: null, sales: null, collections: null, stock: null });
  const [loading, setLoading] = useState({});
  // Removed All shops toggle

  const download = (path) => {
    const url = `${API_URL}/reports/${path}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const loadReport = async (key, path) => {
    try {
      setLoading(prev=>({ ...prev, [key]: true }));
      const res = await axios.get(`${API_URL}/reports/${path}`, { responseType: 'text' });
      const text = res.data;
      const rows = parseCsv(text);
      setReportRows(prev=>({ ...prev, [key]: rows }));
    } catch (e) {
      console.error('load report failed', key, e);
      setReportRows(prev=>({ ...prev, [key]: [['Error'], ['Failed to load report']] }));
    } finally {
      setLoading(prev=>({ ...prev, [key]: false }));
    }
  };

  // Auto-load purchases on mount
  React.useEffect(()=>{ loadReport('purchases','purchases.csv'); }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">MIS Reports</h1>
          <p className="page-subtitle">Analyze performance across purchases, sales, collection, and stock</p>
        </div>
        
      </div>

      

      <div className="grid grid-cols-1 gap-4">
        <Card title="Purchase Report">
          <div className="btn-group">
            <button className="btn" onClick={()=>loadReport('purchases','purchases.csv')} disabled={!!loading.purchases}>{loading.purchases ? 'Loading...' : 'Load'}</button>
            <button className="btn secondary" onClick={()=>download('purchases.csv')}>Download CSV</button>
          </div>
          <DataTable rows={reportRows.purchases} />
        </Card>

        <Card title="Sales Report">
          <div className="btn-group">
            <button className="btn" onClick={()=>loadReport('sales','sales.csv')} disabled={!!loading.sales}>{loading.sales ? 'Loading...' : 'Load'}</button>
            <button className="btn secondary" onClick={()=>download('sales.csv')}>Download CSV</button>
          </div>
          <DataTable rows={reportRows.sales} />
        </Card>

        <Card title="Collection Report">
          <div className="btn-group">
            <button className="btn" onClick={()=>loadReport('collections','collections.csv')} disabled={!!loading.collections}>{loading.collections ? 'Loading...' : 'Load'}</button>
            <button className="btn secondary" onClick={()=>download('collections.csv')}>Download CSV</button>
          </div>
          <DataTable rows={reportRows.collections} />
        </Card>

        <Card title="Stock Report">
          <div className="btn-group">
            <button className="btn" onClick={()=>loadReport('stock','stock.csv')} disabled={!!loading.stock}>{loading.stock ? 'Loading...' : 'Load'}</button>
            <button className="btn secondary" onClick={()=>download('stock.csv')}>Download CSV</button>
          </div>
          <DataTable rows={reportRows.stock} />
        </Card>
      </div>
    </div>
  );
};

export default MISReports;

