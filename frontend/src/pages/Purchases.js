import React, { useEffect, useState } from 'react';
import { getPurchases, createPurchase, updatePurchase, deletePurchase } from '../api/api';

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
  return (<div className="p-4">
    <h1 className="text-xl font-bold mb-4">Purchases</h1>
    <form onSubmit={handleSubmit} className="flex gap-2 items-end mb-4">
      <div>
        <label className="block text-sm">Supplier ID</label>
        <input className="border p-2" value={form.supplier_id} onChange={e=>setForm({...form, supplier_id: e.target.value})} />
      </div>
      <div>
        <label className="block text-sm">Total</label>
        <input className="border p-2" value={form.total} onChange={e=>setForm({...form, total: e.target.value})} />
      </div>
      <button className="bg-green-600 text-white px-3 py-2 rounded" type="submit">Add Purchase</button>
    </form>
    <table className="w-full mt-4 border">
      <thead><tr><th>ID</th><th>Supplier</th><th>Total</th><th>Actions</th></tr></thead>
      <tbody>{purchases.map(p => (<tr key={p.id}>
        <td>{p.id}</td><td>{p.supplier_id}</td><td>{p.total}</td>
        <td className="space-x-2">
          <a className="bg-purple-700 text-white px-2 py-1 rounded" href={`/purchases/${p.id}/items`}>Items</a>
          <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={()=>{ setEditing(p.id); setForm({ supplier_id: p.supplier_id, total: p.total }); }}>Edit</button>
          <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={()=>{deletePurchase(p.id); fetchPurchases();}}>Delete</button>
        </td>
      </tr>))}</tbody>
    </table>
  </div>);
}
export default Purchases;