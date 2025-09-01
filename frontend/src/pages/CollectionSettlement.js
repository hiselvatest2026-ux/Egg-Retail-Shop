import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { getCreditCollection, getRouteCollection, getWalkinCollection, getTotalCollection } from '../api/api';

const CollectionSettlement = () => {
  const [type, setType] = useState('Credit');
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10));
  const [credit, setCredit] = useState({ kpis:{}, rows:[] });
  const [routes, setRoutes] = useState({ kpis:{}, routes:[] });
  const [walkin, setWalkin] = useState({ kpis:{}, rows:[] });
  const [total, setTotal] = useState({ kpis:{} });

  const load = async () => {
    const params = { start: date, end: date };
    const [c, r, w, t] = await Promise.all([
      getCreditCollection(params),
      getRouteCollection(params),
      getWalkinCollection(params),
      getTotalCollection(params)
    ]);
    setCredit(c.data||{kpis:{},rows:[]});
    setRoutes(r.data||{kpis:{},routes:[]});
    setWalkin(w.data||{kpis:{},rows:[]});
    setTotal(t.data||{kpis:{}});
  };
  useEffect(()=>{ load(); }, [date]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Collection</h1>
          <p className="page-subtitle">Daily collections by Credit, Route, and Walk-in</p>
        </div>
      </div>

      <Card title="Filters">
        <div className="form-grid" style={{gridTemplateColumns:'repeat(4, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Date</label>
            <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Type</label>
            <select className="input" value={type} onChange={e=>setType(e.target.value)}>
              <option value="Credit">Credit Collection</option>
              <option value="Route">Route Collection</option>
              <option value="Walkin">Walk-in Collection</option>
            </select>
          </div>
        </div>
      </Card>

      <div style={{height:12}} />

      {type==='Credit' && (
      <Card title="Credit Collection">
        <div className="stat-grid">
          <div className="stat warn"><div className="stat-label">Outstanding</div><div className="stat-value">₹ {Number(credit.kpis.total_outstanding||0).toLocaleString()}</div></div>
          <div className="stat danger"><div className="stat-label">Overdue > 30d</div><div className="stat-value">₹ {Number(credit.kpis.overdue_30||0).toLocaleString()}</div></div>
        </div>
        <div className="hide-on-mobile">
          <table className="table table-hover mt-2">
            <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Total</th><th>Paid</th><th>Balance</th></tr></thead>
            <tbody>
              {(credit.rows||[]).map(r=> (
                <tr key={r.invoice_id}><td>#{r.invoice_id}</td><td>{new Date(r.sale_date).toLocaleDateString()}</td><td>{r.customer_code} - {r.customer_name}</td><td>₹ {Number(r.total).toFixed(2)}</td><td>₹ {Number(r.paid).toFixed(2)}</td><td>₹ {Number(r.balance).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cards-mobile">
          {(credit.rows||[]).map(r=> (
            <div key={r.invoice_id} className="card" style={{marginBottom:10}}>
              <div className="card-body">
                <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Invoice #{r.invoice_id}</span>
                </div>
                <div className="data-pairs">
                  <div className="pair"><strong>Date:</strong> {new Date(r.sale_date).toLocaleDateString()}</div>
                  <div className="pair" style={{flexBasis:'100%'}}><strong>Customer:</strong> {r.customer_code} - {r.customer_name}</div>
                  <div className="pair"><strong>Total:</strong> ₹ {Number(r.total).toFixed(2)}</div>
                  <div className="pair"><strong>Paid:</strong> ₹ {Number(r.paid).toFixed(2)}</div>
                  <div className="pair"><strong>Balance:</strong> ₹ {Number(r.balance).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      )}

      {type==='Route' && (
      <Card title="Route Collection">
        <div className="stat-grid">
          <div className="stat info"><div className="stat-label">Routes</div><div className="stat-value">{routes.kpis.routes_count||0}</div></div>
          <div className="stat"><div className="stat-label">Cash Collected</div><div className="stat-value">₹ {Number(routes.kpis.cash_collected||0).toLocaleString()}</div></div>
          <div className="stat warn"><div className="stat-label">Credit Issued</div><div className="stat-value">₹ {Number(routes.kpis.credit_issued||0).toLocaleString()}</div></div>
          <div className="stat"><div className="stat-label">Credit Collected</div><div className="stat-value">₹ {Number(routes.kpis.credit_collected||0).toLocaleString()}</div></div>
        </div>
        <div className="hide-on-mobile">
          <table className="table table-hover mt-2">
            <thead><tr><th>Service Date</th><th>Route</th><th>Vehicle</th><th>Cash Sales</th><th>Credit Issued</th><th>Credit Collected</th></tr></thead>
            <tbody>
              {(routes.routes||[]).map(r=> (
                <tr key={r.route_trip_id}><td>{new Date(r.service_date).toLocaleDateString()}</td><td>{r.route_name||'-'}</td><td>{r.vehicle_number||'-'}</td><td>₹ {Number(r.cash_sales).toFixed(2)}</td><td>₹ {Number(r.credit_issued).toFixed(2)}</td><td>₹ {Number(r.credit_collected).toFixed(2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cards-mobile">
          {(routes.routes||[]).map(r=> (
            <div key={r.route_trip_id} className="card" style={{marginBottom:10}}>
              <div className="card-body">
                <div className="card-title">{r.route_name || '-'}</div>
                <div className="data-pairs">
                  <div className="pair"><strong>Date:</strong> {new Date(r.service_date).toLocaleDateString()}</div>
                  <div className="pair"><strong>Vehicle:</strong> {r.vehicle_number || '-'}</div>
                  <div className="pair"><strong>Cash Sales:</strong> ₹ {Number(r.cash_sales).toFixed(2)}</div>
                  <div className="pair"><strong>Credit Issued:</strong> ₹ {Number(r.credit_issued).toFixed(2)}</div>
                  <div className="pair"><strong>Credit Collected:</strong> ₹ {Number(r.credit_collected).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      )}

      {type==='Walkin' && (
      <Card title="Walk-in Collection">
        <div className="stat-grid">
          <div className="stat"><div className="stat-label">Cash</div><div className="stat-value">₹ {Number(walkin.kpis.walkin_cash_collected||0).toLocaleString()}</div></div>
          <div className="stat warn"><div className="stat-label">Credit Issued</div><div className="stat-value">₹ {Number(walkin.kpis.walkin_credit_issued||0).toLocaleString()}</div></div>
          <div className="stat"><div className="stat-label">Credit Collected</div><div className="stat-value">₹ {Number(walkin.kpis.walkin_credit_collected||0).toLocaleString()}</div></div>
        </div>
        <div className="hide-on-mobile">
          <table className="table table-hover mt-2">
            <thead><tr><th>Invoice</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Type</th></tr></thead>
            <tbody>
              {(walkin.rows||[]).map(r=> (
                <tr key={r.invoice_id}><td>#{r.invoice_id}</td><td>{new Date(r.sale_date).toLocaleDateString()}</td><td>₹ {Number(r.total).toFixed(2)}</td><td>₹ {Number(r.paid).toFixed(2)}</td><td>₹ {Number(r.balance).toFixed(2)}</td><td>{r.sale_type}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cards-mobile">
          {(walkin.rows||[]).map(r=> (
            <div key={r.invoice_id} className="card" style={{marginBottom:10}}>
              <div className="card-body">
                <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Invoice #{r.invoice_id}</span>
                  <span className="badge">{r.sale_type}</span>
                </div>
                <div className="data-pairs">
                  <div className="pair"><strong>Date:</strong> {new Date(r.sale_date).toLocaleDateString()}</div>
                  <div className="pair"><strong>Total:</strong> ₹ {Number(r.total).toFixed(2)}</div>
                  <div className="pair"><strong>Paid:</strong> ₹ {Number(r.paid).toFixed(2)}</div>
                  <div className="pair"><strong>Balance:</strong> ₹ {Number(r.balance).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      )}

      <div style={{height:12}} />

      <Card title="Total Collection (All)">
        <div className="stat-grid">
          <div className="stat"><div className="stat-label">Cash</div><div className="stat-value">₹ {Number(total.kpis.total_cash||0).toLocaleString()}</div></div>
          <div className="stat warn"><div className="stat-label">Credit Issued</div><div className="stat-value">₹ {Number(total.kpis.total_credit_issued||0).toLocaleString()}</div></div>
          <div className="stat"><div className="stat-label">Credit Collected</div><div className="stat-value">₹ {Number(total.kpis.total_credit_collected||0).toLocaleString()}</div></div>
          <div className="stat info"><div className="stat-label">Total</div><div className="stat-value">₹ {Number((total.kpis.total_cash||0) + (total.kpis.total_credit_collected||0)).toLocaleString()}</div></div>
        </div>
      </Card>
    </div>
  );
};

export default CollectionSettlement;

