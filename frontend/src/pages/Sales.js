import React, { useEffect, useState } from 'react';
import { getSales, createSale, updateSale, deleteSale } from '../api/api';
import { Link } from 'react-router-dom';
import Card from '../components/Card';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({ customer_id: '', total: '' });
  const [editing, setEditing] = useState(null);

  const fetchSales = async () => {
    const res = await getSales();
    setSales(res.data);
  };

  useEffect(() => { fetchSales(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id || !form.total) return;
    if (editing) {
      await updateSale(editing, { customer_id: Number(form.customer_id), total: Number(form.total) });
    } else {
      await createSale({ customer_id: Number(form.customer_id), total: Number(form.total) });
    }
    setForm({ customer_id: '', total: '' });
    setEditing(null);
    fetchSales();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sales</h1>

      <Card title={editing ? 'Edit Sale' : 'Add Sale'}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-sm">Customer ID</label>
          <input className="border p-2 w-full" value={form.customer_id} onChange={e=>setForm({...form, customer_id: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Total</label>
          <input className="border p-2 w-full" value={form.total} onChange={e=>setForm({...form, total: e.target.value})} />
        </div>
        <button className="btn" type="submit">{editing ? 'Update' : 'Add'}</button>
      </form>
      </Card>

      <Card title="Sales List">
      <table className="table mt-2">
        <thead>
          <tr><th>ID</th><th>Customer</th><th>Total</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {sales.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.customer_id}</td>
              <td>{s.total}</td>
              <td className="space-x-2">
                <Link className="btn secondary" to={`/invoice/${s.id}`}>Invoice</Link>
                <Link className="btn secondary" to={`/sales/${s.id}/items`}>Items</Link>
                <button className="btn" onClick={()=>{ setEditing(s.id); setForm({ customer_id: s.customer_id, total: s.total }); }}>Edit</button>
                <button className="btn danger" onClick={async()=>{ await deleteSale(s.id); fetchSales(); }}>Delete</button>
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

