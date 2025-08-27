import React, { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', batch_number: '', expiry_date: '' });
  const [editing, setEditing] = useState(null);

  const fetchProducts = async () => { const res = await getProducts(); setProducts(res.data); };
  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: form.price ? Number(form.price) : null };
    if (editing) {
      await updateProduct(editing, payload);
    } else {
      await createProduct(payload);
    }
    setForm({ name: '', price: '', batch_number: '', expiry_date: '' });
    setEditing(null);
    fetchProducts();
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name || '', price: p.price || '', batch_number: p.batch_number || '', expiry_date: p.expiry_date ? p.expiry_date.split('T')[0] : '' });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Products</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end mb-4">
        <div>
          <label className="block text-sm">Name</label>
          <input className="border p-2 w-full" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Price</label>
          <input className="border p-2 w-full" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Batch</label>
          <input className="border p-2 w-full" value={form.batch_number} onChange={e=>setForm({...form, batch_number: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Expiry</label>
          <input type="date" className="border p-2 w-full" value={form.expiry_date} onChange={e=>setForm({...form, expiry_date: e.target.value})} />
        </div>
        <button className="bg-green-600 text-white px-3 py-2 rounded" type="submit">{editing ? 'Update' : 'Add'}</button>
      </form>

      <table className="w-full mt-4 border">
        <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Batch</th><th>Expiry</th><th>Actions</th></tr></thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.price}</td>
              <td>{p.batch_number}</td>
              <td>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : ''}</td>
              <td className="space-x-2">
                <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={()=>startEdit(p)}>Edit</button>
                <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={async()=>{ await deleteProduct(p.id); fetchProducts(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Products;

