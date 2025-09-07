import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSales, createSale, updateSale, deleteSale, getCustomers, getPricingForSale, getMetals, getPayments, createPayment, getAvailable, getRouteTrips, createRouteTrip, getProducts, createSaleItem } from '../api/api';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import ShopChip from '../components/ShopChip';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({ customer_id: '', total: '', product_name: '', material_code: '', category: '', quantity: '1', quantity_unit: 'Piece', trays: '', sale_type: 'Cash', payment_mode: 'Cash', route_trip_id: '' });
  const [trips, setTrips] = useState([]);
  const [newTrip, setNewTrip] = useState({ route_name: '', vehicle_number: '', service_date: () => new Date().toISOString().slice(0,10) });
  const [available, setAvailable] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  const [itemForm, setItemForm] = useState({ product_id: '', qty_unit: 'Piece', qty_pieces: '', trays: '', price_per_piece: '' });
  const [pricingInfo, setPricingInfo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'payments'
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'payments' || tab === 'sales') setActiveTab(tab);
  }, [location.search]);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (activeTab) {
      params.set('tab', activeTab);
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [activeTab]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentsFilter, setPaymentsFilter] = useState({ customer_id: '', invoice_id: '' });
  const [recordPaymentNow, setRecordPaymentNow] = useState(false);
  const [paymentAtCreate, setPaymentAtCreate] = useState({ amount: '', mode: 'Cash' });
  const [paymentsByInvoice, setPaymentsByInvoice] = useState({});
  const [payingSale, setPayingSale] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', mode: 'Cash' });

  const itemsTotal = useMemo(() => {
    if (!lineItems || lineItems.length === 0) return 0;
    return lineItems.reduce((sum, it) => {
      const effQty = it.qty_unit === 'Tray' ? (Number(it.trays||0) * 30) : Number(it.qty_pieces||0);
      const price = Number(it.price_per_piece || 0);
      return sum + (effQty * price);
    }, 0);
  }, [lineItems]);

  const fetchSales = async () => {
    try {
      const res = await getSales();
      setSales(res.data);
    } catch (err) {
      console.error('Failed to load sales', err);
    }
  };

  useEffect(() => { 
    fetchSales(); 
    (async()=>{ 
      try { 
        const r = await getCustomers(); 
        setCustomers(r.data);
        const m = await getMetals();
        setMaterials(m.data);
        const pr = await getProducts();
        setProducts(pr.data || []);
        const pays = await getPayments();
        const map = {};
        (pays.data||[]).forEach(p=>{ const k = String(p.invoice_id); map[k] = (map[k]||0) + Number(p.amount||0); });
        setPaymentsByInvoice(map);
        setPaymentsList(pays.data||[]);
        const today = new Date().toISOString().slice(0,10);
        const tr = await getRouteTrips({ date: today });
        setTrips(tr.data||[]);
      } catch(e){ 
        console.error('data load failed', e);
      } 
    })(); 
  }, []);

  const reloadPayments = async () => {
    try {
      const res = await getPayments();
      setPaymentsList(res.data || []);
      const map = {};
      (res.data||[]).forEach(p=>{ const k = String(p.invoice_id); map[k] = (map[k]||0) + Number(p.amount||0); });
      setPaymentsByInvoice(map);
    } catch (e) { /* ignore */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.customer_id) { setError('Please select a customer.'); return; }
    const hasItems = lineItems.length > 0;
    if (!hasItems) {
      if (!form.product_name || !form.material_code) { setError('Please select a product.'); return; }
      if (!form.quantity || Number.isNaN(Number(form.quantity))) { setError('Please enter a valid quantity.'); return; }
      if (!form.total || Number.isNaN(Number(form.total))) { setError('Total could not be calculated.'); return; }
    }
    // Client-side stock validation
    try {
      const pid = materials.find(m=>String(m.metal_type)===String(form.product_name))?.id;
      if (pid) {
        const res = await getAvailable({ product_id: pid });
        const avail = Number(res.data?.available||0);
        if (Number(form.quantity) > avail) {
          setError(`Insufficient stock. Available: ${avail}`);
          return;
        }
      }
    } catch(_){}
    try {
      if (hasItems) {
        const res = await createSale({ customer_id: Number(form.customer_id), total: 0, product_name: null, payment_method: form.payment_mode, sale_type: form.sale_type, route_trip_id: form.route_trip_id || null });
        const newSale = res.data;
        for (const it of lineItems) {
          const effQty = it.qty_unit === 'Tray' ? Number(it.trays||0) * 30 : Number(it.qty_pieces||0);
          const price = Number(it.price_per_piece || 0);
          if (!it.product_id || !(effQty>0)) continue;
          await createSaleItem(newSale.id, { product_id: Number(it.product_id), quantity: effQty, price });
        }
        if (recordPaymentNow) {
          const sum = lineItems.reduce((s,li)=> s + (Number(li.price_per_piece||0) * (li.qty_unit==='Tray' ? Number(li.trays||0)*30 : Number(li.qty_pieces||0))), 0);
          const amt = Number(paymentAtCreate.amount || sum || 0);
          const mode = paymentAtCreate.mode || 'Cash';
          if (amt > 0) {
            await createPayment({ customer_id: Number(form.customer_id), invoice_id: Number(newSale.id), amount: amt, payment_mode: mode });
          }
        }
        navigate(`/invoice/${newSale.id}`);
      } else {
        const payload = { customer_id: Number(form.customer_id), total: Number(form.total), product_name: form.product_name || null, payment_method: form.payment_mode, sale_type: form.sale_type, route_trip_id: form.route_trip_id || null };
        if (editing) { 
          await updateSale(editing, payload); 
        } else { 
          const res = await createSale(payload);
          const newSale = res.data;
          if (recordPaymentNow) {
            const amt = Number(paymentAtCreate.amount || form.total || 0);
            const mode = paymentAtCreate.mode || 'Cash';
            if (amt > 0) {
              await createPayment({ customer_id: Number(form.customer_id), invoice_id: Number(newSale.id), amount: amt, payment_mode: mode });
            }
          }
          navigate(`/invoice/${newSale.id}`);
        }
      }
      setForm({ customer_id: '', total: '', product_name: '', material_code: '', category: '', quantity: '1', quantity_unit:'Piece', trays:'', sale_type:'Cash', payment_mode:'Cash' });
      setLineItems([]);
      setRecordPaymentNow(false);
      setPaymentAtCreate({ amount: '', mode: 'Cash' });
      setPricingInfo(null);
      setEditing(null);
      await fetchSales();
      await reloadPayments();
      setSuccess('Sale saved successfully.');
    } catch (err) {
      console.error('Failed to submit sale', err);
      setError('Failed to save sale. Please try again.');
    }
  };

  const fetchPricing = async () => {
    if (!form.customer_id || !form.material_code) {
      setPricingInfo(null);
      return;
    }
    
    try {
      const result = await getPricingForSale({
        customer_id: form.customer_id,
        material_code: form.material_code,
        category: form.category
      });
      setPricingInfo(result.data);
    } catch (err) {
      console.error('Failed to fetch pricing', err);
      setPricingInfo(null);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, [form.customer_id, form.material_code, form.category]);

  // Auto-set product_name when material_code changes
  useEffect(() => {
    if (!materials || !materials.length) return;
    const m = materials.find(x => String(x.part_code) === String(form.material_code));
    if (m && m.metal_type !== form.product_name) {
      setForm(prev => ({ ...prev, product_name: m.metal_type }));
    }
  }, [form.material_code, materials]);

  // Auto-calc total when pricing or quantity changes (with trays conversion)
  useEffect(() => {
    const qty = String(form.quantity_unit)==='Tray' ? (Number(form.trays||0)*30) : Number(form.quantity||0);
    const unitFinal = pricingInfo ? Number(pricingInfo.final_price || 0) : 0;
    const total = unitFinal * qty;
    if (isFinite(total)) {
      setForm(prev => ({ ...prev, total: total.toFixed(2) }));
    }
  }, [pricingInfo, form.quantity, form.quantity_unit, form.trays]);

  const filteredSales = useMemo(() => {
    let list = sales || [];
    if (categoryFilter) list = list.filter(s => (s.category||'').toLowerCase() === categoryFilter.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        String(s.id).includes(q)
        || String(s.customer_id||'').includes(q)
        || String(s.product_name||s.egg_type||'').toLowerCase().includes(q)
      );
    }
    return list;
  }, [sales, search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage, pageSize]);
  const visibleSales = useMemo(() => {
    const count = page * pageSize;
    return filteredSales.slice(0, count);
  }, [filteredSales, page, pageSize]);

  return (
    <div className="page space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="page-subtitle">Record sales and access invoices</p>
        </div>
        <ShopChip />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title={editing ? 'Edit Sale' : 'Add Sale'}>
        <form onSubmit={handleSubmit} className="form-grid-2">
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Product Name</label>
            <Dropdown
              value={form.product_name}
              onChange={(v)=>{
                const found = materials.find(m=>String(m.metal_type)===String(v));
                setForm(prev=>({
                  ...prev,
                  product_name: v,
                  material_code: found ? String(found.part_code) : prev.material_code
                }));
              }}
              placeholder={'Select product'}
              options={materials.map(m=>({ value: m.metal_type, label: m.metal_type }))}
            />
          </div>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Sales Type</label>
            <Dropdown
              value={form.sale_type}
              onChange={(v)=>setForm({...form, sale_type: v})}
              options={[{value:'Cash', label:'Cash'},{value:'Credit', label:'Credit'}]}
            />
          </div>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Customer</label>
            <Dropdown
              value={form.customer_id}
              onChange={(v)=>setForm({...form, customer_id: v})}
              placeholder={customers.length ? 'Select customer' : 'No customers found - add one first'}
              options={customers.map(c=>({ value: String(c.id), label: `${c.name} (#${c.id})` }))}
            />
          </div>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Category</label>
            <Dropdown
              value={form.category}
              onChange={(v)=>setForm({...form, category: v})}
              placeholder={'Select category'}
              options={[{value:'Retail', label:'Retail'},{value:'Wholesale', label:'Wholesale'},{value:'Walk-in', label:'Walk-in'}]}
            />
          </div>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Material Code</label>
            <Dropdown
              value={form.material_code}
              onChange={(v)=>setForm({...form, material_code: v})}
              placeholder={'Select Material'}
              options={materials.map(m=>({ value: String(m.part_code), label: `${m.part_code} - ${m.description || m.metal_type}` }))}
            />
          </div>
          <div className="input-group">
            <label>Quantity (pieces)</label>
            <input className="input" type="number" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} inputMode="numeric" />
          </div>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Quantity Unit</label>
            <Dropdown
              value={form.quantity_unit}
              onChange={(v)=>{
                if (v==='Tray') {
                  const pieces = Number(form.quantity||0);
                  const trays = Math.ceil(pieces/30);
                  setForm(prev=>({ ...prev, quantity_unit: v, trays: String(trays) }));
                } else {
                  const trays = Number(form.trays||0);
                  const pieces = trays*30;
                  setForm(prev=>({ ...prev, quantity_unit: v, quantity: String(pieces) }));
                }
              }}
              options={[{value:'Piece',label:'Single Piece'},{value:'Tray',label:'Tray (30 pcs)'}]}
            />
          </div>
          <div className="input-group">
            <label>Number of Trays</label>
            <input className="input" type="number" value={form.trays} onChange={e=>setForm({...form, trays: e.target.value})} inputMode="numeric" />
          </div>
          <div className="input-group">
            <label>Total Amount</label>
            <input className="input" value={form.total} readOnly />
          </div>

          {/* Line items editor (optional) */}
          <div className="input-group" style={{gridColumn:'1/-1'}}>
            <label>Add Item</label>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <select className="input" value={itemForm.product_id} onChange={e=>setItemForm({...itemForm, product_id: e.target.value})}>
                <option value="">{products.length ? 'Select product' : 'No products found'}</option>
                {products.map(p => (<option key={p.id} value={p.id}>{p.name} (#{p.id})</option>))}
              </select>
              <select className="input" value={itemForm.qty_unit} onChange={e=>setItemForm({...itemForm, qty_unit: e.target.value})}>
                <option value="Piece">Piece</option>
                <option value="Tray">Tray (30 pcs)</option>
              </select>
              <input className="input" placeholder="Qty (pieces)" value={itemForm.qty_pieces} onChange={e=>setItemForm({...itemForm, qty_pieces: e.target.value})} inputMode="numeric" />
              <input className="input" placeholder="Trays" value={itemForm.trays} onChange={e=>setItemForm({...itemForm, trays: e.target.value})} inputMode="numeric" />
              <input className="input" placeholder="Price / piece" value={itemForm.price_per_piece} onChange={e=>setItemForm({...itemForm, price_per_piece: e.target.value})} inputMode="decimal" />
              <button type="button" className="btn" onClick={async()=>{
                if (!itemForm.product_id) return;
                let price = Number(itemForm.price_per_piece||0);
                try {
                  if (form.customer_id && form.category) {
                    const prod = products.find(p=>String(p.id)===String(itemForm.product_id));
                    if (prod) {
                      const mat = materials.find(m=> (prod.name||'').toLowerCase().includes((m.metal_type||'').toLowerCase()));
                      if (mat) {
                        const pr = await getPricingForSale({ customer_id: form.customer_id, material_code: mat.part_code, category: form.category });
                        const final = Number(pr.data?.final_price || pr.data?.base_price || 0);
                        if (final>0) price = final;
                      }
                    }
                  }
                } catch(_) {}
                const effQty = itemForm.qty_unit==='Tray' ? (Number(itemForm.trays||0)*30) : Number(itemForm.qty_pieces||0);
                // Stock validation per line
                try {
                  const stockRes = await getAvailable({ product_id: itemForm.product_id });
                  const avail = Number(stockRes.data?.available||0);
                  if (effQty > avail) {
                    setError(`Insufficient stock for selected product. Available: ${avail}`);
                    return;
                  }
                } catch(_) {}
                const lineTotal = effQty * price;
                setLineItems(prev=>[...prev, { ...itemForm, price_per_piece: price, effectiveQty: effQty, lineTotal }]);
                setItemForm({ product_id:'', qty_unit:'Piece', qty_pieces:'', trays:'', price_per_piece:'' });
              }}>Add</button>
            </div>
          </div>
          {lineItems.length > 0 && (
            <div className="input-group" style={{gridColumn:'1/-1'}}>
              <div className="hidden sm:block overflow-x-auto">
                <table className="table table-hover table-zebra mt-2">
                  <thead><tr><th>Product</th><th style={{textAlign:'right'}}>Qty (pcs)</th><th style={{textAlign:'right'}}>Price/pc</th><th style={{textAlign:'right'}}>Line Total</th><th>Actions</th></tr></thead>
                  <tbody>
                    {lineItems.map((it,idx)=>{
                      const prod = products.find(p=>String(p.id)===String(it.product_id));
                      return (
                        <tr key={idx}>
                          <td style={{minWidth:180}}>
                            <select className="input" value={it.product_id} onChange={e=>{
                              const pid = e.target.value;
                              setLineItems(prev=>prev.map((row,i)=> i===idx ? { ...row, product_id: pid } : row));
                            }}>
                              {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                            </select>
                          </td>
                          <td style={{textAlign:'right', minWidth:120}}>
                            <input className="input" value={it.qty_unit==='Tray' ? Math.ceil((Number(it.effectiveQty||0))/30) : it.effectiveQty}
                              onChange={e=>{
                                const val = e.target.value;
                                setLineItems(prev=>prev.map((row,i)=>{
                                  if (i!==idx) return row;
                                  const effQty = row.qty_unit==='Tray' ? Number(val||0)*30 : Number(val||0);
                                  return { ...row, effectiveQty: effQty, qty_pieces: row.qty_unit==='Tray' ? '' : val, trays: row.qty_unit==='Tray' ? val : '', lineTotal: effQty * Number(row.price_per_piece||0) };
                                }));
                              }} />
                          </td>
                          <td style={{textAlign:'right', minWidth:120}}>
                            <input className="input" value={it.price_per_piece}
                              onChange={e=>{
                                const price = Number(e.target.value||0);
                                setLineItems(prev=>prev.map((row,i)=> i===idx ? { ...row, price_per_piece: price, lineTotal: price * Number(row.effectiveQty||0) } : row));
                              }} />
                          </td>
                          <td style={{textAlign:'right'}}>{(Number(it.lineTotal||0)).toFixed(2)}</td>
                          <td>
                            <div className="btn-group">
                              <button type="button" className="btn secondary btn-sm" onClick={()=>{
                                setLineItems(prev=>prev.map((row,i)=> i===idx ? { ...row, qty_unit: row.qty_unit==='Tray' ? 'Piece' : 'Tray', effectiveQty: row.qty_unit==='Tray' ? Number(row.trays||0)*30 : Number(row.qty_pieces||0), lineTotal: Number(row.price_per_piece||0) * (row.qty_unit==='Tray' ? Number(row.trays||0)*30 : Number(row.qty_pieces||0)) } : row));
                              }}>Toggle Unit</button>
                              <button type="button" className="btn danger btn-sm" onClick={()=>setLineItems(prev=>prev.filter((_,i)=>i!==idx))}>Remove</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards for line items */}
              <div className="block sm:hidden space-y-2 mt-2">
                {lineItems.map((it, idx) => {
                  const prod = products.find(p=>String(p.id)===String(it.product_id));
                  return (
                    <div key={idx} className="card">
                      <div className="card-body">
                        <div className="data-pairs">
                          <div className="pair"><strong>Product</strong>
                            <select className="input" value={it.product_id} onChange={e=>{
                              const pid = e.target.value;
                              setLineItems(prev=>prev.map((row,i)=> i===idx ? { ...row, product_id: pid } : row));
                            }}>
                              {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                            </select>
                          </div>
                          <div className="pair"><strong>Qty (pcs)</strong>
                            <input className="input" value={it.effectiveQty}
                              onChange={e=>{
                                const effQty = Number(e.target.value||0);
                                setLineItems(prev=>prev.map((row,i)=> i===idx ? { ...row, effectiveQty: effQty, qty_pieces: effQty, trays: '', lineTotal: effQty * Number(row.price_per_piece||0) } : row));
                              }} />
                          </div>
                          <div className="pair"><strong>Price/pc</strong>
                            <input className="input" value={it.price_per_piece}
                              onChange={e=>{
                                const price = Number(e.target.value||0);
                                setLineItems(prev=>prev.map((row,i)=> i===idx ? { ...row, price_per_piece: price, lineTotal: price * Number(row.effectiveQty||0) } : row));
                              }} />
                          </div>
                          <div className="pair" style={{textAlign:'right'}}><strong>Line Total</strong><div>₹ {(Number(it.lineTotal||0)).toFixed(2)}</div></div>
                        </div>
                        <div className="btn-group" style={{marginTop:10}}>
                          <button type="button" className="btn secondary btn-sm" onClick={()=>{
                            setLineItems(prev=>prev.map((row,i)=> i===idx ? { ...row, qty_unit: row.qty_unit==='Tray' ? 'Piece' : 'Tray', effectiveQty: row.qty_unit==='Tray' ? Number(row.trays||0)*30 : Number(row.qty_pieces||0), lineTotal: Number(row.price_per_piece||0) * (row.qty_unit==='Tray' ? Number(row.trays||0)*30 : Number(row.qty_pieces||0)) } : row));
                          }}>Toggle Unit</button>
                          <button type="button" className="btn danger btn-sm" onClick={()=>setLineItems(prev=>prev.filter((_,i)=>i!==idx))}>Remove</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', marginTop:8}}>
                <div style={{color:'#b6beca'}}>Items Total: <strong>₹ {itemsTotal.toFixed(2)}</strong></div>
              </div>
            </div>
          )}

          {/* Route controls (full-width, placed after core fields to maintain alignment) */}
          <div className="input-group" style={{gridColumn:'1/-1', overflow:'visible'}}>
            <label>Route (Today)</label>
            <Dropdown
              value={form.route_trip_id}
              onChange={(v)=>setForm({...form, route_trip_id: v})}
              options={[{ value:'', label:'No Route (Today)' }, ...trips.map(t=>({ value:String(t.id), label:`${t.route_name || t.master_route_name || 'Route'} - ${t.vehicle_number || '-'} (${new Date(t.service_date).toLocaleDateString()})` }))]}
            />
          </div>
          <div className="input-group" style={{gridColumn:'1/-1'}}>
            <label>Quick Create Route Trip</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input className="input" placeholder="Route name" value={newTrip.route_name} onChange={e=>setNewTrip({...newTrip, route_name:e.target.value})} />
              <input className="input" placeholder="Vehicle" value={newTrip.vehicle_number} onChange={e=>setNewTrip({...newTrip, vehicle_number:e.target.value})} />
              <button type="button" className="btn w-full sm:w-auto" onClick={async()=>{
                const today = new Date().toISOString().slice(0,10);
                const r = await createRouteTrip({ service_date: today, route_name: newTrip.route_name || 'Ad-hoc', vehicle_number: newTrip.vehicle_number || null });
                const tr = await getRouteTrips({ date: today });
                setTrips(tr.data||[]);
                setForm(prev=>({...prev, route_trip_id: r.data?.id || ''}));
                setNewTrip({ route_name:'', vehicle_number:'', service_date: today });
              }}>Add</button>
            </div>
          </div>
          
          {pricingInfo && (
            <div className="input-group" style={{gridColumn:'1/-1'}}>
              <div style={{background:'#f8f9fa', padding:'12px', borderRadius:'6px', border:'1px solid #e9ecef'}}>
                <h4 style={{margin:'0 0 8px 0', fontSize:'14px', color:'#495057'}}>Pricing Information</h4>
                <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'8px', fontSize:'12px'}}>
                  <div><strong>Base Price (per unit):</strong> ₹{pricingInfo.base_price}</div>
                  <div><strong>GST %:</strong> {pricingInfo.gst_percent}%</div>
                  <div><strong>GST Amount (per unit):</strong> ₹{pricingInfo.gst_amount}</div>
                  <div><strong>Final Price (per unit):</strong> ₹{pricingInfo.final_price}</div>
                  <div style={{gridColumn:'1/-1'}}>
                    <strong>Tax Status:</strong> {pricingInfo.is_taxable ? 'Taxable' : 'Non-Taxable'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {form.sale_type === 'Cash' && (
          <div className="input-group" style={{gridColumn:'1/-1'}}>
            <label style={{display:'flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={recordPaymentNow} onChange={e=>{
                const checked = e.target.checked; setRecordPaymentNow(checked);
                if (checked) { setPaymentAtCreate({ amount: form.total, mode: 'Cash' }); }
                else { setPaymentAtCreate({ amount: '', mode: 'Cash' }); }
              }} /> Record payment now
            </label>
          </div>
          )}
          {form.sale_type === 'Cash' && recordPaymentNow && (
            <>
              <div className="input-group">
                <label>Amount Received</label>
                <input className="input" type="number" step="0.01" value={paymentAtCreate.amount} onChange={e=>setPaymentAtCreate({...paymentAtCreate, amount: e.target.value})} inputMode="decimal" />
              </div>
              <div className="input-group" style={{overflow:'visible'}}>
                <label>Payment Mode</label>
                <Dropdown
                  value={paymentAtCreate.mode}
                  onChange={(v)=>setPaymentAtCreate({...paymentAtCreate, mode: v})}
                  options={[{value:'Cash',label:'Cash'},{value:'Gpay',label:'Gpay'},{value:'Card',label:'Card'}]}
                />
              </div>
            </>
          )}
          
          <div className="actions-row" style={{justifyContent:'flex-end', gridColumn:'1/-1'}}>
            <button className="btn primary w-full sm:w-auto" type="submit">{editing ? 'Update Sale' : 'Add Sale'}</button>
            {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ customer_id: '', total: '', egg_type: '', material_code: '', category: '' }); setPricingInfo(null); }}>Cancel</button>}
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <Card title="Sales List">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3">
          <input className="input w-full sm:w-72" placeholder="Search by #, customer, product" value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
          <div className="w-full sm:w-52" style={{overflow:'visible'}}>
            <Dropdown
              value={categoryFilter}
              onChange={(v)=>{ setCategoryFilter(v); setPage(1); }}
              placeholder={'All Categories'}
              options={[{value:'',label:'All Categories'},{value:'Retail',label:'Retail'},{value:'Wholesale',label:'Wholesale'},{value:'Walk-in',label:'Walk-in'}]}
            />
          </div>
          <div className="ml-auto flex items-center gap-3" style={{overflow:'visible'}}>
            <div className="w-36" style={{minWidth:'9rem'}}>
              <Dropdown
                value={String(pageSize)}
                onChange={(v)=>{ setPageSize(Number(v)); setPage(1); }}
                options={[{value:'5',label:'5 / page'},{value:'10',label:'10 / page'},{value:'20',label:'20 / page'}]}
              />
            </div>
            <div className="btn-group">
              <button type="button" className="btn secondary btn-sm" onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={currentPage===1}>Prev</button>
              <button type="button" className="btn secondary btn-sm" onClick={()=>setPage(p=>Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>Next</button>
            </div>
            <div style={{color:'#b6beca', fontSize:12}}>Page {currentPage} / {totalPages}</div>
          </div>
        </div>
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          {filteredSales.length === 0 ? (
            <div className="card" style={{padding:16, textAlign:'center'}}>No sales yet. Create your first sale using the form.</div>
          ) : (
          <table className="table table-hover table-zebra mt-2">
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Total</th><th>Paid</th><th>Balance</th><th>Product</th><th>Category</th><th style={{width:320, textAlign:'right'}}>Actions</th></tr>
            </thead>
            <tbody>
              {pagedSales.map(s => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td><span className="badge">{customers.find(c=>String(c.id)===String(s.customer_id))?.name || `#${s.customer_id}`}</span></td>
                  <td style={{textAlign:'right'}}>₹ {Number(s.total).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td style={{textAlign:'right'}}>₹ {Number(paymentsByInvoice[String(s.id)]||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td style={{textAlign:'right'}}>₹ {Math.max(0, Number(s.total) - Number(paymentsByInvoice[String(s.id)]||0)).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td><div className="truncate max-w-[12rem]">{s.product_name || s.egg_type || '-'}</div></td>
                  <td>{s.category || 'Retail'}</td>
                  <td style={{textAlign:'right'}}>
                    <div className="btn-group" style={{justifyContent:'flex-end'}}>
                      <Link className="btn primary btn-sm" to={`/invoice/${s.id}`}>Invoice</Link>
                      <Link className="btn secondary btn-sm" to={`/sales/${s.id}/items`}>Items</Link>
                      <button className="btn icon btn-sm" title="Edit" onClick={()=>{ setEditing(s.id); setForm({ customer_id: s.customer_id, total: s.total, product_name: s.product_name || s.egg_type || '', material_code: s.material_code || '', category: s.category || 'Retail' }); }}>✏️</button>
                      <button className="btn danger btn-sm" onClick={async()=>{ try { await deleteSale(s.id); await fetchSales(); setSuccess('Sale deleted.'); setTimeout(()=>setSuccess(''),2000); } catch(e) { console.error('Delete failed', e); } }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
        {/* Mobile cards with Load More */}
        <div className="block sm:hidden">
          {filteredSales.length === 0 && (
            <div className="card" style={{padding:16, textAlign:'center'}}>No sales yet. Create your first sale using the form.</div>
          )}
          {visibleSales.map(s => {
            const paid = Number(paymentsByInvoice[String(s.id)]||0);
            const balance = Math.max(0, Number(s.total) - paid);
            return (
              <div key={s.id} className="card" style={{marginBottom:12}}>
                <div className="card-body">
                  <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                    <span>Sale #{s.id}</span>
                    <span className="badge">{s.category || 'Retail'}</span>
                  </div>
                  <div style={{fontSize:13, color:'#9fb0c2', marginBottom:8}}>Customer: {customers.find(c=>String(c.id)===String(s.customer_id))?.name || `#${s.customer_id}`}</div>
                  <div className="data-pairs">
                    <div className="pair"><strong>Product</strong><div>{s.product_name || '-'}</div></div>
                    <div className="pair" style={{textAlign:'right'}}><strong>Total</strong><div>₹ {Number(s.total).toFixed(2)}</div></div>
                    <div className="pair" style={{textAlign:'right'}}><strong>Paid</strong><div>₹ {paid.toFixed(2)}</div></div>
                    <div className="pair" style={{textAlign:'right'}}><strong>Balance</strong><div>₹ {balance.toFixed(2)}</div></div>
                  </div>
                  <div className="btn-group" style={{marginTop:10}}>
                    <Link className="btn primary btn-sm" to={`/invoice/${s.id}`}>Invoice</Link>
                    <Link className="btn secondary btn-sm" to={`/sales/${s.id}/items`}>Items</Link>
                    <button className="btn icon btn-sm" onClick={()=>{ setEditing(s.id); setForm({ customer_id: s.customer_id, total: s.total, product_name: s.product_name || s.egg_type || '', material_code: s.material_code || '', category: s.category || 'Retail' }); }}>✏️</button>
                    <button className="btn danger btn-sm" onClick={async()=>{ try { await deleteSale(s.id); await fetchSales(); setSuccess('Sale deleted.'); setTimeout(()=>setSuccess(''),2000); } catch(e) { console.error('Delete failed', e); } }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
          {visibleSales.length < filteredSales.length && (
            <div style={{display:'flex', justifyContent:'center', marginTop:12}}>
              <button type="button" className="btn primary w-full" onClick={()=> setPage(p => p + 1)}>
                Load More
              </button>
            </div>
          )}
        </div>
      </Card>
      </div>

      {payingSale && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}} onClick={()=>setPayingSale(null)}>
          <div style={{background:'#fff', padding:20, borderRadius:8, width:'min(480px, 90vw)'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:'0 0 12px 0'}}>Record Payment for Sale #{payingSale.id}</h3>
            <div className="form-grid" style={{gridTemplateColumns:'repeat(2, minmax(0,1fr))'}}>
              <div className="input-group">
                <label>Amount</label>
                <input className="input" value={payForm.amount} onChange={e=>setPayForm({...payForm, amount:e.target.value})} inputMode="decimal" />
              </div>
              <div className="input-group" style={{overflow:'visible'}}>
                <label>Mode</label>
                <Dropdown
                  value={payForm.mode}
                  onChange={(v)=>setPayForm({...payForm, mode: v})}
                  placeholder={'Payment Mode'}
                  options={[{value:'Cash',label:'Cash'},{value:'Gpay',label:'Gpay'},{value:'Card',label:'Card'}]}
                />
              </div>
            </div>
            <div className="actions-row" style={{marginTop:12}}>
              <button className="btn" onClick={async()=>{
                const amt = Number(payForm.amount||0);
                if (!(amt>0)) return;
                await createPayment({ customer_id: Number(payingSale.customer_id), invoice_id: Number(payingSale.id), amount: amt, payment_mode: payForm.mode||'Cash' });
                const pays = await getPayments();
                const map = {};
                (pays.data||[]).forEach(p=>{ const k = String(p.invoice_id); map[k] = (map[k]||0) + Number(p.amount||0); });
                setPaymentsByInvoice(map);
                setPayingSale(null);
              }}>Save Payment</button>
              <button className="btn secondary" onClick={()=>setPayingSale(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;

