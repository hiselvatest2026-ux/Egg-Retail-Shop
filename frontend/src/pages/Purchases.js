import React, { useEffect, useMemo, useState } from 'react';
import { getPurchases, createPurchase, updatePurchase, deletePurchase, getVendors, getMetals } from '../api/api';
import Card from '../components/Card';
import { Link } from 'react-router-dom';
import Dropdown from '../components/Dropdown';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({ vendor_id: '', product_name: '', price_per_unit: '', quantity: '', quantity_unit: 'Piece', trays: '', total: '' });
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
  const getEffectiveQty = () => {
    const isTray = String(form.quantity_unit) === 'Tray';
    const trays = Number(form.trays || 0);
    const pieces = Number(form.quantity || 0);
    return isTray ? trays * 30 : pieces;
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
        quantity: Number(getEffectiveQty()),
        gst_percent: Number(gstPercent)
      };
      if (editing) { await updatePurchase(editing, payload); } else { await createPurchase(payload); }
      setForm({ vendor_id: '', product_name: '', price_per_unit: '', quantity: '', quantity_unit: 'Piece', trays: '', total: '' });
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
  const visiblePurchases = useMemo(() => {
    // Load-More model: show items up to current page * pageSize
    const count = page * pageSize;
    return filteredPurchases.slice(0, count);
  }, [filteredPurchases, page, pageSize]);
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
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Vendor</label>
            <Dropdown
              value={form.vendor_id}
              onChange={v=>setForm({...form, vendor_id: v})}
              placeholder={vendors.length ? 'Select vendor' : 'No vendors found - add one first'}
              options={vendors.map(v=>({ value: String(v.id), label: `${v.vendor_code} - ${v.name}` }))}
            />
          </div>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Product Name</label>
            <Dropdown
              value={form.product_name}
              onChange={(name)=>{
                setForm({...form, product_name: name});
                const m = materials.find(x=>x.metal_type===name);
                const nextGst = m ? Number(m.gst_percent) : 0;
                setGstPercent(nextGst);
                const total = calcTotal(form.price_per_unit, form.quantity, nextGst);
                setForm(prev=>({...prev, total}));
              }}
              placeholder={'Select product'}
              options={materials.map(m=>({ value: m.metal_type, label: m.metal_type }))}
            />
          </div>
          <div className="input-group">
            <label>Price per unit</label>
            <input className="input" type="number" step="0.01" value={form.price_per_unit} inputMode="decimal" onChange={e=>{
              const v = e.target.value; setForm({...form, price_per_unit: v});
              const total = calcTotal(v, getEffectiveQty(), gstPercent); setForm(prev=>({...prev, total}));
            }} />
          </div>
          <div className="input-group">
            <label>Quantity (pieces)</label>
            <input className="input" type="number" value={form.quantity} inputMode="numeric" onChange={e=>{
              const v = e.target.value; setForm({...form, quantity: v});
              const total = calcTotal(form.price_per_unit, getEffectiveQty(), gstPercent); setForm(prev=>({...prev, total}));
            }} />
          </div>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Quantity Unit</label>
            <Dropdown
              value={form.quantity_unit}
              onChange={(v)=>{
                setForm(prev=>({ ...prev, quantity_unit: v }));
                const total = calcTotal(form.price_per_unit, v==='Tray' ? (Number(form.trays||0)*30) : Number(form.quantity||0), gstPercent);
                setForm(prev=>({...prev, total}));
              }}
              options={[{value:'Piece',label:'Single Piece'},{value:'Tray',label:'Tray (30 pcs)'}]}
            />
          </div>
          <div className="input-group">
            <label>Number of Trays</label>
            <input className="input" type="number" value={form.trays} inputMode="numeric" onChange={e=>{
              const v = e.target.value; setForm({...form, trays: v});
              const total = calcTotal(form.price_per_unit, getEffectiveQty(), gstPercent); setForm(prev=>({...prev, total}));
            }} />
          </div>
          <div className="input-group">
            <label>Effective Qty (pcs)</label>
            <input className="input" value={getEffectiveQty()} readOnly />
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
          <div className="w-full sm:w-52" style={{overflow:'visible'}}>
            <Dropdown
              value={vendorFilter}
              onChange={v=>{ setVendorFilter(v); setPage(1); }}
              placeholder={'All Vendors'}
              options={[{value:'', label:'All Vendors'}, ...vendors.map(v=>({ value: String(v.id), label: `${v.vendor_code} - ${v.name}` }))]}
            />
          </div>
          <input className="input w-full sm:w-72" placeholder="Search by #, vendor, product" value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
          <div className="ml-auto flex items-center gap-3" style={{overflow:'visible'}}>
            <div className="w-36" style={{minWidth:'9rem'}}>
              <Dropdown
                value={String(pageSize)}
                onChange={(v)=>{ setPageSize(Number(v)); setPage(1); }}
                options={[
                  { value: '5', label: '5 / page' },
                  { value: '10', label: '10 / page' },
                  { value: '20', label: '20 / page' }
                ]}
              />
            </div>
          </div>
        </div>
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="table table-hover table-zebra mt-2">
            <thead>
              <tr>
                <th>#</th>
                <th>Vendor</th>
                <th>Product</th>
                <th style={{textAlign:'right'}}>Price/Unit</th>
                <th style={{textAlign:'right'}}>Qty</th>
                <th style={{textAlign:'right'}}>GST%</th>
                <th style={{textAlign:'right'}}>Total</th>
                <th style={{ width: 160, textAlign:'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedPurchases.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td><span className="badge">{getVendorLabel(p.vendor_id)}</span></td>
                  <td>{p.product_name || '-'}</td>
                  <td style={{textAlign:'right'}}>{p.price_per_unit != null ? Number(p.price_per_unit).toFixed(2) : '-'}</td>
                  <td style={{textAlign:'right'}}>{p.quantity != null ? p.quantity : '-'}</td>
                  <td style={{textAlign:'right'}}>{p.gst_percent != null ? Number(p.gst_percent).toFixed(2) : '-'}</td>
                  <td style={{textAlign:'right'}}>₹ {p.total != null ? Number(p.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                  <td style={{textAlign:'right'}}>
                    <div className="btn-group" style={{justifyContent:'flex-end'}}>
                      <button className="btn icon btn-sm" title="Edit" onClick={() => { 
                        setEditing(p.id); 
                        setGstPercent(p.gst_percent || 0);
                        setForm({ vendor_id: p.vendor_id || '', product_name: p.product_name || '', price_per_unit: p.price_per_unit || '', quantity: p.quantity || '', total: p.total || '' });
                      }}>✏️</button>
                      <button className="btn danger btn-sm" title="Delete" onClick={async () => { try { await deletePurchase(p.id); await fetchPurchases(); } catch (e) { console.error('Delete failed', e); } }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        {visiblePurchases.length === 0 && (
          <div className="card sm:hidden" style={{padding:16, textAlign:'center'}}>No purchases yet. Use the form to add.</div>
        )}
        <div className="block sm:hidden">
          {visiblePurchases.map(p => (
            <div key={p.id} className="card" style={{marginBottom:12}}>
              <div className="card-body">
                <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Purchase #{p.id}</span>
                </div>
                <div className="data-pairs">
                  <div className="pair"><strong>Vendor</strong><div>{getVendorLabel(p.vendor_id)}</div></div>
                  <div className="pair"><strong>Product</strong><div>{p.product_name || '-'}</div></div>
                  <div className="pair" style={{textAlign:'right'}}><strong>Price/Unit</strong><div>₹ {p.price_per_unit != null ? Number(p.price_per_unit).toFixed(2) : '-'}</div></div>
                  <div className="pair" style={{textAlign:'right'}}><strong>Qty</strong><div>{p.quantity != null ? p.quantity : '-'}</div></div>
                  <div className="pair" style={{textAlign:'right'}}><strong>GST%</strong><div>{p.gst_percent != null ? Number(p.gst_percent).toFixed(2) : '-'}</div></div>
                  <div className="pair" style={{textAlign:'right'}}><strong>Total</strong><div>₹ {p.total != null ? Number(p.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</div></div>
                </div>
                <div className="btn-group" style={{marginTop:10}}>
                  <button className="btn icon btn-sm" title="Edit" onClick={() => { 
                    setEditing(p.id); 
                    setGstPercent(p.gst_percent || 0);
                    setForm({ vendor_id: p.vendor_id || '', product_name: p.product_name || '', price_per_unit: p.price_per_unit || '', quantity: p.quantity || '', total: p.total || '' });
                  }}>✏️</button>
                  <button className="btn danger btn-sm" title="Delete" onClick={async () => { try { await deletePurchase(p.id); await fetchPurchases(); } catch (e) { console.error('Delete failed', e); } }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {visiblePurchases.length < filteredPurchases.length && (
            <div style={{display:'flex', justifyContent:'center', marginTop:12}}>
              <button type="button" className="btn primary w-full" onClick={()=> setPage(p => p + 1)}>
                Load More
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
    </div>
  );
}
export default Purchases;
