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
  return (<div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Purchase</h1>
    <Card title={editing ? 'Edit Purchase' : 'Add Purchase'}>
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
      <div>
        <label className="block text-sm">Supplier ID</label>
        <input className="border p-2 w-full" value={form.supplier_id} onChange={e=>setForm({...form, supplier_id: e.target.value})} />
      </div>
      <div>
        <label className="block text-sm">Total</label>
        <input className="border p-2 w-full" value={form.total} onChange={e=>setForm({...form, total: e.target.value})} />
      </div>
      <button className="btn" type="submit">{editing ? 'Update' : 'Add'}</button>
    </form>
    </Card>
    <Card title="Purchases List">
    <table className="table mt-2">
      <thead><tr><th>ID</th><th>Supplier</th><th>Total</th><th>Actions</th></tr></thead>
      <tbody>{purchases.map(p => (<tr key={p.id}>
        <td>{p.id}</td><td>{p.supplier_id}</td><td>{p.total}</td>
        <td className="space-x-2">
          <a className="btn secondary" href={`/purchases/${p.id}/items`}>Items</a>
          <button className="btn" onClick={()=>{ setEditing(p.id); setForm({ supplier_id: p.supplier_id, total: p.total }); }}>Edit</button>
          <button className="btn danger" onClick={()=>{deletePurchase(p.id); fetchPurchases();}}>Delete</button>
        </td>
      </tr>))}</tbody>
    </table>
    </Card>
  </div>);
}
export default Purchases;