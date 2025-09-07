import React, { useEffect, useMemo, useState } from 'react';
import { getPurchases, createPurchase, updatePurchase, deletePurchase, getVendors, getMetals, getProducts, createPurchaseItem } from '../api/api';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import ShopChip from '../components/ShopChip';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({ vendor_id: '', total_purchase_value: '' });
  const [editing, setEditing] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fetchPurchases = async () => {
    try {
      const res = await getPurchases();
      const list = res.data || [];
      const seen = new Set();
      const unique = [];
      for (const p of list) {
        const key = p && p.id != null ? String(p.id) : Math.random().toString(36);
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(p);
      }
      setPurchases(unique);
    } catch (err) {
      console.error('Failed to load purchases', err);
    }
  };

  const deriveGstPercents = (row) => {
    // Try to derive GST% from materials by product code or name; fallback 0
    let gst = 0;
    if (row.product_code) {
      const m = materials.find(x => String(x.part_code) === String(row.product_code));
      if (m) gst = Number(m.gst_percent || 0);
    }
    if (!gst && row.product_name) {
      const m2 = materials.find(x => String(x.metal_type).toLowerCase() === String(row.product_name).toLowerCase());
      if (m2) gst = Number(m2.gst_percent || 0);
    }
    const sgst = gst / 2;
    const cgst = gst / 2;
    return { sgst_percent: sgst, cgst_percent: cgst };
  };
  const computeRowTotals = (row) => {
    const price = Number(row.price_per_unit || 0);
    const qtyInput = Number(row.quantity || 0);
    const effectiveQty = String(row.uom||'Piece') === 'Tray' ? (qtyInput * 30) : qtyInput;
    const lineTotal = price * effectiveQty;
    const { sgst_percent, cgst_percent } = deriveGstPercents(row);
    const sgstAmt = lineTotal * (sgst_percent/100);
    const cgstAmt = lineTotal * (cgst_percent/100);
    const totalAmount = lineTotal + sgstAmt + cgstAmt;
    return { lineTotal, sgst_percent, cgst_percent, totalAmount };
  };
  useEffect(() => { 
    fetchPurchases(); 
    (async()=>{ 
      try { const r = await getVendors(); setVendors(r.data);} catch(e){ console.error('vendors load failed', e);} 
      try { const m = await getMetals(); setMaterials(m.data || []);} catch(e){ console.error('materials load failed', e);} 
      try { const p = await getProducts(); setProducts(p.data || []);} catch(e){ console.error('products load failed', e);} 
    })(); 
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.vendor_id) { setError('Please select a vendor.'); return; }
    if (!rows.length) { setError('Please add at least one row.'); return; }
    try {
      // Create minimal header, then items based on rows
      let purchaseId = editing;
      if (!editing) {
        const header = { vendor_id: Number(form.vendor_id) };
        const res = await createPurchase(header);
        purchaseId = res.data?.id || res.id;
      }
      for (const r of rows) {
        const price = Number(r.price_per_unit || 0);
        const qty = Number(r.quantity || 0);
        if (!(qty>0)) continue;
        // Map to a product_id if possible by product name
        let productId = null;
        if (r.product_name) {
          const prod = products.find(p => String(p.name).toLowerCase() === String(r.product_name).toLowerCase());
          if (prod) productId = prod.id;
        }
        if (!productId && r.product_code) {
          const mat = materials.find(m => String(m.part_code) === String(r.product_code));
          if (mat) {
            const prod2 = products.find(p => String(p.name).toLowerCase() === String(mat.metal_type||'').toLowerCase());
            if (prod2) productId = prod2.id;
          }
        }
        if (!productId) continue;
        await createPurchaseItem(purchaseId, { product_id: Number(productId), quantity: qty, price });
      }
      setSuccess('Purchase saved.');
      setForm({ vendor_id: '', total_purchase_value: '' });
      setRows([]);
      setEditing(null);
      await fetchPurchases();
    } catch (err) {
      console.error('Failed to submit purchase', err);
      setError('Failed to save purchase. Please try again.');
    }
  };
  const filteredPurchases = useMemo(() => {
    // Deduplicate by id to avoid duplicate rows from backend merges or double fetches
    const seen = new Set();
    let list = (purchases || []).filter(p => {
      const key = p && p.id != null ? String(p.id) : '';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // Optional: stable sort by id desc for consistency
    list = list.slice().sort((a,b)=> Number(b.id||0) - Number(a.id||0));
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
        <ShopChip />
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
          {form.vendor_id && (()=>{
            const v = vendors.find(x=> String(x.id) === String(form.vendor_id));
            if (!v) return null;
            return (
              <>
                <div className="input-group">
                  <label>Vendor Code</label>
                  <input className="input" value={v.vendor_code || ''} readOnly />
                </div>
                <div className="input-group">
                  <label>Vendor Name</label>
                  <input className="input" value={v.name || ''} readOnly />
                </div>
                <div className="input-group" style={{gridColumn:'1/-1'}}>
                  <label>Address</label>
                  <input className="input" value={v.address || ''} readOnly />
                </div>
              </>
            );
          })()}
          {/* New spec: remove single-product fields; use editable table below */}
          {/* New editable purchases table goes below */}
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
