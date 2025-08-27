import React, { useEffect, useState } from 'react';
import { getPurchases, createPurchase, updatePurchase, deletePurchase } from '../api/api';
import Card from '../components/Card';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState({ supplier_id: '', total: '' });
  const [editing, setEditing] = useState(null);
  const fetchPurchases = async () => { const res = await getPurchases(); setPurchases(res.data); };
  useEffect(() => { fetchPurchases(); }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_id || !form.total) return;
    if (editing) {
      await updatePurchase(editing, { total: Number(form.total) });
    } else {
      await createPurchase({ supplier_id: Number(form.supplier_id), total: Number(form.total) });
    }
    setForm({ supplier_id: '', total: '' });
    setEditing(null);
    fetchPurchases();
  };
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-subtitle">Create and manage supplier purchases</p>
        </div>
      </div>

      <Card title={editing ? 'Edit Purchase' : 'Add Purchase'}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="input-group">
            <label>Supplier ID</label>
            <input
              className="input"
              placeholder="e.g. 101"
              value={form.supplier_id}
              onChange={e => setForm({ ...form, supplier_id: e.target.value })}
              inputMode="numeric"
            />
          </div>
          <div className="input-group">
            <label>Total Amount</label>
            <input
              className="input"
              placeholder="e.g. 2500.00"
              value={form.total}
              onChange={e => setForm({ ...form, total: e.target.value })}
              inputMode="decimal"
            />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit">{editing ? 'Update Purchase' : 'Add Purchase'}</button>
            {editing && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => { setEditing(null); setForm({ supplier_id: '', total: '' }); }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card title="Purchases List">
        <table className="table table-hover mt-2">
          <thead>
            <tr>
              <th>ID</th>
              <th>Supplier</th>
              <th>Total</th>
              <th style={{ width: 240 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td><span className="badge">{p.supplier_id}</span></td>
                <td>₹ {Number(p.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>
                  <div className="btn-group">
                    <a className="btn secondary btn-sm" href={`/purchases/${p.id}/items`}>Items</a>
                    <button className="btn btn-sm" onClick={() => { setEditing(p.id); setForm({ supplier_id: p.supplier_id, total: p.total }); }}>Edit</button>
                    <button className="btn danger btn-sm" onClick={() => { deletePurchase(p.id); fetchPurchases(); }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
export default Purchases;