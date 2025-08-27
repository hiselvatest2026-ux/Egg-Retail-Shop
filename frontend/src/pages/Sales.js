import React, { useEffect, useState } from 'react';
import { getSales, createSale, deleteSale } from '../api/api';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({ customer_id: '', total: '' });

  const fetchSales = async () => {
    const res = await getSales();
    setSales(res.data);
  };

  useEffect(() => { fetchSales(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id || !form.total) return;
    await createSale({ customer_id: Number(form.customer_id), total: Number(form.total) });
    setForm({ customer_id: '', total: '' });
    fetchSales();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Sales</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end mb-4">
        <div>
          <label className="block text-sm">Customer ID</label>
          <input className="border p-2" value={form.customer_id} onChange={e=>setForm({...form, customer_id: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Total</label>
          <input className="border p-2" value={form.total} onChange={e=>setForm({...form, total: e.target.value})} />
        </div>
        <button className="bg-green-600 text-white px-3 py-2 rounded" type="submit">Add Sale</button>
      </form>

      <table className="w-full mt-4 border">
        <thead>
          <tr><th>ID</th><th>Customer</th><th>Total</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {sales.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.customer_id}</td>
              <td>{s.total}</td>
              <td>
                <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={async()=>{ await deleteSale(s.id); fetchSales(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Sales;

