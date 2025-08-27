import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { getProducts, getAdjustments, createAdjustment, deleteAdjustmentApi } from '../api/api';

const StockAdjustments = () => {
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [form, setForm] = useState({ product_id: '', adjustment_type: '', quantity: '', note: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const [p, a] = await Promise.all([getProducts(), getAdjustments()]);
      setProducts(p.data || []);
      setAdjustments(a.data || []);
    } catch (e) { console.error('load adjustments failed', e); }
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.product_id) { setError('Please select a product.'); return; }
    if (!form.adjustment_type) { setError('Please select a type.'); return; }
    if (!form.quantity || Number.isNaN(Number(form.quantity))) { setError('Enter a valid quantity.'); return; }
    try {
      await createAdjustment({ product_id: Number(form.product_id), adjustment_type: form.adjustment_type, quantity: Number(form.quantity), note: form.note || null });
      setForm({ product_id: '', adjustment_type: '', quantity: '', note: '' });
      setSuccess('Adjustment recorded.');
      await load();
    } catch (e) { console.error('save failed', e); setError('Failed to save adjustment.'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Adjustments</h1>
          <p className="page-subtitle">Record Missing, Wastage, and Breakage</p>
        </div>
      </div>

      <Card title="Add Adjustment">
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(5, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Product</label>
            <select className="input" value={form.product_id} onChange={e=>setForm({...form, product_id: e.target.value})}>
              <option value="">{products.length ? 'Select product' : 'No products found'}</option>
              {products.map(p => (<option key={p.id} value={p.id}>{p.name} (#{p.id})</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Type</label>
            <select className="input" value={form.adjustment_type} onChange={e=>setForm({...form, adjustment_type: e.target.value})}>
              <option value="">Select type</option>
              <option value="Missing">Missing</option>
              <option value="Wastage">Wastage</option>
              <option value="Breakage">Breakage</option>
            </select>
          </div>
          <div className="input-group">
            <label>Quantity</label>
            <input className="input" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} inputMode="numeric" />
          </div>
          <div className="input-group">
            <label>Note (optional)</label>
            <input className="input" value={form.note} onChange={e=>setForm({...form, note: e.target.value})} />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit">Add</button>
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <Card title="Adjustments List">
        <table className="table table-hover">
          <thead><tr><th>ID</th><th>Product</th><th>Type</th><th>Qty</th><th>Note</th><th>When</th><th>Actions</th></tr></thead>
          <tbody>
            {adjustments.map(a => (
              <tr key={a.id}>
                <td>#{a.id}</td>
                <td>{a.product_name || `#${a.product_id}`}</td>
                <td>{a.adjustment_type}</td>
                <td>{a.quantity}</td>
                <td>{a.note || '-'}</td>
                <td>{new Date(a.created_at).toLocaleString()}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn danger btn-sm" onClick={async()=>{ try{ await deleteAdjustmentApi(a.id); await load(); }catch(e){ console.error('delete failed', e);} }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default StockAdjustments;

