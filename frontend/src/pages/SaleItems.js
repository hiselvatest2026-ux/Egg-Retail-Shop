import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSaleItems, createSaleItem, updateSaleItem, deleteSaleItem, getProducts } from '../api/api';
import Card from '../components/Card';

const SaleItems = () => {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ product_id: '', quantity: '', price: '' });
  const [editing, setEditing] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchItems = async () => { try { const res = await getSaleItems(id); setItems(res.data); } catch(e){ console.error('load items failed', e);} };
  useEffect(() => { fetchItems(); (async()=>{ try { const r = await getProducts(); setProducts(r.data);} catch(e){ console.error('load products failed', e);} })(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.product_id) { setError('Please select a product.'); return; }
    if (!form.quantity || Number.isNaN(Number(form.quantity))) { setError('Enter a valid quantity.'); return; }
    if (!form.price || Number.isNaN(Number(form.price))) { setError('Enter a valid price.'); return; }
    const payload = { product_id: Number(form.product_id), quantity: Number(form.quantity), price: Number(form.price) };
    try {
      if (editing) {
        await updateSaleItem(id, editing, payload);
        setSuccess('Item updated.');
      } else {
        await createSaleItem(id, payload);
        setSuccess('Item added.');
      }
      setForm({ product_id: '', quantity: '', price: '' });
      setEditing(null);
      await fetchItems();
    } catch (e) {
      console.error('submit item failed', e);
      setError(e?.response?.data?.message || 'Failed to save item.');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sale Items</h1>
          <p className="page-subtitle">Sale #{id}</p>
        </div>
      </div>

      <Card title={editing ? 'Edit Item' : 'Add Item'}>
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(4, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Product</label>
            <select className="input" value={form.product_id} onChange={e=>setForm({...form, product_id: e.target.value})}>
              <option value="">{products.length ? 'Select product' : 'No products found'}</option>
              {products.map(p => (<option key={p.id} value={p.id}>{p.name} (#{p.id})</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Qty</label>
            <input className="input" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} inputMode="numeric" />
          </div>
          <div className="input-group">
            <label>Price</label>
            <input className="input" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} inputMode="decimal" />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit">{editing ? 'Update' : 'Add'}</button>
            {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ product_id: '', quantity: '', price: '' }); }}>Cancel</button>}
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <Card title="Items List">
        <table className="table table-hover mt-2">
          <thead><tr><th>ID</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id}>
                <td>#{it.id}</td>
                <td>{it.product_name} (#{it.product_id})</td>
                <td>{it.quantity}</td>
                <td>₹ {Number(it.price).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td>₹ {Number(it.line_total).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-sm" onClick={()=>{ setEditing(it.id); setForm({ product_id: it.product_id, quantity: it.quantity, price: it.price }); }}>Edit</button>
                    <button className="btn danger btn-sm" onClick={async()=>{ try{ await deleteSaleItem(id, it.id); await fetchItems(); }catch(e){ console.error('delete failed', e);} }}>Delete</button>
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

export default SaleItems;

