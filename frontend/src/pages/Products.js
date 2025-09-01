import React, { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/api';
import Card from '../components/Card';

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
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <Card title={editing ? 'Edit Product' : 'Add Product'}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
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
        <button className="btn w-full sm:w-auto" type="submit">{editing ? 'Update' : 'Add'}</button>
      </form>
      </Card>

      <Card title="Products List">
        <div className="hidden sm:block">
          <table className="table mt-2">
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
                    <button className="btn" onClick={()=>startEdit(p)}>Edit</button>
                    <button className="btn danger" onClick={async()=>{ await deleteProduct(p.id); fetchProducts(); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="block sm:hidden">
          {products.map(p => (
            <div key={p.id} className="card" style={{marginBottom:10}}>
              <div className="card-body">
                <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Product #{p.id}</span>
                </div>
                <div className="data-pairs">
                  <div className="pair"><strong>Name:</strong> {p.name}</div>
                  <div className="pair"><strong>Price:</strong> ₹ {Number(p.price||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                  <div className="pair"><strong>Batch:</strong> {p.batch_number || '-'}</div>
                  <div className="pair"><strong>Expiry:</strong> {p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '-'}</div>
                </div>
                <div className="btn-group" style={{marginTop:10}}>
                  <button className="btn btn-sm" onClick={()=>startEdit(p)}>Edit</button>
                  <button className="btn danger btn-sm" onClick={async()=>{ await deleteProduct(p.id); fetchProducts(); }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Products;

