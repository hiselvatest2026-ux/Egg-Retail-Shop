import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { getStock } from '../api/api';

const InventoryManagement = () => {
  const [rows, setRows] = useState([]);
  const [lowCount, setLowCount] = useState(0);
  useEffect(() => { (async()=>{ try{ const r = await getStock(); setRows(r.data||[]); setLowCount((r.data||[]).filter(x=>Number(x.stock)<=5).length);}catch(e){ console.error('load stock failed', e);} })(); }, []);

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
        <div className="stat-grid">
          <div className="stat"><div className="stat-label">Total SKUs</div><div className="stat-value">{totalSkus}</div></div>
          <div className="stat warn"><div className="stat-label">Low Stock Items (≤5)</div><div className="stat-value">{lowCount}</div></div>
          <div className="stat info"><div className="stat-label">Total Units</div><div className="stat-value">{totalStock}</div></div>
        </div>
      </Card>

      <div style={{height:12}} />

      <Card title="Stock Details">
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
    </div>
  );
};

export default InventoryManagement;

