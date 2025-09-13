import React, { useEffect, useMemo, useState } from 'react';
import { getPurchases, createPurchase, updatePurchase, deletePurchase, getVendors, getMetals, getProducts, createPurchaseItem } from '../api/api';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import MobilePicker from '../components/MobilePicker';
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
  const sortedMaterials = useMemo(() => {
    const source = Array.isArray(materials) ? [...materials] : [];
    const parseCode = (code) => {
      const m = String(code||'').match(/(\d+)/);
      return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
    };
    source.sort((a,b) => {
      const ca = parseCode(a.part_code);
      const cb = parseCode(b.part_code);
      if (ca !== cb) return ca - cb;
      return String(a.part_code||'').localeCompare(String(b.part_code||''));
    });
    return source;
  }, [materials]);
  const [addForm, setAddForm] = useState({ material_code:'', price_per_unit:'', uom:'Piece', mfg_date:'', shelf_life:'', quantity:'' });
  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [addFormErrors, setAddFormErrors] = useState({});
  const [addSuccess, setAddSuccess] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isMobile = (typeof window !== 'undefined') ? window.matchMedia('(max-width: 640px)').matches : false;
  const [showVendorPicker, setShowVendorPicker] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
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
    const baseAmount = price * effectiveQty;
    const { sgst_percent, cgst_percent } = deriveGstPercents(row);
    const sgst_amount = baseAmount * (sgst_percent/100);
    const cgst_amount = baseAmount * (cgst_percent/100);
    const totalAmount = baseAmount + sgst_amount + cgst_amount;
    return { baseAmount, sgst_percent, cgst_percent, sgst_amount, cgst_amount, totalAmount };
  };
  const itemsGrandTotal = useMemo(() => {
    return (rows||[]).reduce((sum, r) => sum + computeRowTotals(r).totalAmount, 0);
  }, [rows]);
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
    // Quick-purchase fallback: if no rows, but addForm is valid, include it
    let rowsToUse = rows;
    const canUseAdd = addForm.material_code && Number(addForm.quantity||0) > 0 && Number(addForm.price_per_unit||0) > 0;
    if (!rows.length && canUseAdd) {
      // Ensure product mapping from selected material
      let pid = '';
      const mat = materials.find(m=> String(m.part_code)===String(addForm.material_code));
      if (mat) {
        const label = String(mat.metal_type||'').toLowerCase();
        let prod = products.find(p=> String(p.name||'').toLowerCase() === label)
          || products.find(p=> String(p.name||'').toLowerCase().includes(label) || label.includes(String(p.name||'').toLowerCase()));
        if (!prod && /egg/.test(label)) prod = products.find(p=> /egg/.test(String(p.name||'').toLowerCase()));
        
        if (prod) pid = String(prod.id);
      }
      rowsToUse = [{ ...addForm, product_id: pid }];
    }
    if (!rowsToUse.length) { setError('Please add at least one row.'); return; }
    // Validate manual total equals computed items total
    const manualTotalNum = Number(form.total_purchase_value);
    if (!isFinite(manualTotalNum)) { setError('Please enter a valid Total Purchase Value.'); return; }
    const manualCents = Math.round(manualTotalNum * 100);
    const itemsCents = Math.round(Number(itemsGrandTotal || 0) * 100);
    if (manualCents !== itemsCents) {
      setError(`Total Purchase Value (₹ ${manualTotalNum.toFixed(2)}) must equal Items Total (₹ ${itemsGrandTotal.toFixed(2)}).`);
      return;
    }
    try {
      // Guard: ensure each row has product mapping
      const bad = (rowsToUse||[]).find(r=> !r.product_id);
      if (bad) {
        setError(`Cannot map Material ${bad.material_code || bad.material_type || ''} to a Product. Please verify Material and Products master.`);
        return;
      }
      // Create minimal header, then items based on rows
      let purchaseId = editing;
      if (!editing) {
        const header = { vendor_id: Number(form.vendor_id) };
        const res = await createPurchase(header);
        purchaseId = res.data?.id || res.id;
      }
      for (const r of rowsToUse) {
        const price = Number(r.price_per_unit || 0);
        const qty = Number(r.quantity || 0);
        if (!(qty>0)) continue;
        await createPurchaseItem(purchaseId, { product_id: Number(r.product_id), quantity: qty, price, mfg_date: r.mfg_date || null });
      }
      // Do not update opening stocks when purchases are added (per new policy)
      setSuccess(`Purchase Number ${purchaseId} saved successfully.`);
      setForm({ vendor_id: '', total_purchase_value: '' });
      setRows([]);
      setEditing(null);
      await fetchPurchases();
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('inventory:refresh', { detail: { type: 'closing' } })); } catch(_) {}
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
        <form onSubmit={handleSubmit} className="form-row">
          <div className="card" style={{gridColumn:'1/-1'}}>
            <div className="card-body">
              <div className="form-row">
                <div className="input-group" style={{overflow:'visible'}}>
                  <label>Vendor <span style={{color:'#fca5a5'}}>*</span></label>
                  {isMobile ? (
                    <button type="button" className="input" onClick={()=>setShowVendorPicker(true)} style={{textAlign:'left'}}>
                      {form.vendor_id ? (vendors.find(v=> String(v.id)===String(form.vendor_id))?.name || 'Select vendor') : (vendors.length ? 'Select vendor' : 'No vendors found - add one first')}
                    </button>
                  ) : (
                    <Dropdown
                      value={form.vendor_id}
                      onChange={v=>setForm({...form, vendor_id: v})}
                      placeholder={vendors.length ? 'Select vendor' : 'No vendors found - add one first'}
                      options={vendors.map(v=>({ value: String(v.id), label: `${v.vendor_code} - ${v.name}` }))}
                    />
                  )}
                  {!form.vendor_id && error && <div className="form-help">Vendor is required</div>}
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
                  {(rows.length>0 && String(form.total_purchase_value||'').length>0) && (Math.round(Number(form.total_purchase_value||0)*100) !== Math.round(itemsGrandTotal*100)) && (
                    <div className="form-help">Must equal Items Total: ₹ {itemsGrandTotal.toFixed(2)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Purchases Table */}
          <div className="input-group" style={{gridColumn:'1/-1'}}>
            <label>Purchase Entry</label>
            {/* Add Item compact form */}
            <div className="card" style={{marginTop:8}}>
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
                  <div className="input-group" style={{overflow:'visible'}}>
                    <label>Material <span style={{color:'#fca5a5'}}>*</span></label>
                    {isMobile ? (
                      <button type="button" className="input" onClick={()=>setShowMaterialPicker(true)} style={{textAlign:'left'}}>
                        {addForm.material_code ? (sortedMaterials.find(m=> String(m.part_code)===String(addForm.material_code))?.metal_type || addForm.material_code) : 'Material Code - Type *'}
                      </button>
                    ) : (
                      <Dropdown
                        value={addForm.material_code}
                        onChange={(code)=>{
                          const mat = materials.find(m=> String(m.part_code) === String(code));
                          // Heuristic map to product
                          if (mat) {
                            const norm = String(mat.metal_type||'').toLowerCase();
                            const byName = products.find(p=> String(p.name||'').toLowerCase() === norm || String(p.name||'').toLowerCase().includes(norm) || norm.includes(String(p.name||'').toLowerCase()));
                            // No override state; only keep material details in form
                          }
                          setAddForm(prev=>({ ...prev, material_code: code, material_type: mat ? mat.metal_type : '', shelf_life: mat ? (mat.shelf_life || '') : '' }));
                        }}
                        placeholder={'Material Code - Type *'}
                        options={(sortedMaterials||[]).map(m=>({ value: String(m.part_code), label: `${m.part_code} - ${m.metal_type}` }))}
                      />
                    )}
                    {addFormErrors.material_code && <div className="form-help">{addFormErrors.material_code}</div>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:contents">
                    <div className="input-group">
                      <label>Price / Unit <span style={{color:'#fca5a5'}}>*</span></label>
                      <input className="input" placeholder="Price / Unit" value={addForm.price_per_unit} onChange={e=>setAddForm({...addForm, price_per_unit:e.target.value})} inputMode="decimal" />
                      {addFormErrors.price_per_unit && <div className="form-help">{addFormErrors.price_per_unit}</div>}
                    </div>
                    <div className="input-group" style={{overflow:'visible'}}>
                      <label>UOM <span style={{color:'#fca5a5'}}>*</span></label>
                      <Dropdown value={addForm.uom} onChange={(v)=>setAddForm({...addForm, uom:v})} options={[{value:'Piece',label:'Piece'},{value:'Tray',label:'Tray (30 pcs)'}]} />
                      {addFormErrors.uom && <div className="form-help">{addFormErrors.uom}</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:contents">
                    <div className="input-group">
                      <label>DOM <span style={{color:'#fca5a5'}}>*</span></label>
                      <input
                        className="input date"
                        type="date"
                        aria-label="DOM"
                        title="DOM"
                        placeholder="DOM"
                        value={addForm.mfg_date}
                        onChange={e=>setAddForm({...addForm, mfg_date:e.target.value})}
                      />
                    </div>
                    <div className="input-group">
                      <label>Shelf Life</label>
                      <input className="input" placeholder="e.g., 12 days" value={addForm.shelf_life} onChange={e=>setAddForm({...addForm, shelf_life:e.target.value})} />
                    </div>
                  </div>
                  {addFormErrors.mfg_date && <div className="form-help sm:col-span-6">{addFormErrors.mfg_date}</div>}
                  <div className="input-group">
                    <label>Quantity <span style={{color:'#fca5a5'}}>*</span></label>
                    <input className="input" placeholder="Quantity" value={addForm.quantity} onChange={e=>setAddForm({...addForm, quantity:e.target.value})} inputMode="numeric" />
                    {addFormErrors.quantity && <div className="form-help">{addFormErrors.quantity}</div>}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="grid grid-cols-1 gap-2 sm:flex sm:justify-end">
                    <button type="button" className="btn secondary w-full sm:w-auto" onClick={()=>{
                      const errs = {};
                      if (!addForm.material_code) errs.material_code = 'Product required';
                      const price = Number(addForm.price_per_unit);
                      if (!(price>0)) errs.price_per_unit = 'Price required';
                      if (!addForm.uom) errs.uom = 'UOM required';
                      if (!addForm.mfg_date) errs.mfg_date = 'DOM required';
                      const qty = Number(addForm.quantity);
                      if (!(qty>0)) errs.quantity = 'Quantity required';
                      if (Object.keys(errs).length) { setAddFormErrors(errs); return; }
                      setAddFormErrors({});
                      const mat = materials.find(m=> String(m.part_code)===String(addForm.material_code));
                      const norm = (mat && mat.metal_type) ? String(mat.metal_type).toLowerCase() : '';
                      const auto = (products||[]).find(p=> String(p.name||'').toLowerCase() === norm || String(p.name||'').toLowerCase().includes(norm) || norm.includes(String(p.name||'').toLowerCase()));
                      const mappedId = auto ? String(auto.id) : '';
                      setRows(prev=>[...prev, { ...addForm, product_id: mappedId, material_type: addForm.material_type || (mat ? mat.metal_type : '') }]);
                      setAddForm({ material_code:'', material_type:'', price_per_unit:'', uom:'Piece', mfg_date:'', shelf_life:'', quantity:'' });
                      setAddSuccess('Item added');
                      setTimeout(()=>setAddSuccess(''), 1500);
                    }}>+ Add Item</button>
                    <button type="button" className="btn secondary w-full sm:w-auto" onClick={()=> setRows(prev=> {
                      const first = (sortedMaterials && sortedMaterials[0]) ? sortedMaterials[0] : null;
                      return [...prev, { material_code: first ? String(first.part_code) : '', material_type: first ? first.metal_type : '', price_per_unit:'', uom:'Piece', mfg_date:'', shelf_life:'', quantity:'' }];
                    })}>+ Add Row</button>
                  </div>
                </div>
                {addSuccess && <div className="toast" style={{marginTop:8}}>{addSuccess}</div>}
              </div>
            </div>
            {/* Desktop toolbar above table */}
            {/* Toolbar removed to avoid duplicate "+ Add Row" */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="table table-hover table-zebra mt-2" style={{display:'table', tableLayout:'fixed', width:'100%'}}>
                <colgroup>
                  <col style={{width:'24%'}} />
                  <col style={{width:'12%'}} />
                  <col style={{width:'8%'}} />
                  <col style={{width:'12%'}} />
                  <col style={{width:'10%'}} />
                  <col style={{width:'8%'}} />
                  <col style={{width:'5%'}} />
                  <col style={{width:'5%'}} />
                  <col style={{width:'16%'}} />
                  <col style={{width:'72px'}} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Material (Code - Type)</th>
                    <th style={{textAlign:'right'}}>Price/Unit</th>
                    <th style={{textAlign:'center'}}>UOM</th>
                    <th>DOM</th>
                    <th>Shelf Life</th>
                    <th style={{textAlign:'right'}}>Quantity</th>
                    <th style={{textAlign:'right'}}>SGST</th>
                    <th style={{textAlign:'right'}}>CGST</th>
                    <th style={{textAlign:'right'}}>Total Amount</th>
                    <th style={{textAlign:'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const totals = computeRowTotals(r);
                    const mat = materials.find(m=> String(m.part_code) === String(r.material_code));
                    const productLabel = mat ? `${mat.part_code} - ${mat.metal_type}` : (r.material_type || r.material_code || '-');
                    return (
                      <tr key={idx}>
                        <td><div className="truncate" title={productLabel}>{productLabel}</div></td>
                        <td style={{textAlign:'right'}}>{r.price_per_unit || '-'}</td>
                        <td style={{textAlign:'center'}}>{r.uom || 'Piece'}</td>
                        <td>{r.mfg_date || '-'}</td>
                        <td>{r.shelf_life || '-'}</td>
                        <td style={{textAlign:'right'}}>{r.quantity || '-'}</td>
                        <td style={{textAlign:'right'}}>{totals.sgst_amount.toFixed(2)}</td>
                        <td style={{textAlign:'right'}}>{totals.cgst_amount.toFixed(2)}</td>
                        <td style={{textAlign:'right'}}>{totals.totalAmount.toFixed(2)}</td>
                        <td style={{textAlign:'center'}}>
                          <div className="btn-group" style={{justifyContent:'center'}}>
                            <button type="button" className="btn icon btn-sm" title="Edit" onClick={()=>{ setEditIndex(idx); setEditForm(r); setShowEdit(true); }}>✏️</button>
                            <button type="button" className="btn icon btn-sm" title="Delete" onClick={()=> setRows(prev=> prev.filter((_,i)=> i!==idx))}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length > 0 && (
                    <tr>
                      <td colSpan={8}></td>
                      <td style={{textAlign:'right', fontWeight:800, fontSize:16}}>₹ {itemsGrandTotal.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="block sm:hidden space-y-2 mt-2">
              {rows.map((r, idx) => {
                const totals = computeRowTotals(r);
                const mat = materials.find(m=> String(m.part_code) === String(r.material_code));
                const productLabel = mat ? `${mat.part_code} - ${mat.metal_type}` : (r.material_type || r.material_code || '-');
                return (
                  <div key={idx} className="card">
                    <div className="card-body">
                      <div className="data-pairs">
                        <div className="pair"><strong>Material</strong><div>{productLabel}</div></div>
                        <div className="pair"><strong>Price/Unit</strong><div style={{textAlign:'right'}}>{r.price_per_unit || '-'}</div></div>
                        <div className="pair"><strong>UOM</strong><div>{r.uom || 'Piece'}</div></div>
                        <div className="pair"><strong>DOM</strong><div>{r.mfg_date || '-'}</div></div>
                        <div className="pair"><strong>Shelf Life</strong><div>{r.shelf_life || '-'}</div></div>
                        <div className="pair"><strong>Quantity</strong><div style={{textAlign:'right'}}>{r.quantity || '-'}</div></div>
                        <div className="pair"><strong>SGST %</strong><div style={{textAlign:'right'}}>{totals.sgst_percent.toFixed(2)}</div></div>
                        <div className="pair"><strong>CGST %</strong><div style={{textAlign:'right'}}>{totals.cgst_percent.toFixed(2)}</div></div>
                        <div className="pair" style={{textAlign:'right'}}><strong>Total Amount</strong><div>₹ {totals.totalAmount.toFixed(2)}</div></div>
                      </div>
                      <div className="btn-group" style={{marginTop:10, justifyContent:'flex-end'}}>
                        <button type="button" className="btn secondary btn-sm" onClick={()=>{ setEditIndex(idx); setEditForm(r); setShowEdit(true); }}>Edit</button>
                        <button type="button" className="btn danger btn-sm" onClick={()=> setRows(prev=> prev.filter((_,i)=> i!==idx))}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {rows.length > 0 && (
                <div className="card" style={{marginTop:8}}>
                  <div className="card-body" style={{display:'flex', justifyContent:'space-between'}}>
                    <div style={{fontWeight:800}}>Items Total</div>
                    <div style={{fontWeight:900}}>₹ {itemsGrandTotal.toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>
            {/* Removed duplicate bottom Add Row */}
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
      {isMobile && (
        <>
          <MobilePicker
            open={showVendorPicker}
            onClose={()=>setShowVendorPicker(false)}
            title="Select Vendor"
            options={vendors.map(v=>({ value: String(v.id), label: `${v.vendor_code} - ${v.name}` }))}
            value={form.vendor_id}
            onChange={(val)=> setForm(prev=>({ ...prev, vendor_id: val }))}
            showSearch={false}
          />
          <MobilePicker
            open={showMaterialPicker}
            onClose={()=>setShowMaterialPicker(false)}
            title="Select Material"
            options={(sortedMaterials||[]).map(m=>({ value: String(m.part_code), label: `${m.part_code} - ${m.metal_type}` }))}
            value={addForm.material_code}
            onChange={(code)=>{
              const mat = materials.find(m=> String(m.part_code) === String(code));
              setAddForm(prev=>({ ...prev, material_code: code, material_type: mat ? mat.metal_type : '', shelf_life: mat ? (mat.shelf_life || '') : '' }));
            }}
            showSearch={false}
          />
        </>
      )}
      {/* Edit Modal */}
      {showEdit && editForm && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}} onClick={()=>setShowEdit(false)}>
          <div className="card" style={{width:'min(640px, 92vw)'}} onClick={e=>e.stopPropagation()}>
            <div className="card-header"><div className="card-title">Edit Item</div></div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div style={{overflow:'visible'}}>
                  <label className="block" style={{fontSize:12, color:'#b6beca', marginBottom:4}}>Product (Material)</label>
                  <Dropdown value={editForm.material_code||''} onChange={(code)=>{
                    const mat = materials.find(m=> String(m.part_code) === String(code));
                    const type = mat ? mat.metal_type : '';
                    const sl = mat ? (mat.shelf_life || '') : '';
                    setEditForm(prev=>({ ...prev, material_code: code, material_type: type, shelf_life: sl }));
                  }} options={(sortedMaterials||[]).map(m=>({ value: String(m.part_code), label: `${m.part_code} - ${m.metal_type}` }))} />
                </div>
                
                <div>
                  <label className="block" style={{fontSize:12, color:'#b6beca', marginBottom:4}}>Price / Unit</label>
                  <input className="input" value={editForm.price_per_unit||''} onChange={e=>setEditForm({...editForm, price_per_unit:e.target.value})} />
                </div>
                <div style={{overflow:'visible'}}>
                  <label className="block" style={{fontSize:12, color:'#b6beca', marginBottom:4}}>UOM</label>
                  <Dropdown value={editForm.uom||'Piece'} onChange={(v)=>setEditForm({...editForm, uom:v})} options={[{value:'Piece',label:'Piece'},{value:'Tray',label:'Tray (30 pcs)'}]} />
                </div>
                <div>
                  <label className="block" style={{fontSize:12, color:'#b6beca', marginBottom:4}}>DOM</label>
                  <input className="input date" type="date" value={editForm.mfg_date||''} onChange={e=>setEditForm({...editForm, mfg_date:e.target.value})} />
                </div>
                <div>
                  <label className="block" style={{fontSize:12, color:'#b6beca', marginBottom:4}}>Shelf Life</label>
                  <input className="input" value={editForm.shelf_life||''} onChange={e=>setEditForm({...editForm, shelf_life:e.target.value})} />
                </div>
                <div>
                  <label className="block" style={{fontSize:12, color:'#b6beca', marginBottom:4}}>Quantity</label>
                  <input className="input" value={editForm.quantity||''} onChange={e=>setEditForm({...editForm, quantity:e.target.value})} />
                </div>
              </div>
              <div className="actions-row" style={{justifyContent:'flex-end', marginTop:12}}>
                <button className="btn" onClick={()=>{ setRows(prev=> prev.map((row,i)=> i===editIndex ? { ...row, ...editForm } : row)); setShowEdit(false); }}>Save</button>
                <button className="btn secondary" onClick={()=>setShowEdit(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchases list removed as requested; available in MIS */}
    </div>
    </div>
  );
}
export default Purchases;
