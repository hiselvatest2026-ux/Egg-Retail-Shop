import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { getStock, getInventoryInsightsByLocation, getLocations, runSeed } from '../api/api';

const InventoryManagement = () => {
  const [rows, setRows] = useState([]);
  const [lowCount, setLowCount] = useState(0);
  const [insights, setInsights] = useState({ kpis:{ total_stock_value:0, low_stock_count:0 }, low_stock:[], fast_movers:[], slow_movers:[], reorder_suggestions:[] });
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('');
  const load = async (loc) => {
    try {
      const params = loc ? { location_id: loc } : undefined;
      const [r, i] = await Promise.all([
        getStock(params),
        getInventoryInsightsByLocation(params)
      ]);
      setRows(r.data||[]);
      setLowCount((r.data||[]).filter(x=>Number(x.stock)<=5).length);
      setInsights(i.data||insights);
    } catch (e) { console.error('load stock failed', e); }
  };
  useEffect(() => { (async()=>{ try{ const locs = await getLocations(); setLocations(locs.data||[]); await load(locationId); }catch(e){ console.error('load locs failed', e);} })(); }, [locationId]);

  const totalSkus = rows.length;
  const totalStock = rows.reduce((s,r)=>s+Number(r.stock||0),0);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Live stock by product</p>
        </div>
      </div>

      <Card title="Stock Overview">
        <div className="actions-row" style={{marginBottom:12}}>
          <select className="input" style={{maxWidth:260}} value={locationId} onChange={e=>setLocationId(e.target.value)}>
            <option value="">All locations</option>
            {locations.map(l => (<option key={l.id} value={l.id}>{l.name}</option>))}
          </select>
          <button className="btn secondary" onClick={async()=>{ try { await runSeed(); await load(locationId); } catch(e){ console.error('seed failed', e);} }}>Seed Demo Data</button>
        </div>
        <div className="stat-grid">
          <div className="stat"><div className="stat-label">Total SKUs</div><div className="stat-value">{totalSkus}</div></div>
          <div className="stat warn"><div className="stat-label">Low Stock Items (≤5)</div><div className="stat-value">{lowCount}</div></div>
          <div className="stat info"><div className="stat-label">Total Units</div><div className="stat-value">{totalStock}</div></div>
          <div className="stat"><div className="stat-label">Stock Value</div><div className="stat-value">₹ {Number(insights.kpis.total_stock_value||0).toLocaleString()}</div></div>
        </div>
      </Card>

      <div style={{height:12}} />

      <Card title="Stock Details (FIFO: sell older batches first)">
        <table className="table table-hover">
          <thead><tr><th>Product</th><th>Purchased</th><th>Sold</th><th>In Stock</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.product_id}>
                <td>{r.name} (#{r.product_id})</td>
                <td>{r.purchased_qty}</td>
                <td>{r.sold_qty}</td>
                <td>{r.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{height:12}} />

      <Card title="Reorder Suggestions">
        <table className="table table-hover">
          <thead><tr><th>Product</th><th>Current Stock</th></tr></thead>
          <tbody>
            {insights.reorder_suggestions.map(r => (
              <tr key={r.product_id}><td>{r.name} (#{r.product_id})</td><td>{r.stock}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{height:12}} />

      <Card title="Fast vs Slow Movers (30 days)">
        <div className="stat-grid">
          <div className="stat"><div className="stat-label">Top Fast Movers</div><div className="stat-value">{insights.fast_movers.slice(0,3).map(m=>m.name).join(', ') || '-'}</div></div>
          <div className="stat"><div className="stat-label">Top Slow Movers</div><div className="stat-value">{insights.slow_movers.slice(0,3).map(m=>m.name).join(', ') || '-'}</div></div>
        </div>
      </Card>

      <div style={{height:12}} />

      <Card title="Near Expiry (next 3 days)">
        <table className="table table-hover">
          <thead><tr><th>Product</th><th>Expiry</th><th>In Stock</th></tr></thead>
          <tbody>
            {(insights.near_expiry||[]).map(e => (
              <tr key={e.product_id}><td>{e.name} (#{e.product_id})</td><td>{new Date(e.expiry_date).toLocaleDateString()}</td><td>{e.stock}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{height:12}} />

      <Card title="Supplier Purchase Value (90 days)">
        <table className="table table-hover">
          <thead><tr><th>Supplier</th><th>Purchase Value</th></tr></thead>
          <tbody>
            {(insights.supplier_stats||[]).map(s => (
              <tr key={s.supplier_id}><td>{s.supplier_name}</td><td>₹ {Number(s.purchase_value).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default InventoryManagement;

