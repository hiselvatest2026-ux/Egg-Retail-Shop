import React, { useEffect, useState } from 'react';
import { getPurchases, createPurchase, updatePurchase, deletePurchase, getSuppliers } from '../api/api';
import Card from '../components/Card';
import { Link } from 'react-router-dom';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState({ supplier_id: '', total: '', egg_type: '' });
  const [editing, setEditing] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fetchPurchases = async () => {
    try {
      const res = await getPurchases();
      setPurchases(res.data);
    } catch (err) {
      console.error('Failed to load purchases', err);
    }
  };
  useEffect(() => { fetchPurchases(); (async()=>{ try { const r = await getSuppliers(); setSuppliers(r.data);} catch(e){ console.error('suppliers load failed', e);} })(); }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.supplier_id) { setError('Please select a supplier.'); return; }
    if (!form.total || Number.isNaN(Number(form.total))) { setError('Please enter a valid total amount.'); return; }
    try {
      if (editing) {
        await updatePurchase(editing, { total: Number(form.total), egg_type: form.egg_type || null });
      } else {
        await createPurchase({ supplier_id: Number(form.supplier_id), total: Number(form.total), egg_type: form.egg_type || null });
      }
      setForm({ supplier_id: '', total: '', egg_type: '' });
      setEditing(null);
      await fetchPurchases();
      setSuccess('Purchase saved successfully.');
    } catch (err) {
      console.error('Failed to submit purchase', err);
      setError('Failed to save purchase. Please try again.');
    }
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
            <select className="input" value={form.supplier_id} onChange={e=>setForm({...form, supplier_id: e.target.value})}>
              <option value="">Select supplier</option>
              {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name} (#{s.id})</option>))}
            </select>
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
          <div className="input-group">
            <label>Egg Type</label>
            <select className="input" value={form.egg_type} onChange={e=>setForm({...form, egg_type: e.target.value})}>
              <option value="">Select type</option>
              <option value="Chicken">Chicken</option>
              <option value="Duck">Duck</option>
              <option value="Quail">Quail</option>
              <option value="Country">Country</option>
              <option value="Organic">Organic</option>
            </select>
          </div>
          <div className="actions-row">
            <button className="btn" type="submit">{editing ? 'Update Purchase' : 'Add Purchase'}</button>
            {editing && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => { setEditing(null); setForm({ supplier_id: '', total: '', egg_type: '' }); }}
              >
                Cancel
              </button>
            )}
          </div>
          {error && <div className="form-help">{error}</div>}
          {success && <div className="toast">{success}</div>}
        </form>
      </Card>

      <Card title="Purchases List">
        <table className="table table-hover mt-2">
          <thead>
            <tr>
              <th>ID</th>
              <th>Supplier</th>
              <th>Total</th>
              <th>Egg Type</th>
              <th style={{ width: 240 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td><span className="badge">{p.supplier_id}</span></td>
                <td>₹ {Number(p.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{p.egg_type || '-'}</td>
                <td>
                  <div className="btn-group">
                    <Link className="btn secondary btn-sm" to={`/purchases/${p.id}/items`}>Items</Link>
                    <button className="btn btn-sm" onClick={() => { setEditing(p.id); setForm({ supplier_id: p.supplier_id, total: p.total, egg_type: p.egg_type || '' }); }}>Edit</button>
                    <button className="btn danger btn-sm" onClick={async () => { try { await deletePurchase(p.id); await fetchPurchases(); } catch (e) { console.error('Delete failed', e); } }}>Delete</button>
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