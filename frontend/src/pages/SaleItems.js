import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSaleItems, createSaleItem, updateSaleItem, deleteSaleItem } from '../api/api';
import Card from '../components/Card';

const SaleItems = () => {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ product_id: '', quantity: '', price: '' });
  const [editing, setEditing] = useState(null);

  const fetchItems = async () => { const res = await getSaleItems(id); setItems(res.data); };
  useEffect(() => { fetchItems(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { product_id: Number(form.product_id), quantity: Number(form.quantity), price: Number(form.price) };
    if (editing) {
      await updateSaleItem(id, editing, payload);
    } else {
      await createSaleItem(id, payload);
    }
    setForm({ product_id: '', quantity: '', price: '' });
    setEditing(null);
    fetchItems();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Sale Items (Sale #{id})</h1>
      <Card title={editing ? 'Edit Item' : 'Add Item'}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
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
        <button className="btn" type="submit">{editing ? 'Update' : 'Add'}</button>
      </form>
      </Card>

      <Card title="Items List">
      <table className="table mt-2">
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
                <button className="btn" onClick={()=>{ setEditing(it.id); setForm({ product_id: it.product_id, quantity: it.quantity, price: it.price }); }}>Edit</button>
                <button className="btn danger" onClick={async()=>{ await deleteSaleItem(id, it.id); fetchItems(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </Card>
    </div>
  );
};

export default SaleItems;

