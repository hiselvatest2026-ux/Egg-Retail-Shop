import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPurchaseItems, createPurchaseItem, updatePurchaseItem, deletePurchaseItem } from '../api/api';

const PurchaseItems = () => {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ product_id: '', quantity: '', price: '' });
  const [editing, setEditing] = useState(null);

  const fetchItems = async () => { const res = await getPurchaseItems(id); setItems(res.data); };
  useEffect(() => { fetchItems(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { product_id: Number(form.product_id), quantity: Number(form.quantity), price: Number(form.price) };
    if (editing) {
      await updatePurchaseItem(id, editing, payload);
    } else {
      await createPurchaseItem(id, payload);
    }
    setForm({ product_id: '', quantity: '', price: '' });
    setEditing(null);
    fetchItems();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Purchase Items (Purchase #{id})</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end mb-4">
        <div>
          <label className="block text-sm">Product ID</label>
          <input className="border p-2 w-full" value={form.product_id} onChange={e=>setForm({...form, product_id: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Qty</label>
          <input className="border p-2 w-full" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Price</label>
          <input className="border p-2 w-full" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} />
        </div>
        <button className="bg-green-600 text-white px-3 py-2 rounded" type="submit">{editing ? 'Update' : 'Add'}</button>
      </form>

      <table className="w-full mt-4 border">
        <thead><tr><th>ID</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th><th>Actions</th></tr></thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id}>
              <td>{it.id}</td>
              <td>{it.product_name} (#{it.product_id})</td>
              <td>{it.quantity}</td>
              <td>{it.price}</td>
              <td>{it.line_total}</td>
              <td className="space-x-2">
                <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={()=>{ setEditing(it.id); setForm({ product_id: it.product_id, quantity: it.quantity, price: it.price }); }}>Edit</button>
                <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={async()=>{ await deletePurchaseItem(id, it.id); fetchItems(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PurchaseItems;

