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
    // Derive GST% from materials using material_code or material_type; fallback 0
    let gst = 0;
    if (row.material_code) {
      const m = materials.find(x => String(x.part_code) === String(row.material_code));
      if (m) gst = Number(m.gst_percent || 0);
    }
    if (!gst && row.material_type) {
      const m2 = materials.find(x => String(x.metal_type).toLowerCase() === String(row.material_type).toLowerCase());
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
        // Map to a product_id if possible by material type
        let productId = null;
        if (r.material_type) {
          const prod = products.find(p => String(p.name).toLowerCase() === String(r.material_type).toLowerCase());
          if (prod) productId = prod.id;
        }
        if (!productId && r.material_code) {
          const mat = materials.find(m => String(m.part_code) === String(r.material_code));
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
              <div className="input-group" style={{gridColumn:'1/-1'}}>
                <label>Address</label>
                <input className="input" value={v.address || ''} readOnly />
              </div>
            );
          })()}
          {/* New spec: manual total (optional) */}
          <div className="input-group" style={{gridColumn:'1/-1'}}>
            <label>Total Purchase Value (manual)</label>
            <input className="input" type="number" step="0.01" value={form.total_purchase_value} inputMode="decimal" onChange={e=>setForm({...form, total_purchase_value: e.target.value})} />
          </div>

          {/* Editable Purchases Table */}
          <div className="input-group" style={{gridColumn:'1/-1'}}>
            <label>Purchases</label>
            <div className="hidden sm:block overflow-x-auto">
              <table className="table table-hover table-zebra mt-2">
                <thead>
                  <tr>
                    <th>Select Product (Material)</th>
                    <th style={{textAlign:'right'}}>Price/Unit</th>
                    <th>UOM</th>
                    <th>Date of Manufacturing</th>
                    <th>Shelf Life</th>
                    <th style={{textAlign:'right'}}>Quantity</th>
                    <th style={{textAlign:'right'}}>SGST %</th>
                    <th style={{textAlign:'right'}}>CGST %</th>
                    <th style={{textAlign:'right'}}>Total Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const totals = computeRowTotals(r);
                    return (
                      <tr key={idx}>
                        <td style={{overflow:'visible'}}>
                          <Dropdown
                            value={r.material_code || ''}
                            onChange={(code)=>{
                              const mat = materials.find(m=> String(m.part_code) === String(code));
                              const type = mat ? mat.metal_type : '';
                              setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, material_code: code, material_type: type } : row));
                            }}
                            placeholder={'Select Product'}
                            options={[{ value:'', label:'Select Product' }, ...(materials||[]).map(m=>({ value: String(m.part_code), label: `${m.part_code} - ${m.description || m.metal_type}` }))]}
                          />
                        </td>
                        <td style={{textAlign:'right'}}><input className="input" value={r.price_per_unit||''} inputMode="decimal" onChange={e=>{
                          const val = e.target.value; setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, price_per_unit: val } : row));
                        }} /></td>
                        <td style={{overflow:'visible'}}>
                          <Dropdown
                            value={r.uom || 'Piece'}
                            onChange={(val)=> setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, uom: val } : row))}
                            options={[{value:'Piece', label:'Piece'},{value:'Tray', label:'Tray (30 pcs)'}]}
                          />
                        </td>
                        <td><input className="input" type="date" value={r.mfg_date||''} onChange={e=>{
                          const val = e.target.value; setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, mfg_date: val } : row));
                        }} /></td>
                        <td><input className="input" placeholder="days/months" value={r.shelf_life||''} onChange={e=>{
                          const val = e.target.value; setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, shelf_life: val } : row));
                        }} /></td>
                        <td style={{textAlign:'right'}}><input className="input" value={r.quantity||''} inputMode="numeric" onChange={e=>{
                          const val = e.target.value; setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, quantity: val } : row));
                        }} /></td>
                        <td style={{textAlign:'right'}}><input className="input" value={totals.sgst_percent.toFixed(2)} readOnly /></td>
                        <td style={{textAlign:'right'}}><input className="input" value={totals.cgst_percent.toFixed(2)} readOnly /></td>
                        <td style={{textAlign:'right'}}><input className="input" value={totals.totalAmount.toFixed(2)} readOnly /></td>
                        <td><button type="button" className="btn danger btn-sm" onClick={()=> setRows(prev=> prev.filter((_,i)=> i!==idx))}>Delete</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="block sm:hidden space-y-2 mt-2">
              {rows.map((r, idx) => {
                const totals = computeRowTotals(r);
                return (
                  <div key={idx} className="card">
                    <div className="card-body">
                      <div className="data-pairs">
                        <div className="pair">
                          <Dropdown
                            value={r.material_code || ''}
                            onChange={(code)=>{
                              const mat = materials.find(m=> String(m.part_code) === String(code));
                              const type = mat ? mat.metal_type : '';
                              setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, material_code: code, material_type: type } : row));
                            }}
                            placeholder={'Select Product'}
                            options={[{ value:'', label:'Select Product' }, ...materials.map(m=>({ value: String(m.part_code), label: `${m.part_code} - ${m.metal_type}` }))]}
                          />
                        </div>
                        <div className="pair"><strong>Price/Unit</strong><input className="input" value={r.price_per_unit||''} onChange={e=> setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, price_per_unit: e.target.value } : row))} /></div>
                        <div className="pair"><strong>UOM</strong>
                          <Dropdown
                            value={r.uom || 'Piece'}
                            onChange={(val)=> setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, uom: val } : row))}
                            options={[{value:'Piece', label:'Piece'},{value:'Tray', label:'Tray (30 pcs)'}]}
                          />
                        </div>
                        <div className="pair"><strong>DoM</strong><input className="input" type="date" value={r.mfg_date||''} onChange={e=> setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, mfg_date: e.target.value } : row))} /></div>
                        <div className="pair"><strong>Shelf Life</strong><input className="input" value={r.shelf_life||''} onChange={e=> setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, shelf_life: e.target.value } : row))} /></div>
                        <div className="pair"><strong>Qty</strong><input className="input" value={r.quantity||''} onChange={e=> setRows(prev=> prev.map((row,i)=> i===idx ? { ...row, quantity: e.target.value } : row))} /></div>
                        <div className="pair"><strong>SGST %</strong><input className="input" value={totals.sgst_percent.toFixed(2)} readOnly /></div>
                        <div className="pair"><strong>CGST %</strong><input className="input" value={totals.cgst_percent.toFixed(2)} readOnly /></div>
                        <div className="pair" style={{textAlign:'right'}}><strong>Total</strong><div>₹ {totals.totalAmount.toFixed(2)}</div></div>
                      </div>
                      <div className="btn-group" style={{marginTop:10}}>
                        <button type="button" className="btn danger btn-sm" onClick={()=> setRows(prev=> prev.filter((_,i)=> i!==idx))}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:8}}>
              <button type="button" className="btn" onClick={()=> setRows(prev=> [...prev, { material_code:'', material_type:'', price_per_unit:'', uom:'Piece', mfg_date:'', shelf_life:'', quantity:'' }])}>+ Add Row</button>
              <div style={{color:'#b6beca'}}>Rows: <strong>{rows.length}</strong></div>
            </div>
          </div>
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

      {/* Purchases list removed as requested; available in MIS */}
    </div>
    </div>
  );
}
export default Purchases;
