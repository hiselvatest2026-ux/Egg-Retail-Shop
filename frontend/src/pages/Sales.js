import React, { useEffect, useState } from 'react';
import { getSales, createSale, updateSale, deleteSale, getCustomers } from '../api/api';
import { Link } from 'react-router-dom';
import Card from '../components/Card';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({ customer_id: '', total: '', egg_type: '' });
  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState(null);

  const fetchSales = async () => {
    try {
      const res = await getSales();
      setSales(res.data);
    } catch (err) {
      console.error('Failed to load sales', err);
    }
  };

  useEffect(() => { fetchSales(); (async()=>{ try { const r = await getCustomers(); setCustomers(r.data);} catch(e){ console.error('customers load failed', e);} })(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id || !form.total) return;
    try {
      if (editing) {
        await updateSale(editing, { customer_id: Number(form.customer_id), total: Number(form.total), egg_type: form.egg_type || null });
      } else {
        await createSale({ customer_id: Number(form.customer_id), total: Number(form.total), egg_type: form.egg_type || null });
      }
      setForm({ customer_id: '', total: '', egg_type: '' });
      setEditing(null);
      await fetchSales();
    } catch (err) {
      console.error('Failed to submit sale', err);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="page-subtitle">Record sales and access invoices</p>
        </div>
      </div>

      <Card title={editing ? 'Edit Sale' : 'Add Sale'}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="input-group">
            <label>Customer</label>
            <select className="input" value={form.customer_id} onChange={e=>setForm({...form, customer_id: e.target.value})}>
              <option value="">Select customer</option>
              {customers.map(c => (<option key={c.id} value={c.id}>{c.name} (#{c.id})</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Total Amount</label>
            <input className="input" placeholder="e.g. 1450.00" value={form.total} onChange={e=>setForm({...form, total: e.target.value})} inputMode="decimal" />
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
            <button className="btn" type="submit">{editing ? 'Update Sale' : 'Add Sale'}</button>
            {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ customer_id: '', total: '', egg_type: '' }); }}>Cancel</button>}
          </div>
        </form>
      </Card>

      <Card title="Sales List">
        <table className="table table-hover mt-2">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Total</th><th>Egg Type</th><th style={{width:260}}>Actions</th></tr>
          </thead>
          <tbody>
            {sales.map(s => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td><span className="badge">{s.customer_id}</span></td>
                <td>₹ {Number(s.total).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td>{s.egg_type || '-'}</td>
                <td>
                  <div className="btn-group">
                    <Link className="btn secondary btn-sm" to={`/invoice/${s.id}`}>Invoice</Link>
                    <Link className="btn secondary btn-sm" to={`/sales/${s.id}/items`}>Items</Link>
                    <button className="btn btn-sm" onClick={()=>{ setEditing(s.id); setForm({ customer_id: s.customer_id, total: s.total, egg_type: s.egg_type || '' }); }}>Edit</button>
                    <button className="btn danger btn-sm" onClick={async()=>{ try { await deleteSale(s.id); await fetchSales(); } catch(e) { console.error('Delete failed', e); } }}>Delete</button>
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

export default Sales;

