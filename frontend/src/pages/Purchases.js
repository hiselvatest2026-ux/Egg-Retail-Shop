import React, { useEffect, useState } from 'react';
import { getPurchases, createPurchase, updatePurchase, deletePurchase, getVendors, getMetals } from '../api/api';
import Card from '../components/Card';
import { Link } from 'react-router-dom';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState({ vendor_id: '', product_name: '', price_per_unit: '', quantity: '', total: '' });
  const [editing, setEditing] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [gstPercent, setGstPercent] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fetchPurchases = async () => {
    try {
      const res = await getPurchases();
      setPurchases(res.data);
    } catch (err) {
      console.error('Failed to load purchases', err);
    }
  };

  const calcTotal = (pricePerUnit, quantity, gst) => {
    const unit = Number(pricePerUnit || 0);
    const qty = Number(quantity || 0);
    const g = Number(gst || 0);
    const total = unit * qty * (1 + (g/100));
    if (!isFinite(total)) return '';
    return total.toFixed(2);
  };
  useEffect(() => { 
    fetchPurchases(); 
    (async()=>{ 
      try { const r = await getVendors(); setVendors(r.data);} catch(e){ console.error('vendors load failed', e);} 
      try { const m = await getMetals(); setMaterials(m.data || []);} catch(e){ console.error('materials load failed', e);} 
    })(); 
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.vendor_id) { setError('Please select a vendor.'); return; }
    if (!form.product_name) { setError('Please select a product.'); return; }
    if (!form.price_per_unit || Number.isNaN(Number(form.price_per_unit))) { setError('Please enter a valid price per unit.'); return; }
    if (!form.quantity || Number.isNaN(Number(form.quantity))) { setError('Please enter a valid quantity.'); return; }
    try {
      const payload = { 
        vendor_id: Number(form.vendor_id), 
        product_name: form.product_name,
        price_per_unit: Number(form.price_per_unit),
        quantity: Number(form.quantity),
        gst_percent: Number(gstPercent)
      };
      if (editing) { await updatePurchase(editing, payload); } else { await createPurchase(payload); }
      setForm({ vendor_id: '', product_name: '', price_per_unit: '', quantity: '', total: '' });
      setEditing(null);
      await fetchPurchases();
      setSuccess('Purchase saved successfully.');
    } catch (err) {
      console.error('Failed to submit purchase', err);
      setError('Failed to save purchase. Please try again.');
    }
  };
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-subtitle">Create and manage supplier purchases</p>
        </div>
      </div>

      <Card title={editing ? 'Edit Purchase' : 'Add Purchase'}>
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(6, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Vendor</label>
            <select className="input" title={(vendors.find(v=>String(v.id)===String(form.vendor_id))?.name) || ''} value={form.vendor_id} onChange={e=>setForm({...form, vendor_id: e.target.value})}>
              <option value="">{vendors.length ? 'Select vendor' : 'No vendors found - add one first'}</option>
              {vendors.map(v => (<option key={v.id} value={v.id}>{v.vendor_code} - {v.name}</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Product Name</label>
            <select className="input" title={form.product_name || 'Select product'} value={form.product_name} onChange={e=>{
              const name = e.target.value; 
              setForm({...form, product_name: name});
              const m = materials.find(x=>x.metal_type===name);
              const nextGst = m ? Number(m.gst_percent) : 0;
              setGstPercent(nextGst);
              const total = calcTotal(form.price_per_unit, form.quantity, nextGst);
              setForm(prev=>({...prev, total}));
            }}>
              <option value="">Select product</option>
              {materials.map(m => (<option key={m.id} value={m.metal_type}>{m.metal_type}</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Price per unit</label>
            <input className="input" value={form.price_per_unit} inputMode="decimal" onChange={e=>{
              const v = e.target.value; setForm({...form, price_per_unit: v});
              const total = calcTotal(v, form.quantity, gstPercent); setForm(prev=>({...prev, total}));
            }} />
          </div>
          <div className="input-group">
            <label>Quantity</label>
            <input className="input" value={form.quantity} inputMode="numeric" onChange={e=>{
              const v = e.target.value; setForm({...form, quantity: v});
              const total = calcTotal(form.price_per_unit, v, gstPercent); setForm(prev=>({...prev, total}));
            }} />
          </div>
          <div className="input-group">
            <label>GST %</label>
            <input className="input" value={gstPercent} readOnly disabled />
          </div>
          <div className="input-group">
            <label>Total Amount</label>
            <input className="input" value={form.total} readOnly />
          </div>
          <div className="actions-row">
            <button className="btn w-full sm:w-auto" type="submit">{editing ? 'Update Purchase' : 'Add Purchase'}</button>
            {editing && (
              <button
                type="button"
                className="btn secondary w-full sm:w-auto"
                onClick={() => { setEditing(null); setForm({ supplier_id: '', total: '', egg_type: '' }); }}
              >
                Cancel
              </button>
            )}
          </div>
          {error && <div className="form-help">{error}</div>}
          {success && <div className="toast">{success}</div>}
        </form>
      </Card>

      <Card title="Purchases List">
        <div className="hidden sm:block">
          <table className="table table-hover mt-2">
            <thead>
              <tr>
                <th>#</th>
                <th>Vendor</th>
                <th>Product</th>
                <th>Price/Unit</th>
                <th>Qty</th>
                <th>GST%</th>
                <th>Total</th>
                <th style={{ width: 240 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td><span className="badge">{p.vendor_id || '-'}</span></td>
                  <td>{p.product_name || '-'}</td>
                  <td>{p.price_per_unit != null ? Number(p.price_per_unit).toFixed(2) : '-'}</td>
                  <td>{p.quantity != null ? p.quantity : '-'}</td>
                  <td>{p.gst_percent != null ? Number(p.gst_percent).toFixed(2) : '-'}</td>
                  <td>₹ {p.total != null ? Number(p.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                  <td>
                    <div className="btn-group">
                      <Link className="btn secondary btn-sm" to={`/purchases/${p.id}/items`}>Items</Link>
                      <button className="btn btn-sm" onClick={() => { 
                        setEditing(p.id); 
                        setGstPercent(p.gst_percent || 0);
                        setForm({ vendor_id: p.vendor_id || '', product_name: p.product_name || '', price_per_unit: p.price_per_unit || '', quantity: p.quantity || '', total: p.total || '' });
                      }}>Edit</button>
                      <button className="btn danger btn-sm" onClick={async () => { try { await deletePurchase(p.id); await fetchPurchases(); } catch (e) { console.error('Delete failed', e); } }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="block sm:hidden">
          {purchases.map(p => (
            <div key={p.id} className="card" style={{marginBottom:10}}>
              <div className="card-body">
                <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Purchase #{p.id}</span>
                </div>
                <div style={{fontSize:13, color:'#9fb0c2', marginBottom:8}}>Vendor: #{p.vendor_id || '-'}</div>
                <div style={{display:'flex', gap:12, flexWrap:'wrap', fontSize:14}}>
                  <div><strong>Product:</strong> {p.product_name || '-'}</div>
                  <div><strong>Price/Unit:</strong> ₹ {p.price_per_unit != null ? Number(p.price_per_unit).toFixed(2) : '-'}</div>
                  <div><strong>Qty:</strong> {p.quantity != null ? p.quantity : '-'}</div>
                  <div><strong>GST%:</strong> {p.gst_percent != null ? Number(p.gst_percent).toFixed(2) : '-'}</div>
                  <div><strong>Total:</strong> ₹ {p.total != null ? Number(p.total).toFixed(2) : '-'}</div>
                </div>
                <div className="btn-group" style={{marginTop:10}}>
                  <Link className="btn secondary btn-sm" to={`/purchases/${p.id}/items`}>Items</Link>
                  <button className="btn btn-sm" onClick={() => { 
                    setEditing(p.id); 
                    setGstPercent(p.gst_percent || 0);
                    setForm({ vendor_id: p.vendor_id || '', product_name: p.product_name || '', price_per_unit: p.price_per_unit || '', quantity: p.quantity || '', total: p.total || '' });
                  }}>Edit</button>
                  <button className="btn danger btn-sm" onClick={async () => { try { await deletePurchase(p.id); await fetchPurchases(); } catch (e) { console.error('Delete failed', e); } }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
export default Purchases;