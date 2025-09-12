import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { getStock, getInventoryInsights, runSeed } from '../api/api';
import axios from 'axios';
import ShopChip from '../components/ShopChip';

const InventoryManagement = () => {
  const [rows, setRows] = useState([]);
  const [lowCount, setLowCount] = useState(0);
  const [insights, setInsights] = useState({ kpis:{ total_stock_value:0, low_stock_count:0 }, low_stock:[], fast_movers:[], slow_movers:[], reorder_suggestions:[] });
  const [tab, setTab] = useState('overview'); // overview | opening | closing
  const [opening, setOpening] = useState([]);
  const [openingMaterials, setOpeningMaterials] = useState([]);
  const [closing, setClosing] = useState([]);
  const [closingMaterials, setClosingMaterials] = useState([]);
  const [saveMsg, setSaveMsg] = useState('');
  const load = async () => {
    try {
      const [r, i] = await Promise.all([
        getStock(),
        getInventoryInsights()
      ]);
      setRows(r.data||[]);
      setLowCount((r.data||[]).filter(x=>Number(x.stock)<=5).length);
      setInsights(i.data||insights);
    } catch (e) { console.error('load stock failed', e); }
  };
  const baseUrl = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? (window.origin.replace('frontend','backend')) : 'http://localhost:5000');
  const loadOpening = async () => {
    try { 
      const [p, m] = await Promise.all([
        axios.get(`${baseUrl}/inventory/opening-stocks`),
        axios.get(`${baseUrl}/inventory/opening-stocks/materials`)
      ]);
      setOpening(p.data||[]);
      setOpeningMaterials(m.data||[]);
    } catch(e){ console.error('load opening failed', e);} }
  const loadClosing = async () => {
    try { 
      const m = await axios.get(`${baseUrl}/inventory/closing-stocks/materials`);
      setClosingMaterials(m.data||[]);
    } catch(e){ console.error('load closing failed', e);} }
  useEffect(() => { (async()=>{ try{ await load(); if (tab==='opening') await loadOpening(); if (tab==='closing') await loadClosing(); }catch(e){ console.error('load failed', e);} })(); }, [tab]);

  // Auto-refresh when purchases/sales emit events
  useEffect(() => {
    const onRefresh = async (e) => {
      try {
        const kind = e?.detail?.type;
        await load();
        if (kind === 'opening') await loadOpening();
        if (kind === 'closing') await loadClosing();
      } catch (err) { /* ignore */ }
    };
    if (typeof window !== 'undefined') window.addEventListener('inventory:refresh', onRefresh);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('inventory:refresh', onRefresh); };
  }, []);

  const totalSkus = rows.length;
  const totalStock = rows.reduce((s,r)=>s+Number(r.stock||0),0);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Live stock by product</p>
        </div>
        <ShopChip />
      </div>

      <div className="actions-row" style={{marginBottom:12}}>
        <button className={`btn ${tab==='overview'?'':'secondary'}`} onClick={()=>setTab('overview')}>Overview</button>
        <button className={`btn ${tab==='opening'?'':'secondary'}`} onClick={()=>setTab('opening')}>Opening Stock</button>
        <button className={`btn ${tab==='closing'?'':'secondary'}`} onClick={()=>setTab('closing')}>Closing Stock</button>
      </div>

      {tab==='overview' && (
      <>
      <Card title="Stock Overview">
        <div className="actions-row" style={{marginBottom:12, overflow:'visible'}}>
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
      </>
      )}

      {tab==='opening' && (
      <>
      <Card title="Opening Stock (Product)">
        <table className="table table-hover">
          <thead><tr><th>Material Code</th><th>Material Type</th><th>Quantity</th></tr></thead>
          <tbody>
            {openingMaterials.map(row => (
              <tr key={row.material_code}>
                <td>{row.material_code}</td>
                <td>{row.material_type}</td>
                <td>
                  <input className="input" value={row.quantity} onChange={e=>{
                    const v = e.target.value; setOpeningMaterials(prev=>prev.map(x=>x.material_code===row.material_code?{...x, quantity:v}:x));
                  }} inputMode="numeric" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="actions-row">
          <button className="btn" onClick={async()=>{
            try { await axios.put(`${baseUrl}/inventory/opening-stocks/materials`, { items: openingMaterials.map(o=>({ material_code:o.material_code, quantity: Number(o.quantity||0) })) }); await load(locationId); }
            catch(e){ console.error('save opening materials failed', e); }
          setSaveMsg('Opening stocks updated'); setTimeout(()=>setSaveMsg(''), 3000);
          }}>Save Product Opening</button>
          <button className="btn secondary" onClick={loadOpening}>Refresh</button>
        </div>
        {saveMsg && <div className="toast" style={{marginTop:8}}>{saveMsg}</div>}
      </Card>
      </>
      )}

      {tab==='closing' && (
      <>
      <Card title="Closing Stock (Product)">
        <table className="table table-hover">
          <thead><tr><th>Material Code</th><th>Material Type</th><th>Quantity</th></tr></thead>
          <tbody>
            {closingMaterials.map(row => (
              <tr key={row.material_code}>
                <td>{row.material_code}</td>
                <td>{row.material_type}</td>
                <td>
                  <input className="input" value={row.quantity} readOnly />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="actions-row">
          <button className="btn secondary" onClick={loadClosing}>Refresh</button>
        </div>
        {saveMsg && <div className="toast" style={{marginTop:8}}>{saveMsg}</div>}
      </Card>
      </>
      )}
    </div>
  );
};

export default InventoryManagement;

