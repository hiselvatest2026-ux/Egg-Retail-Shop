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

