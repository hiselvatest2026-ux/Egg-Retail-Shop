import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSales, createSale, updateSale, deleteSale, getCustomers, getPricingForSale, getMetals, getPayments, createPayment, getAvailable, getRouteTrips, createRouteTrip } from '../api/api';
import { Link } from 'react-router-dom';
import Card from '../components/Card';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({ customer_id: '', total: '', product_name: '', material_code: '', category: 'Retail', quantity: '1', sale_type: 'Cash', payment_mode: 'Cash', route_trip_id: '' });
  const [trips, setTrips] = useState([]);
  const [newTrip, setNewTrip] = useState({ route_name: '', vehicle_number: '', service_date: () => new Date().toISOString().slice(0,10) });
  const [available, setAvailable] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
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
    if (!form.product_name || !form.material_code) { setError('Please select a product.'); return; }
    if (!form.quantity || Number.isNaN(Number(form.quantity))) { setError('Please enter a valid quantity.'); return; }
    if (!form.total || Number.isNaN(Number(form.total))) { setError('Total could not be calculated.'); return; }
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
      setForm({ customer_id: '', total: '', product_name: '', material_code: '', category: 'Retail', quantity: '1', sale_type:'Cash', payment_mode:'Cash' });
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

  // Auto-calc total when pricing or quantity changes
  useEffect(() => {
    const qty = Number(form.quantity || 0);
    const unitFinal = pricingInfo ? Number(pricingInfo.final_price || 0) : 0;
    const total = unitFinal * qty;
    if (isFinite(total)) {
      setForm(prev => ({ ...prev, total: total.toFixed(2) }));
    }
  }, [pricingInfo, form.quantity]);

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

  return (
    <div className="page space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="page-subtitle">Record sales and access invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title={editing ? 'Edit Sale' : 'Add Sale'}>
        <form onSubmit={handleSubmit} className="form-grid-2">
          <div className="input-group">
            <label>Product Name</label>
            <select className="input" title={form.product_name || 'Select product'} value={form.product_name} onChange={e=>setForm({...form, product_name: e.target.value})}>
              <option value="" disabled>Select product</option>
              {materials.map(m => (
                <option key={m.id} value={m.metal_type}>{m.metal_type}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Sales Type</label>
            <select className="input" value={form.sale_type} onChange={e=>setForm({...form, sale_type:e.target.value})}>
              <option value="Cash">Cash</option>
              <option value="Credit">Credit</option>
            </select>
          </div>
          <div className="input-group">
            <label>Customer</label>
            <select className="input" title={(customers.find(c=>String(c.id)===String(form.customer_id))?.name) || ''} value={form.customer_id} onChange={e=>setForm({...form, customer_id: e.target.value})}>
              <option value="" disabled>{customers.length ? 'Select customer' : 'No customers found - add one first'}</option>
              {customers.map(c => (<option key={c.id} value={c.id}>{c.name} (#{c.id})</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Category</label>
            <select className="input" title={form.category} value={form.category} onChange={e=>setForm({...form, category: e.target.value})}>
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Walk-in">Walk-in</option>
            </select>
          </div>
          <div className="input-group">
            <label>Material Code</label>
            <select className="input" title={form.material_code || ''} value={form.material_code} onChange={e=>setForm({...form, material_code: e.target.value})}>
              <option value="" disabled>Select Material</option>
              {materials.map(m => (
                <option key={m.id} value={m.part_code}>{m.part_code} - {m.description || m.metal_type}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Quantity</label>
            <input className="input" type="number" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} inputMode="numeric" />
          </div>
          <div className="input-group">
            <label>Total Amount</label>
            <input className="input" value={form.total} readOnly />
          </div>

          {/* Route controls (full-width, placed after core fields to maintain alignment) */}
          <div className="input-group" style={{gridColumn:'1/-1'}}>
            <label>Route (Today)</label>
            <select className="input" value={form.route_trip_id} onChange={e=>setForm({...form, route_trip_id: e.target.value})}>
              <option value="">No Route</option>
              {trips.map(t => (
                <option key={t.id} value={t.id}>{t.route_name || t.master_route_name || 'Route'} - {t.vehicle_number || '-'} ({new Date(t.service_date).toLocaleDateString()})</option>
              ))}
            </select>
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
              <div className="input-group">
                <label>Payment Mode</label>
                <select className="input" value={paymentAtCreate.mode} onChange={e=>setPaymentAtCreate({...paymentAtCreate, mode: e.target.value})}>
                  <option value="Cash">Cash</option>
                  <option value="Gpay">Gpay</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </>
          )}
          
          <div className="actions-row" style={{justifyContent:'flex-end', gridColumn:'1/-1'}}>
            <button className="btn primary w-full sm:w-auto" type="submit">{editing ? 'Update Sale' : 'Add Sale'}</button>
            {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ customer_id: '', total: '', egg_type: '', material_code: '', category: 'Retail' }); setPricingInfo(null); }}>Cancel</button>}
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <Card title="Sales List">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3">
          <input className="input w-full sm:w-72" placeholder="Search by #, customer, product" value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} />
          <select className="input w-full sm:w-52" value={categoryFilter} onChange={e=>{ setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Walk-in">Walk-in</option>
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
                  <td><span className="badge">{s.customer_id}</span></td>
                  <td>₹ {Number(s.total).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td>₹ {Number(paymentsByInvoice[String(s.id)]||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td>₹ {Math.max(0, Number(s.total) - Number(paymentsByInvoice[String(s.id)]||0)).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
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
        {/* Mobile cards */}
        <div className="block sm:hidden">
          {filteredSales.length === 0 && (
            <div className="card" style={{padding:16, textAlign:'center'}}>No sales yet. Create your first sale using the form.</div>
          )}
          {pagedSales.map(s => {
            const paid = Number(paymentsByInvoice[String(s.id)]||0);
            const balance = Math.max(0, Number(s.total) - paid);
            return (
              <div key={s.id} className="card" style={{marginBottom:10}}>
                <div className="card-body">
                  <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                    <span>Sale #{s.id}</span>
                    <span className="badge">{s.category || 'Retail'}</span>
                  </div>
                  <div style={{fontSize:13, color:'#9fb0c2', marginBottom:8}}>Customer: #{s.customer_id}</div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div><strong>Product:</strong> {s.product_name || '-'}</div>
                    <div><strong>Total:</strong> ₹ {Number(s.total).toFixed(2)}</div>
                    <div><strong>Paid:</strong> ₹ {paid.toFixed(2)}</div>
                    <div><strong>Balance:</strong> ₹ {balance.toFixed(2)}</div>
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
              <div className="input-group">
                <label>Mode</label>
                <input className="input" value={payForm.mode} onChange={e=>setPayForm({...payForm, mode:e.target.value})} placeholder="Cash / Card / UPI" />
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

