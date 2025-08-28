import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { getSuppliers, getProducts, getPurchaseOrders, createPurchaseOrder, addPurchaseOrderItem, receivePurchaseOrder, deletePurchaseOrder, getReorderSuggestions, getSupplierPerformance } from '../api/api';

const PurchaseOrders = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [pos, setPOs] = useState([]);
  const [form, setForm] = useState({ supplier_id: '', expected_date: '', notes: '' });
  const [itemForm, setItemForm] = useState({ po_id: '', product_id: '', quantity: '', price: '' });
  const [reorder, setReorder] = useState([]);
  const [perf, setPerf] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [s, p, o, r, pf] = await Promise.all([getSuppliers(), getProducts(), getPurchaseOrders(), getReorderSuggestions(), getSupplierPerformance()]);
    setSuppliers(s.data||[]); setProducts(p.data||[]); setPOs(o.data||[]); setReorder(r.data||[]); setPerf(pf.data||[]);
  };
  useEffect(()=>{ load(); }, []);

  const handleCreatePO = async (e) => {
    e.preventDefault(); setMsg('');
    if (!form.supplier_id) { setMsg('Select supplier'); return; }
    await createPurchaseOrder({ supplier_id: Number(form.supplier_id), expected_date: form.expected_date || null, notes: form.notes || null, items: [] });
    setForm({ supplier_id:'', expected_date:'', notes:'' });
    await load();
    setMsg('PO created');
  };

  const handleAddItem = async (e) => {
    e.preventDefault(); setMsg('');
    if (!itemForm.po_id || !itemForm.product_id || !itemForm.quantity || !itemForm.price) { setMsg('Fill all item fields'); return; }
    await addPurchaseOrderItem(itemForm.po_id, { product_id: Number(itemForm.product_id), quantity: Number(itemForm.quantity), price: Number(itemForm.price) });
    setItemForm({ po_id:'', product_id:'', quantity:'', price:'' });
    await load();
    setMsg('Item added');
  };

  const handleReceive = async (poId) => { setMsg(''); await receivePurchaseOrder(poId); await load(); setMsg('PO received'); };
  const handleDelete = async (poId) => { setMsg(''); await deletePurchaseOrder(poId); await load(); setMsg('PO deleted'); };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Create, manage, and receive POs</p>
        </div>
      </div>

      <Card title="Create PO">
        <form onSubmit={handleCreatePO} className="form-grid" style={{gridTemplateColumns:'repeat(4, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Supplier</label>
            <select className="input" value={form.supplier_id} onChange={e=>setForm({...form, supplier_id:e.target.value})}>
              <option value="">Select supplier</option>
              {suppliers.map(s=> (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Expected Date</label>
            <input className="input" type="date" value={form.expected_date} onChange={e=>setForm({...form, expected_date:e.target.value})} />
          </div>
          <div className="input-group">
            <label>Notes</label>
            <input className="input" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit">Create</button>
          </div>
          {msg && <div className="toast" style={{gridColumn:'1/-1'}}>{msg}</div>}
        </form>
      </Card>

      <div style={{height:12}} />

      <Card title="Add PO Item">
        <form onSubmit={handleAddItem} className="form-grid" style={{gridTemplateColumns:'repeat(5, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>PO</label>
            <select className="input" value={itemForm.po_id} onChange={e=>setItemForm({...itemForm, po_id:e.target.value})}>
              <option value="">Select PO</option>
              {pos.map(po=> (<option key={po.id} value={po.id}>PO #{po.id}</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Product</label>
            <select className="input" value={itemForm.product_id} onChange={e=>setItemForm({...itemForm, product_id:e.target.value})}>
              <option value="">Select product</option>
              {products.map(p=> (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Qty</label>
            <input className="input" value={itemForm.quantity} onChange={e=>setItemForm({...itemForm, quantity:e.target.value})} inputMode="numeric" />
          </div>
          <div className="input-group">
            <label>Price</label>
            <input className="input" value={itemForm.price} onChange={e=>setItemForm({...itemForm, price:e.target.value})} inputMode="decimal" />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit">Add Item</button>
          </div>
        </form>
      </Card>

      <div style={{height:12}} />

      <Card title="Purchase Orders">
        <table className="table table-hover">
          <thead><tr><th>#</th><th>Supplier</th><th>Status</th><th>Expected</th><th>Value</th><th>Actions</th></tr></thead>
          <tbody>
            {pos.map(po => (
              <tr key={po.id}>
                <td>#{po.id}</td>
                <td>{po.supplier_id}</td>
                <td>{po.status}</td>
                <td>{po.expected_date || '-'}</td>
                <td>₹ {Number(po.po_value||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-sm" onClick={()=>handleReceive(po.id)} disabled={po.status==='Received'}>Receive</button>
                    <button className="btn danger btn-sm" onClick={()=>handleDelete(po.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{height:12}} />

      <Card title="Reorder Suggestions">
        <table className="table table-hover">
          <thead><tr><th>Product</th><th>Stock</th></tr></thead>
          <tbody>
            {reorder.map(r => (
              <tr key={r.product_id}><td>{r.name} (#{r.product_id})</td><td>{r.stock}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{height:12}} />

      <Card title="Supplier Performance">
        <table className="table table-hover">
          <thead><tr><th>Supplier</th><th>Orders</th><th>Purchase Value</th></tr></thead>
          <tbody>
            {perf.map(s => (
              <tr key={s.supplier_id}><td>{s.supplier_name || `#${s.supplier_id}`}</td><td>{s.orders}</td><td>₹ {Number(s.total_value||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default PurchaseOrders;

