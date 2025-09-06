import React, { useEffect, useMemo, useState } from 'react';
import { getPurchases, createPurchase, updatePurchase, deletePurchase, getVendors, getMetals } from '../api/api';
import Card from '../components/Card';
import { Link } from 'react-router-dom';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
  const filteredPurchases = useMemo(() => {
    let list = purchases || [];
    if (vendorFilter) list = list.filter(p => String(p.vendor_id) === String(vendorFilter));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        String(p.id).includes(q)
        || String(p.vendor_id||'').includes(q)
        || String(p.product_name||'').toLowerCase().includes(q)
      );
    }
    return list;
  }, [purchases, search, vendorFilter]);
  const getVendorLabel = (vendorId) => {
    const v = vendors.find(x => String(x.id) === String(vendorId));
    if (!v) return '-';
    return `${v.vendor_code} - ${v.name}`;
  };
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedPurchases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPurchases.slice(start, start + pageSize);
  }, [filteredPurchases, currentPage, pageSize]);
  return (
    <div className="page space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-subtitle">Create and manage supplier purchases</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title={editing ? 'Edit Purchase' : 'Add Purchase'}>
        <form onSubmit={handleSubmit} className="form-grid-2">
          <div className="input-group">
            <label>Vendor</label>
            <select className="input" required aria-label="Vendor" title={(vendors.find(v=>String(v.id)===String(form.vendor_id))?.name) || ''} value={form.vendor_id} onChange={e=>setForm({...form, vendor_id: e.target.value})}>
              <option value="" disabled>{vendors.length ? 'Select vendor' : 'No vendors found - add one first'}</option>
              {vendors.map(v => (<option key={v.id} value={v.id}>{v.vendor_code} - {v.name}</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Product Name</label>
            <select className="input" required aria-label="Product" title={form.product_name || 'Select product'} value={form.product_name} onChange={e=>{
              const name = e.target.value; 
              setForm({...form, product_name: name});
              const m = materials.find(x=>x.metal_type===name);
              const nextGst = m ? Number(m.gst_percent) : 0;
              setGstPercent(nextGst);
              const total = calcTotal(form.price_per_unit, form.quantity, nextGst);
              setForm(prev=>({...prev, total}));
            }}>
              <option value="" disabled>Select product</option>
              {materials.map(m => (<option key={m.id} value={m.metal_type}>{m.metal_type}</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Price per unit</label>
            <input className="input" type="number" step="0.01" value={form.price_per_unit} inputMode="decimal" onChange={e=>{
              const v = e.target.value; setForm({...form, price_per_unit: v});
              const total = calcTotal(v, form.quantity, gstPercent); setForm(prev=>({...prev, total}));
            }} />
          </div>
          <div className="input-group">
            <label>Quantity</label>
            <input className="input" type="number" value={form.quantity} inputMode="numeric" onChange={e=>{
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
          <div className="actions-row sticky-actions" style={{justifyContent:'flex-end', gridColumn:'1/-1'}}>
            <button className="btn primary w-full sm:w-auto" type="submit">{editing ? 'Update Purchase' : 'Add Purchase'}</button>
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
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3">
          <input className="input w-full sm:w-72" placeholder="Search by #, vendor, product" value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
          <select className="input w-full sm:w-52" value={vendorFilter} onChange={e=>{ setVendorFilter(e.target.value); setPage(1); }}>
            <option value="">All Vendors</option>
            {vendors.map(v => (<option key={v.id} value={v.id}>{v.vendor_code} - {v.name}</option>))}
          </select>
          <div className="ml-auto flex items-center gap-3">
            <select className="input w-28" value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
            <div className="btn-group">
              <button type="button" className="btn secondary btn-sm" onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={currentPage===1}>Prev</button>
              <button type="button" className="btn secondary btn-sm" onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>Next</button>
            </div>
            <div style={{color:'#b6beca', fontSize:12}}>Page {currentPage} / {totalPages}</div>
          </div>
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <table className="table table-hover table-zebra mt-2">
            <thead>
              <tr>
                <th>#</th>
                <th>Vendor</th>
                <th>Product</th>
                <th>Price/Unit</th>
                <th>Qty</th>
                <th>GST%</th>
                <th>Total</th>
                <th style={{ width: 240, textAlign:'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedPurchases.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td><span className="badge">{getVendorLabel(p.vendor_id)}</span></td>
                  <td>{p.product_name || '-'}</td>
                  <td>{p.price_per_unit != null ? Number(p.price_per_unit).toFixed(2) : '-'}</td>
                  <td>{p.quantity != null ? p.quantity : '-'}</td>
                  <td>{p.gst_percent != null ? Number(p.gst_percent).toFixed(2) : '-'}</td>
                  <td>₹ {p.total != null ? Number(p.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                  <td style={{textAlign:'right'}}>
                    <div className="btn-group" style={{justifyContent:'flex-end'}}>
                      <Link className="btn secondary btn-sm" to={`/purchases/${p.id}/items`}>Items</Link>
                      <button className="btn icon btn-sm" title="Edit" onClick={() => { 
                        setEditing(p.id); 
                        setGstPercent(p.gst_percent || 0);
                        setForm({ vendor_id: p.vendor_id || '', product_name: p.product_name || '', price_per_unit: p.price_per_unit || '', quantity: p.quantity || '', total: p.total || '' });
                      }}>✏️</button>
                      <button className="btn danger btn-sm" onClick={async () => { try { await deletePurchase(p.id); await fetchPurchases(); } catch (e) { console.error('Delete failed', e); } }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="block sm:hidden">
          {filteredPurchases.length === 0 && (
            <div className="card" style={{padding:16, textAlign:'center'}}>No purchases yet. Use the form to add.</div>
          )}
          {pagedPurchases.map(p => (
            <div key={p.id} className="card" style={{marginBottom:10}}>
              <div className="card-body">
                <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Purchase #{p.id}</span>
                </div>
                <div style={{fontSize:13, color:'#9fb0c2', marginBottom:8}}>Vendor: {getVendorLabel(p.vendor_id)}</div>
                <div className="flex flex-col gap-1 text-sm">
                  <div><strong>Product:</strong> {p.product_name || '-'}</div>
                  <div><strong>Price/Unit:</strong> ₹ {p.price_per_unit != null ? Number(p.price_per_unit).toFixed(2) : '-'}</div>
                  <div><strong>Qty:</strong> {p.quantity != null ? p.quantity : '-'}</div>
                  <div><strong>GST%:</strong> {p.gst_percent != null ? Number(p.gst_percent).toFixed(2) : '-'}</div>
                  <div><strong>Total:</strong> ₹ {p.total != null ? Number(p.total).toFixed(2) : '-'}</div>
                </div>
                <div className="btn-group" style={{marginTop:10}}>
                  <Link className="btn secondary btn-sm" to={`/purchases/${p.id}/items`}>Items</Link>
                  <button className="btn icon btn-sm" onClick={() => { 
                    setEditing(p.id); 
                    setGstPercent(p.gst_percent || 0);
                    setForm({ vendor_id: p.vendor_id || '', product_name: p.product_name || '', price_per_unit: p.price_per_unit || '', quantity: p.quantity || '', total: p.total || '' });
                  }}>✏️</button>
                  <button className="btn danger btn-sm" onClick={async () => { try { await deletePurchase(p.id); await fetchPurchases(); } catch (e) { console.error('Delete failed', e); } }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
    </div>
  );
}
export default Purchases;
