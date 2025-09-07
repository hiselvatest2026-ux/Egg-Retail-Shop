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
  const [addForm, setAddForm] = useState({ material_code:'', material_type:'', price_per_piece:'', uom:'Piece', dom:'', shelf_life:'', qty:'' });
  const [addErrors, setAddErrors] = useState({});
  const [addSuccess, setAddSuccess] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const sortedMaterials = useMemo(()=>{
    const src = Array.isArray(materials) ? [...materials] : [];
    const pr = (m)=>{
      const n = String(m.description || m.metal_type || '').toLowerCase();
      if (n.includes('egg')) return 0;
      if (n.includes('panner') || n.includes('paneer')) return 1;
      return 2;
    };
    src.sort((a,b)=>{ const da=pr(a), db=pr(b); if (da!==db) return da-db; return String(a.metal_type||'').localeCompare(String(b.metal_type||'')); });
    return src;
  }, [materials]);
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
  const computeItemGst = (item) => {
    let gstPercent = 0;
    if (item.material_code) {
      const mat = materials.find(m=> String(m.part_code)===String(item.material_code));
      if (mat) gstPercent = Number(mat.gst_percent||0);
    } else if (item.material_type) {
      const mat2 = materials.find(m=> String(m.metal_type||'').toLowerCase()===String(item.material_type||'').toLowerCase());
      if (mat2) gstPercent = Number(mat2.gst_percent||0);
    }
    const sgstPercent = gstPercent/2;
    const cgstPercent = gstPercent/2;
    const effQty = item.qty_unit==='Tray' ? (Number(item.trays||0)*30) : Number(item.qty_pieces||0);
    const base = Number(item.price_per_piece||0) * effQty;
    const sgstAmt = base * (sgstPercent/100);
    const cgstAmt = base * (cgstPercent/100);
    const total = base + sgstAmt + cgstAmt;
    return { base, sgstPercent, cgstPercent, sgstAmt, cgstAmt, total };
  };
  const itemsTotalWithGst = useMemo(()=>{
    return (lineItems||[]).reduce((sum, it)=> sum + computeItemGst(it).total, 0);
  }, [lineItems, materials]);

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
          const effQty = it.qty_unit === 'Tray' ? Number(it.trays||0) * 30 : (it.effectiveQty != null ? Number(it.effectiveQty||0) : Number(it.qty_pieces||0));
          const price = Number(it.price_per_piece || 0);
          if (!(effQty>0)) continue;
          let pid = it.product_id ? Number(it.product_id) : null;
          if (!pid && it.material_code) {
            const mat = materials.find(m=> String(m.part_code)===String(it.material_code));
            if (mat) {
              const prod = products.find(p=> String(p.name||'').toLowerCase() === String(mat.metal_type||'').toLowerCase());
              if (prod) pid = Number(prod.id);
            }
          }
          if (!pid && it.material_type) {
            const prod2 = products.find(p=> String(p.name||'').toLowerCase() === String(it.material_type||'').toLowerCase());
            if (prod2) pid = Number(prod2.id);
          }
          if (!pid) continue;
          await createSaleItem(newSale.id, { product_id: pid, quantity: effQty, price });
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

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Card title="Sales Entry">
          {/* Auto fields display */}
          <div className="data-pairs" style={{marginBottom:8}}>
            <div className="pair"><strong>Sales Type</strong><div>Cash</div></div>
            <div className="pair"><strong>Sale Category</strong><div>Retail</div></div>
            <div className="pair"><strong>Route Name</strong><div>{(trips && trips[0]) ? (trips[0].route_name || trips[0].master_route_name || 'Route') : 'No Route (Today)'}</div></div>
            <div className="pair" style={{textAlign:'right'}}><strong>Total Amount</strong><div>₹ {itemsTotalWithGst.toFixed(2)}</div></div>
          </div>
          {/* Add Item row */}
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-10 gap-2">
                <div style={{overflow:'visible'}}>
                  <Dropdown
                    value={addForm.material_code}
                    onChange={(code)=>{
                      const mat = sortedMaterials.find(m=> String(m.part_code)===String(code));
                      setAddForm(prev=>({ ...prev, material_code: code, material_type: mat ? mat.metal_type : '' }));
                    }}
                    placeholder={'Product Code *'}
                    options={(sortedMaterials||[]).map(m=>({ value:String(m.part_code), label:`${m.part_code} - ${m.description || m.metal_type}` }))}
                  />
                </div>
                <input className="input" placeholder="Product Name" value={addForm.material_type||''} readOnly />
                <input className="input" placeholder="Price / unit *" value={addForm.price_per_piece||''} onChange={e=>setAddForm({...addForm, price_per_piece:e.target.value})} inputMode="decimal" />
                <div style={{overflow:'visible'}}>
                  <Dropdown value={addForm.uom||'Piece'} onChange={(v)=>setAddForm({...addForm, uom:v})} options={[{value:'Piece',label:'Piece'},{value:'Tray',label:'Tray (30 pcs)'}]} />
                </div>
                <input className="input date" type="date" placeholder="DOM" value={addForm.dom||''} onChange={e=>setAddForm({...addForm, dom:e.target.value})} />
                <input className="input" placeholder="Shelf Life" value={addForm.shelf_life||''} onChange={e=>setAddForm({...addForm, shelf_life:e.target.value})} />
                <input className="input" placeholder="Quantity *" value={addForm.qty||''} onChange={e=>setAddForm({...addForm, qty:e.target.value})} inputMode="numeric" />
                <input className="input" placeholder="SGST (auto)" value={(()=>{ const t=computeItemGst({ ...addForm, qty_unit:addForm.uom, qty_pieces:addForm.uom==='Piece'?addForm.qty:'', trays:addForm.uom==='Tray'?addForm.qty:'' }); return t.sgstAmt? t.sgstAmt.toFixed(2):''; })()} readOnly />
                <input className="input" placeholder="CGST (auto)" value={(()=>{ const t=computeItemGst({ ...addForm, qty_unit:addForm.uom, qty_pieces:addForm.uom==='Piece'?addForm.qty:'', trays:addForm.uom==='Tray'?addForm.qty:'' }); return t.cgstAmt? t.cgstAmt.toFixed(2):''; })()} readOnly />
                <input className="input" placeholder="Total (auto)" value={(()=>{ const t=computeItemGst({ ...addForm, qty_unit:addForm.uom, qty_pieces:addForm.uom==='Piece'?addForm.qty:'', trays:addForm.uom==='Tray'?addForm.qty:'' }); return t.total? t.total.toFixed(2):''; })()} readOnly />
              </div>
              <div className="actions-row" style={{justifyContent:'flex-end', marginTop:8}}>
                <button type="button" className="btn primary" onClick={()=>{
                  const qtyNum = Number(addForm.qty||0); const price = Number(addForm.price_per_piece||0);
                  if (!addForm.material_code || !(qtyNum>0) || !(price>0)) return;
                  const effQty = (addForm.uom||'Piece')==='Tray' ? qtyNum*30 : qtyNum;
                  const newItem = { material_code:addForm.material_code, material_type:addForm.material_type, qty_unit:addForm.uom||'Piece', qty_pieces:(addForm.uom||'Piece')==='Piece'? String(qtyNum):'', trays:(addForm.uom||'Piece')==='Tray'? String(qtyNum):'', price_per_piece: price, effectiveQty: effQty };
                  const g = computeItemGst(newItem);
                  setLineItems(prev=>[...prev, { ...newItem, sgst_amount:g.sgstAmt, cgst_amount:g.cgstAmt, lineTotal:g.base, totalWithGst:g.total }]);
                  setAddForm({ material_code:'', material_type:'', price_per_piece:'', uom:'Piece', dom:'', shelf_life:'', qty:'' });
                }}>Add Item</button>
              </div>
            </div>
          </div>
          {/* Items table */}
          {lineItems.length>0 && (
            <div className="hidden sm:block overflow-x-auto" style={{marginTop:8}}>
              <table className="table table-hover table-zebra mt-2" style={{display:'table', tableLayout:'fixed', width:'100%'}}>
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th style={{textAlign:'right'}}>Price / unit</th>
                    <th>UOM</th>
                    <th>DOM</th>
                    <th>Shelf Life</th>
                    <th style={{textAlign:'right'}}>Quantity</th>
                    <th style={{textAlign:'right'}}>SGST</th>
                    <th style={{textAlign:'right'}}>CGST</th>
                    <th style={{textAlign:'right'}}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((it,idx)=>{
                    const label = it.material_code ? `${it.material_code} - ${it.material_type||''}` : (it.material_type||'-');
                    const gst = computeItemGst(it);
                    return (
                      <tr key={idx}>
                        <td>{it.material_code}</td>
                        <td>{label}</td>
                        <td style={{textAlign:'right'}}>{Number(it.price_per_piece||0).toFixed(2)}</td>
                        <td>{it.qty_unit||'Piece'}</td>
                        <td>-</td>
                        <td>-</td>
                        <td style={{textAlign:'right'}}>{it.effectiveQty||0}</td>
                        <td style={{textAlign:'right'}}>{gst.sgstAmt.toFixed(2)}</td>
                        <td style={{textAlign:'right'}}>{gst.cgstAmt.toFixed(2)}</td>
                        <td style={{textAlign:'right'}}>{gst.total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan={9}></td>
                    <td style={{textAlign:'right', fontWeight:800}}>₹ {itemsTotalWithGst.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Card>
        
        <Card title="Record Payments">
          <div className="hidden sm:block overflow-x-auto">
            <table className="table table-hover table-zebra mt-2">
              <thead>
                <tr><th>ID</th><th>Customer</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>Paid</th><th style={{textAlign:'right'}}>Balance</th><th style={{textAlign:'right'}}>Actions</th></tr>
              </thead>
              <tbody>
                {sales.map(s => {
                  const paid = Number(paymentsByInvoice[String(s.id)]||0);
                  const balance = Math.max(0, Number(s.total) - paid);
                  return (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td>{customers.find(c=>String(c.id)===String(s.customer_id))?.name || `#${s.customer_id}`}</td>
                      <td style={{textAlign:'right'}}>₹ {Number(s.total||0).toFixed(2)}</td>
                      <td style={{textAlign:'right'}}>₹ {paid.toFixed(2)}</td>
                      <td style={{textAlign:'right'}}>₹ {balance.toFixed(2)}</td>
                      <td style={{textAlign:'right'}}>
                        <button className="btn primary btn-sm" onClick={()=>setPayingSale(s)}>Record Payment</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

