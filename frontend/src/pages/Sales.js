import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSales, createSale, updateSale, deleteSale, getCustomers, getPricingForSale, getMetals, getPayments, createPayment, getAvailable, getProducts, createSaleItem, getLastPurchasePrice, clearTransactions } from '../api/api';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
// Removed ShopChip

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState({ customer_id: '', total: '', product_name: '', material_code: '', category: '', quantity: '1', quantity_unit: 'Piece', trays: '', sale_type: 'Cash', payment_mode: 'Cash' });
  
  const [available, setAvailable] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [lineItems, setLineItems] = useState([]);
  const [availableHint, setAvailableHint] = useState(null);
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
  // Auto-set sale category from selected customer (Customer Master)
  useEffect(() => {
    if (!form.customer_id) return;
    const cust = customers.find(c => String(c.id) === String(form.customer_id));
    if (cust && cust.category && String(form.category) !== String(cust.category)) {
      setForm(prev => ({ ...prev, category: cust.category }));
    }
  }, [form.customer_id, customers]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentsFilter, setPaymentsFilter] = useState({ customer_id: '', invoice_id: '', showPaid: false });
  const [recordPaymentNow, setRecordPaymentNow] = useState(false);
  const [paymentAtCreate, setPaymentAtCreate] = useState({ amount: '', mode: 'Cash' });
  const [paymentsByInvoice, setPaymentsByInvoice] = useState({});
  const [payingSale, setPayingSale] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', mode: 'Cash' });

  // Mobile detection and full-screen picker state
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(max-width: 640px)');
      const apply = () => setIsMobile(!!mq.matches);
      apply();
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    } catch(_) { setIsMobile(false); }
  }, []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState(''); // 'customer' | 'sale_type' | 'sale_category' | 'material' | 'uom' | 'pay_mode' | 'pay_mode_modal'
  const [pickerSearch, setPickerSearch] = useState('');
  const openPicker = (type) => { setPickerType(type); setPickerSearch(''); setPickerOpen(true); };
  const closePicker = () => { setPickerOpen(false); setPickerType(''); setPickerSearch(''); };

  // Ensure base categories always include Walk-in alongside Retail/Wholesale
  const saleCategories = useMemo(() => {
    const base = ['Retail','Wholesale','Walk-in'];
    const fromCustomers = Array.from(new Set((customers||[]).map(c=>c.category).filter(Boolean)));
    const merged = Array.from(new Set([...base, ...fromCustomers]));
    const order = new Map(base.map((c,i)=>[c,i]));
    merged.sort((a,b)=>{ const ia = order.has(a)?order.get(a):base.length; const ib = order.has(b)?order.get(b):base.length; if (ia!==ib) return ia-ib; return String(a).localeCompare(String(b)); });
    return merged;
  }, [customers]);

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

  // Live preview for current addForm line so total reflects instantly as user types
  const addFormTotalWithGst = useMemo(() => {
    const qtyNum = Number(addForm.qty||0);
    const priceNum = Number(addForm.price_per_piece||0);
    if (!(qtyNum>0) || !(priceNum>0)) return 0;
    const itemLike = {
      material_code: addForm.material_code,
      material_type: addForm.material_type,
      qty_unit: addForm.uom || 'Piece',
      qty_pieces: (addForm.uom||'Piece') === 'Piece' ? qtyNum : '',
      trays: (addForm.uom||'Piece') === 'Tray' ? qtyNum : '',
      price_per_piece: priceNum
    };
    return computeItemGst(itemLike).total;
  }, [addForm.material_code, addForm.material_type, addForm.uom, addForm.qty, addForm.price_per_piece, materials]);

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
        // Removed route trips (location/shop removed)
        
      } catch(e){ 
        console.error('data load failed', e);
      } 
    })(); 
  }, []);

  // Auto-populate Sale Category from selected customer (Customer Master)
  useEffect(() => {
    if (!customers || customers.length === 0) return;
    // If user selects a customer in payments filter, reflect their category into Sales Entry
    if (paymentsFilter.customer_id) {
      const cust = customers.find(c => String(c.id) === String(paymentsFilter.customer_id));
      if (cust && cust.category && String(form.category) !== String(cust.category)) {
        setForm(prev => ({ ...prev, category: cust.category }));
      }
      return;
    }
    // Otherwise, default to first available category if none selected yet
    if (!form.category) {
      if (saleCategories.length > 0) setForm(prev => ({ ...prev, category: saleCategories[0] }));
    }
  }, [paymentsFilter.customer_id, customers, saleCategories]);

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
    // Allow single-row quick invoice: if no items yet but Add Item form is valid, use it
    const canUseAddForm = addForm.material_code && Number(addForm.qty||0) > 0 && Number(addForm.price_per_piece||0) > 0;
    let itemsToSave = lineItems;
    if (!hasItems && canUseAddForm) {
      const qtyNum = Number(addForm.qty||0);
      const effQty = (addForm.uom||'Piece')==='Tray' ? qtyNum*30 : qtyNum;
      itemsToSave = [{
        material_code: addForm.material_code,
        material_type: addForm.material_type,
        qty_unit: addForm.uom || 'Piece',
        qty_pieces: (addForm.uom||'Piece')==='Piece' ? String(qtyNum) : '',
        trays: (addForm.uom||'Piece')==='Tray' ? String(qtyNum) : '',
        price_per_piece: Number(addForm.price_per_piece||0),
        effectiveQty: effQty
      }];
    }
    if (!hasItems && !canUseAddForm) { setError('Add at least one item (or fill Add Item and we will include it) before generating invoice.'); return; }
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
      if (itemsToSave.length > 0) {
        // Pre-check stock for each line item; abort early if insufficient
        const stockChecks = await Promise.all(itemsToSave.map(async (it) => {
          let pid = it.product_id ? Number(it.product_id) : null;
          if (!pid && it.material_code) {
            const mat = materials.find(m=> String(m.part_code)===String(it.material_code));
            if (mat) {
              const label = String(mat.metal_type||'').toLowerCase();
              let prod = products.find(p=> String(p.name||'').toLowerCase() === label)
                || products.find(p=> String(p.name||'').toLowerCase().includes(label) || label.includes(String(p.name||'').toLowerCase()));
              if (!prod && /egg/.test(label)) prod = products.find(p=> /egg/.test(String(p.name||'').toLowerCase()));
              
              if (prod) pid = Number(prod.id);
            }
          }
          if (!pid && it.material_type) {
            const label = String(it.material_type||'').toLowerCase();
            let prod2 = products.find(p=> String(p.name||'').toLowerCase() === label)
              || products.find(p=> String(p.name||'').toLowerCase().includes(label) || label.includes(String(p.name||'').toLowerCase()));
            if (!prod2 && /egg/.test(label)) prod2 = products.find(p=> /egg/.test(String(p.name||'').toLowerCase()));
            
            if (prod2) pid = Number(prod2.id);
          }
          if (!pid) return null;
          try {
            const res = await getAvailable({ product_id: pid });
            const availableNow = Number(res.data?.available||0);
            const effQty = it.qty_unit === 'Tray' ? Number(it.trays||0) * 30 : (it.effectiveQty != null ? Number(it.effectiveQty||0) : Number(it.qty_pieces||0));
            return { pid, availableNow, required: effQty, label: it.material_type || it.material_code };
          } catch (_) { return null; }
        }));
        // Guard: ensure all items mapped to a product
        const unmapped = (itemsToSave||[]).filter((it, i)=> !stockChecks[i] || !stockChecks[i].pid);
        if (unmapped.length > 0) {
          const first = unmapped[0];
          setError(`Cannot map item to product: ${first.material_type || first.material_code}. Please verify Material Master and Products.`);
          return;
        }
        const shortages = (stockChecks||[]).filter(chk => chk && chk.required > chk.availableNow);
        if (shortages.length > 0) {
          const first = shortages[0];
          setError(`Insufficient stock for ${first.label || 'item'}: required ${first.required}, available ${first.availableNow}`);
          return;
        }
        const res = await createSale({ customer_id: Number(form.customer_id), total: 0, product_name: null, payment_method: form.payment_mode, sale_type: form.sale_type });
        const newSale = res.data;
        const tasks = itemsToSave.map(async (it) => {
          const effQty = it.qty_unit === 'Tray' ? Number(it.trays||0) * 30 : (it.effectiveQty != null ? Number(it.effectiveQty||0) : Number(it.qty_pieces||0));
          const price = Number(it.price_per_piece || 0);
          if (!(effQty>0)) return null;
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
          if (!pid) return null;
          return createSaleItem(newSale.id, { product_id: pid, quantity: effQty, price });
        });
        await Promise.all(tasks);
        // On mobile, auto-record full payment for Cash sales even if amount left blank
        const willRecordPayment = (isMobile && String(form.sale_type)==='Cash') || (Number(paymentAtCreate.amount||0) > 0);
        if (willRecordPayment) {
          const sum = lineItems.reduce((s,li)=> s + (Number(li.price_per_piece||0) * (li.qty_unit==='Tray' ? Number(li.trays||0)*30 : Number(li.qty_pieces||0))), 0);
          const defaultAmt = sum; // items total for this invoice path
          const amt = Number(paymentAtCreate.amount || defaultAmt || 0);
          const mode = paymentAtCreate.mode || 'Cash';
          if (amt > 0) {
            await createPayment({ customer_id: Number(form.customer_id), invoice_id: Number(newSale.id), amount: amt, payment_mode: mode });
          }
        }
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('inventory:refresh', { detail: { type: 'closing' } })); } catch(_) {}
        navigate(`/invoice/${newSale.id}`);
      } else {
        // Quick single-row: map product BEFORE creating sale to avoid orphan invoices
        let productId = null;
        const mat = materials.find(m=> String(m.part_code)===String(form.material_code));
        if (mat) {
          const label = String(mat.metal_type||'').toLowerCase();
          let prod = products.find(p=> String(p.name||'').toLowerCase() === label)
            || products.find(p=> String(p.name||'').toLowerCase().includes(label) || label.includes(String(p.name||'').toLowerCase()));
          if (!prod && /egg/.test(label)) prod = products.find(p=> /egg/.test(String(p.name||'').toLowerCase()));
          
          if (prod) productId = Number(prod.id);
        }
        if (!productId) { setError('Cannot map selected item to a product. Please verify Material Master and Products.'); return; }
        const qty = String(form.quantity_unit)==='Tray' ? (Number(form.trays||0)*30) : Number(form.quantity||0);
        const unitFinal = pricingInfo ? Number(pricingInfo.final_price || 0) : 0;
        const pricePerPiece = unitFinal > 0 ? unitFinal : (Number(form.total||0) / (qty||1));
        const payload = { customer_id: Number(form.customer_id), total: Number(form.total), product_name: form.product_name || null, payment_method: form.payment_mode, sale_type: form.sale_type };
        if (editing) { 
          await updateSale(editing, payload); 
        } else { 
          const res = await createSale(payload);
          const newSale = res.data;
          await createSaleItem(newSale.id, { product_id: productId, quantity: qty, price: pricePerPiece });
          // Re-evaluate for quick single-row: mobile Cash auto-record when amount blank
          const willRecordPaymentQuick = (isMobile && String(form.sale_type)==='Cash') || (Number(paymentAtCreate.amount||0) > 0);
          if (willRecordPaymentQuick) {
            const defaultAmt2 = Number(form.total || 0);
            const amt = Number(paymentAtCreate.amount || defaultAmt2 || 0);
            const mode = paymentAtCreate.mode || 'Cash';
            if (amt > 0) {
              await createPayment({ customer_id: Number(form.customer_id), invoice_id: Number(newSale.id), amount: amt, payment_mode: mode });
            }
          }
          try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('inventory:refresh', { detail: { type: 'closing' } })); } catch(_) {}
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
      const msg = err?.response?.data?.message || err?.message || 'Failed to save sale. Please try again.';
      setError(msg);
    }
  };

  const toDDMMYYYY = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) {
      const s = String(d);
      // try YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const [y,m,dd] = s.slice(0,10).split('-');
        return `${dd}-${m}-${y}`;
      }
      return s;
    }
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth()+1).padStart(2, '0');
    const yy = dt.getFullYear();
    return `${dd}-${mm}-${yy}`;
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

  // When category or customer changes and a material is already picked, refresh addForm price from Pricing Master
  useEffect(() => {
    const code = addForm.material_code;
    if (!code) return;
    const customer = customers.find(c => String(c.id) === String(form.customer_id));
    const categoryForPricing = form.category || (customer && customer.category) || '';
    getPricingForSale({ customer_id: form.customer_id, material_code: code, category: categoryForPricing })
      .then(async r=>{
        const base = Number(r?.data?.base_price || 0);
        if (base > 0) {
          setAddForm(prev=>({ ...prev, price_per_piece: String(base) }));
        } else {
          try {
            const rr = await getLastPurchasePrice({ material_code: code });
            const price = Number(rr?.data?.price || 0);
            if (price > 0) setAddForm(prev=>({ ...prev, price_per_piece: String(price) }));
          } catch(_) {}
        }
      })
      .catch(async ()=>{
        try {
          const rr = await getLastPurchasePrice({ material_code: code });
          const price = Number(rr?.data?.price || 0);
          if (price > 0) setAddForm(prev=>({ ...prev, price_per_piece: String(price) }));
        } catch(_) {}
      });
  }, [form.customer_id, form.category, addForm.material_code, customers]);

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
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Card title="Sales Entry">
          <form onSubmit={handleSubmit}>
          {/* Section header emphasis */}
          <div className="card-header" style={{borderRadius:12, marginBottom:12}}>
            <div className="card-title" style={{fontSize:18}}>Sale Details</div>
          </div>
          {/* Controls: responsive grid */}
          <div className="form-row" style={{marginBottom:12}}>
            <div className="input-group" style={{overflow:'visible'}}>
              <label>Customer</label>
              {isMobile ? (
                <button type="button" className="input" style={{textAlign:'left'}} onClick={()=>openPicker('customer')}>
                  {form.customer_id ? ((customers.find(c=>String(c.id)===String(form.customer_id))||{}).name || `#${form.customer_id}`) : 'Select Customer'}
                </button>
              ) : (
                <Dropdown
                  value={form.customer_id}
                  onChange={(v)=>setForm(prev=>({ ...prev, customer_id: v }))}
                  placeholder={'Select Customer'}
                  options={(customers||[]).map(c=>({ value:String(c.id), label:c.name }))}
                />
              )}
            </div>
            <div className="input-group" style={{overflow:'visible'}}>
              <label>Sale Type</label>
              {isMobile ? (
                <button type="button" className="input" style={{textAlign:'left'}} onClick={()=>openPicker('sale_type')}>
                  {form.sale_type || 'Sale Type'}
                </button>
              ) : (
                <Dropdown
                  value={form.sale_type}
                  onChange={(v)=>setForm(prev=>({ ...prev, sale_type: v }))}
                  options={[{value:'Cash',label:'Cash'},{value:'Credit',label:'Credit'}]}
                />
              )}
            </div>
            <div className="input-group" style={{overflow:'visible'}}>
              <label>Sale Category</label>
              <input className="input" value={form.category || ''} readOnly title={form.category || ''} />
            </div>
            
            <div className="input-group">
              <label>Total Amount</label>
              {/* Highlighted total badge */}
              <div style={{display:'flex', alignItems:'center'}}>
                <div className="badge" style={{fontSize:16, padding:'8px 12px', background:'#0d1520', color:'#60a5fa', borderColor:'#1e3a5f', fontWeight:900}}>₹ {(itemsTotalWithGst + addFormTotalWithGst).toFixed(2)}</div>
              </div>
            </div>
          </div>
          {/* Divider */}
          <div style={{height:1, background:'#3A3A4D', margin:'6px 0 12px 0'}} />
          <div className="card-header" style={{borderRadius:12, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div className="card-title" style={{fontSize:18}}>Add Item</div>
            <div className="sm:hidden" style={{display:'flex', alignItems:'center'}}>
              <div className="badge" style={{fontSize:14, padding:'6px 10px', background:'#0d1520', color:'#60a5fa', borderColor:'#1e3a5f', fontWeight:900}}>₹ {(itemsTotalWithGst + addFormTotalWithGst).toFixed(2)}</div>
            </div>
          </div>
          {/* Add Item row */}
          <div className="card">
            <div className="card-body">
              <div className="form-row">
                <div style={{overflow:'visible'}}>
                  {isMobile ? (
                    <button type="button" className="input" style={{textAlign:'left'}} onClick={()=>openPicker('material')}>
                      {addForm.material_code ? (()=>{ const m=sortedMaterials.find(x=>String(x.part_code)===String(addForm.material_code)); return m?`${m.part_code} - ${m.metal_type}`:String(addForm.material_code); })() : 'Material Code *'}
                    </button>
                  ) : (
                    <Dropdown
                      value={addForm.material_code}
                      onChange={(code)=>{
                        const mat = sortedMaterials.find(m=> String(m.part_code)===String(code));
                        // Heuristic map to product
                        let pid = '';
                        if (mat) {
                          const norm = String(mat.metal_type||'').toLowerCase();
                          let prod = products.find(p=> String(p.name||'').toLowerCase() === norm)
                            || products.find(p=> String(p.name||'').toLowerCase().includes(norm) || norm.includes(String(p.name||'').toLowerCase()));
                          if (!prod && /egg/.test(norm)) prod = products.find(p=> /egg/.test(String(p.name||'').toLowerCase()));
                          if (prod) pid = String(prod.id);
                        }
                        setAddForm(prev=>({ ...prev, material_code: code, material_type: mat ? mat.metal_type : '', product_id: pid }));
                        if (code) {
                          getPricingForSale({ customer_id: form.customer_id, material_code: code, category: form.category })
                            .then(r=>{
                              const base = Number(r?.data?.base_price || 0);
                              if (base > 0) {
                                setAddForm(prev=>({ ...prev, price_per_piece: String(base) }));
                              } else {
                                return getLastPurchasePrice({ material_code: code }).then(rr=>{
                                  const price = Number(rr?.data?.price || 0);
                                  const dom = rr?.data?.dom || '';
                                  if (price > 0) setAddForm(prev=>({ ...prev, price_per_piece: String(price) }));
                                  if (dom) setAddForm(prev=>({ ...prev, dom: toDDMMYYYY(dom) }));
                                }).catch(()=>{});
                              }
                              return getLastPurchasePrice({ material_code: code }).then(rr=>{
                                const dom = rr?.data?.dom || '';
                                if (dom) {
                                  setAddForm(prev=>({ ...prev, dom: toDDMMYYYY(dom) }));
                                } else {
                                  const shelf = mat?.shelf_life ? String(mat.shelf_life) : '';
                                  const numDays = Number((shelf.match(/\d+/)||[])[0]||0);
                                  if (numDays > 0) {
                                    const d = new Date();
                                    d.setDate(d.getDate() - numDays);
                                    const dd = String(d.getDate()).padStart(2,'0');
                                    const mm = String(d.getMonth()+1).padStart(2,'0');
                                    const yy = d.getFullYear();
                                    setAddForm(prev=>({ ...prev, dom: `${dd}-${mm}-${yy}` }));
                                  }
                                }
                              }).catch(()=>{});
                            })
                            .catch(()=>{
                              getLastPurchasePrice({ material_code: code }).then(rr=>{
                                const price = Number(rr?.data?.price || 0);
                                const dom = rr?.data?.dom || '';
                                if (price > 0) setAddForm(prev=>({ ...prev, price_per_piece: String(price) }));
                                if (dom) {
                                  setAddForm(prev=>({ ...prev, dom: toDDMMYYYY(dom) }));
                                } else {
                                  const shelf = mat?.shelf_life ? String(mat.shelf_life) : '';
                                  const numDays = Number((shelf.match(/\d+/)||[])[0]||0);
                                  if (numDays > 0) {
                                    const d = new Date();
                                    d.setDate(d.getDate() - numDays);
                                    const dd = String(d.getDate()).padStart(2,'0');
                                    const mm = String(d.getMonth()+1).padStart(2,'0');
                                    const yy = d.getFullYear();
                                    setAddForm(prev=>({ ...prev, dom: `${dd}-${mm}-${yy}` }));
                                  }
                                }
                              }).catch(()=>{});
                            });
                        }
                      }}
                      placeholder={'Material Code *'}
                      options={(sortedMaterials||[]).map(m=>({ value:String(m.part_code), label:`${m.part_code} - ${m.metal_type}` }))}
                    />
                  )}
                </div>
                
                
                <div className="input-group">
                  <label>Price / unit *</label>
                  <div style={{display:'flex', gap:8}}>
                    <input className="input" placeholder="Price / unit" value={addForm.price_per_piece||''} onChange={e=>setAddForm({...addForm, price_per_piece:e.target.value})} inputMode="decimal" />
                  </div>
                </div>
                <div style={{overflow:'visible'}}>
                  {isMobile ? (
                    <button type="button" className="input" style={{textAlign:'left'}} onClick={()=>openPicker('uom')}>
                      {addForm.uom || 'UOM'}
                    </button>
                  ) : (
                    <Dropdown value={addForm.uom||'Piece'} onChange={(v)=>setAddForm({...addForm, uom:v})} options={[{value:'Piece',label:'Piece'},{value:'Tray',label:'Tray (30 pcs)'}]} />
                  )}
                </div>
                <input className="input" placeholder="DOM (dd-mm-yyyy)" value={addForm.dom||''} readOnly />
                <div className="input-group">
                  <label>Quantity *</label>
                  <input className="input" placeholder="Quantity" value={addForm.qty||''} onChange={async e=>{
                    const val = e.target.value; setAddForm(prev=>({...prev, qty: val}));
                    try {
                      // try to fetch available for current material
                      const mat = sortedMaterials.find(m=> String(m.part_code)===String(addForm.material_code));
                      if (mat) {
                        const prod = products.find(p=> String(p.name||'').toLowerCase() === String(mat.metal_type||'').toLowerCase());
                        if (prod) {
                          const res = await getAvailable({ product_id: prod.id });
                          const avail = Number(res.data?.available||0);
                          setAvailableHint(avail);
                        }
                      }
                    } catch(_) { setAvailableHint(null); }
                  }} inputMode="numeric" />
                  {availableHint != null && <div className="form-help">Available: {availableHint}</div>}
                </div>
                <input className="input" placeholder="SGST (auto)" value={(()=>{ const t=computeItemGst({ ...addForm, qty_unit:addForm.uom, qty_pieces:addForm.uom==='Piece'?addForm.qty:'', trays:addForm.uom==='Tray'?addForm.qty:'' }); return t.sgstAmt? t.sgstAmt.toFixed(2):''; })()} readOnly />
                <input className="input" placeholder="CGST (auto)" value={(()=>{ const t=computeItemGst({ ...addForm, qty_unit:addForm.uom, qty_pieces:addForm.uom==='Piece'?addForm.qty:'', trays:addForm.uom==='Tray'?addForm.qty:'' }); return t.cgstAmt? t.cgstAmt.toFixed(2):''; })()} readOnly />
              </div>
              <div className="actions-row" style={{justifyContent:'flex-end', marginTop:8}}>
                <button type="button" className="btn primary" onClick={()=>{
                  const qtyNum = Number(addForm.qty||0); const price = Number(addForm.price_per_piece||0);
                  if (!addForm.material_code || !(qtyNum>0) || !(price>0)) return;
                  const effQty = (addForm.uom||'Piece')==='Tray' ? qtyNum*30 : qtyNum;
                  // Auto-map product from material; no manual override
                  let pid = '';
                  const mat = sortedMaterials.find(m=> String(m.part_code)===String(addForm.material_code));
                  if (mat) {
                    const norm = String(mat.metal_type||'').toLowerCase();
                    let prod = products.find(p=> String(p.name||'').toLowerCase() === norm)
                      || products.find(p=> String(p.name||'').toLowerCase().includes(norm) || norm.includes(String(p.name||'').toLowerCase()));
                    if (!prod && /egg/.test(norm)) prod = products.find(p=> /egg/.test(String(p.name||'').toLowerCase()));
                    
                    if (prod) pid = String(prod.id);
                  }
                  if (!pid) { setError('Cannot map item to a product. Please verify Material and Products master.'); return; }
                  const newItem = { material_code:addForm.material_code, material_type:addForm.material_type, product_id: pid, dom:addForm.dom||'', qty_unit:addForm.uom||'Piece', qty_pieces:(addForm.uom||'Piece')==='Piece'? String(qtyNum):'', trays:(addForm.uom||'Piece')==='Tray'? String(qtyNum):'', price_per_piece: price, effectiveQty: effQty };
                  const g = computeItemGst(newItem);
                  setLineItems(prev=>[...prev, { ...newItem, sgst_amount:g.sgstAmt, cgst_amount:g.cgstAmt, lineTotal:g.base, totalWithGst:g.total }]);
                  setAddForm({ material_code:'', material_type:'', price_per_piece:'', uom:'Piece', dom:'', shelf_life:'', qty:'' });
                }}>Add Item</button>
              </div>
            </div>
          </div>
          {/* Items: table on desktop, cards on mobile */}
          {lineItems.length>0 && (
            <div className="hidden sm:block overflow-x-auto" style={{marginTop:8}}>
              <table className="table table-hover table-zebra mt-2" style={{display:'table', tableLayout:'fixed', width:'100%'}}>
                <thead>
                  <tr>
                    <th>Material Code</th>
                    <th>Material Type</th>
                    <th style={{textAlign:'right'}}>Price / unit</th>
                    <th>UOM</th>
                    <th>DOM</th>
                    <th style={{textAlign:'right'}}>Quantity</th>
                    <th style={{textAlign:'right'}}>SGST</th>
                    <th style={{textAlign:'right'}}>CGST</th>
                    <th style={{textAlign:'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((it,idx)=>{
                    const label = it.material_type || '-';
                    const gst = computeItemGst(it);
                    return (
                      <tr key={idx}>
                        <td>{it.material_code}</td>
                        <td>{label}</td>
                        <td style={{textAlign:'right'}}>
                          {editIdx === idx ? (
                            <input className="input" value={editForm?.price_per_piece||''} onChange={e=>setEditForm(prev=>({...prev, price_per_piece:e.target.value}))} inputMode="decimal" />
                          ) : (
                            Number(it.price_per_piece||0).toFixed(2)
                          )}
                        </td>
                        <td>
                          {editIdx === idx ? (
                            <select className="input" value={editForm?.qty_unit||'Piece'} onChange={e=>setEditForm(prev=>({...prev, qty_unit:e.target.value}))}>
                              <option value="Piece">Piece</option>
                              <option value="Tray">Tray</option>
                            </select>
                          ) : (it.qty_unit||'Piece')}
                        </td>
                        <td>
                          {editIdx === idx ? (
                            <input className="input" value={editForm?.dom||''} onChange={e=>setEditForm(prev=>({...prev, dom:e.target.value}))} />
                          ) : (it.dom || '-')}
                        </td>
                        <td style={{textAlign:'right'}}>
                          {editIdx === idx ? (
                            <input className="input" value={editForm?.effectiveQty|| (editForm?.qty_unit==='Tray' ? String(Number(editForm?.trays||0)*30) : String(editForm?.qty_pieces||''))} onChange={e=>{
                              const v = e.target.value; setEditForm(prev=>{
                                if ((prev?.qty_unit||'Piece') === 'Tray') return { ...prev, effectiveQty: Number(v)||0, trays: String(Math.ceil((Number(v)||0)/30)) };
                                return { ...prev, effectiveQty: Number(v)||0, qty_pieces: String(Number(v)||0) };
                              });
                            }} inputMode="numeric" />
                          ) : (it.effectiveQty||0)}
                        </td>
                        <td style={{textAlign:'right'}}>{gst.sgstAmt.toFixed(2)}</td>
                        <td style={{textAlign:'right'}}>{gst.cgstAmt.toFixed(2)}</td>
                        <td style={{textAlign:'center'}}>
                          {editIdx === idx ? (
                            <div className="btn-group" style={{justifyContent:'center'}}>
                              <button type="button" className="btn btn-sm" onClick={()=>{
                                if (!editForm) { setEditIdx(null); return; }
                                setLineItems(prev=> prev.map((row,i)=> i===idx ? { ...row, ...editForm } : row));
                                setEditIdx(null); setEditForm(null);
                              }}>Save</button>
                              <button type="button" className="btn secondary btn-sm" onClick={()=>{ setEditIdx(null); setEditForm(null); }}>Cancel</button>
                            </div>
                          ) : (
                            <div className="btn-group" style={{justifyContent:'center'}}>
                              <button type="button" className="btn btn-sm" onClick={()=>{ setEditIdx(idx); setEditForm(it); }}>Edit</button>
                              <button type="button" className="btn danger btn-sm" onClick={()=> setLineItems(prev=> prev.filter((_,i)=> i!==idx))}>Delete</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  
                </tbody>
              </table>
            </div>
          )}
          {/* Mobile cards for line items */}
          {lineItems.length>0 && (
            <div className="sm:hidden cards-mobile" style={{marginTop:12}}>
              {lineItems.map((it, idx)=>{
                const gst = computeItemGst(it);
                return (
                  <div className="card" key={idx} style={{marginBottom:10}}>
                    <div className="card-body">
                      <div style={{fontWeight:800, marginBottom:6}}>Product: {it.material_type || it.material_code || '-'}</div>
                      <div className="data-pairs">
                        <div className="pair"><strong>Price</strong><div>₹ {Number(it.price_per_piece||0).toFixed(2)}</div></div>
                        <div className="pair"><strong>UOM</strong><div>{it.qty_unit||'Piece'}</div></div>
                        <div className="pair"><strong>Quantity</strong><div>{it.effectiveQty|| (it.qty_unit==='Tray' ? (Number(it.trays||0)*30) : Number(it.qty_pieces||0))}</div></div>
                        <div className="pair"><strong>SGST</strong><div>{gst.sgstPercent}% (₹ {gst.sgstAmt.toFixed(2)})</div></div>
                        <div className="pair"><strong>CGST</strong><div>{gst.cgstPercent}% (₹ {gst.cgstAmt.toFixed(2)})</div></div>
                        <div className="pair" style={{textAlign:'right'}}><strong>Total</strong><div>₹ {gst.total.toFixed(2)}</div></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{display:'flex', justifyContent:'flex-end', fontWeight:900}}>₹ {itemsTotalWithGst.toFixed(2)}</div>
            </div>
          )}
          {/* Divider and actions */}
          <div style={{height:1, background:'#3A3A4D', margin:'12px 0'}} />
          <div className="actions-row sticky-actions" style={{flexWrap:'wrap', justifyContent:'flex-end', alignItems:'center', gap:12}}>
            <details className="accordion" style={{flex: '1 1 280px', maxWidth: 520}}>
              <summary>Collect Payment Now</summary>
              <div className="accordion-body">
                <div className="form-grid" style={{gridTemplateColumns:'repeat(2, minmax(0,1fr))'}}>
                  <div className="input-group">
                    <label>Amount</label>
                    <input className="input" placeholder={`₹ ${(itemsTotalWithGst + addFormTotalWithGst).toFixed(2)}`} value={paymentAtCreate.amount} onChange={(e)=>setPaymentAtCreate(prev=>({ ...prev, amount:e.target.value }))} inputMode="decimal" />
                  </div>
                  <div className="input-group" style={{overflow:'visible'}}>
                    <label>Mode</label>
                    {isMobile ? (
                      <button type="button" className="input" style={{textAlign:'left'}} onClick={()=>openPicker('pay_mode')}>
                        {paymentAtCreate.mode || 'Payment Mode'}
                      </button>
                    ) : (
                      <Dropdown value={paymentAtCreate.mode} onChange={(v)=>setPaymentAtCreate(prev=>({ ...prev, mode:v }))} options={[{value:'Cash',label:'Cash'},{value:'Gpay',label:'Gpay'},{value:'Card',label:'Card'}]} />
                    )}
                  </div>
                </div>
                <div className="form-help">Tip: Leave amount blank to auto-use invoice total.</div>
                <div style={{marginTop:8}}>
                  <button type="button" className="btn secondary btn-sm" onClick={()=>{
                    const suggested = (itemsTotalWithGst + addFormTotalWithGst).toFixed(2);
                    setPaymentAtCreate(prev=>({ ...prev, amount: suggested }));
                  }}>Use Invoice Total</button>
                </div>
              </div>
            </details>
            {error && <div className="form-help" style={{flex:'1 1 100%'}}>{error}</div>}
            <button type="submit" className="btn primary">Generate Invoice</button>
          </div>
          </form>
        </Card>
        
        <Card title="Record Payments">
          {/* Desktop payments table */}
          <div className="hidden sm:block overflow-x-auto">
            <div className="actions-row" style={{justifyContent:'space-between', marginBottom:8}}>
              <label style={{display:'flex', alignItems:'center', gap:8}}>
                <input type="checkbox" checked={Boolean(paymentsFilter.showPaid)} onChange={(e)=>setPaymentsFilter(prev=>({...prev, showPaid: e.target.checked}))} />
                Include paid invoices
              </label>
              <button className="btn secondary btn-sm" onClick={async()=>{
                try { await clearTransactions(); await fetchSales(); await reloadPayments(); setSuccess('Transactions cleared'); setTimeout(()=>setSuccess(''), 2000); } catch(e){ setError('Failed to clear'); }
              }}>Clear Transactions</button>
            </div>
            <table className="table table-hover table-zebra mt-2">
              <thead>
                <tr><th>ID</th><th>Customer</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>Paid</th><th style={{textAlign:'right'}}>Balance</th><th style={{textAlign:'right'}}>Actions</th></tr>
              </thead>
              <tbody>
                {sales.filter(s=>{
                  const paid = Number(paymentsByInvoice[String(s.id)]||0);
                  const balance = Math.max(0, Number(s.total) - paid);
                  return paymentsFilter.showPaid ? true : balance > 0;
                }).map(s => {
                  const paid = Number(paymentsByInvoice[String(s.id)]||0);
                  const balance = Math.max(0, Number(s.total) - paid);
                  return (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td>{customers.find(c=>String(c.id)===String(s.customer_id))?.name || `#${s.customer_id}`}</td>
                      <td style={{textAlign:'right'}}>₹ {Number(s.total||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                      <td style={{textAlign:'right'}}>₹ {paid.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                      <td style={{textAlign:'right', color: balance>0 ? '#f59e0b' : '#22c55e'}}>
                        {balance>0 ? `₹ ${balance.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}` : 'Paid ✅'}
                      </td>
                      <td style={{textAlign:'right'}}>
                        {balance > 0 ? (
                          <button className="btn primary btn-sm" onClick={()=>setPayingSale(s)}>Record Payment</button>
                        ) : (
                          <span style={{color:'#22c55e', fontWeight:700}}>Paid</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile payments cards */}
          <div className="sm:hidden cards-mobile" style={{marginTop:12}}>
            {sales.filter(s=>{
              const paid = Number(paymentsByInvoice[String(s.id)]||0);
              const balance = Math.max(0, Number(s.total) - paid);
              return paymentsFilter.showPaid ? true : balance > 0;
            }).map(s=>{
              const paid = Number(paymentsByInvoice[String(s.id)]||0);
              const balance = Math.max(0, Number(s.total) - paid);
              const customerName = customers.find(c=>String(c.id)===String(s.customer_id))?.name || `#${s.customer_id}`;
              return (
                <div className="card" key={s.id} style={{marginBottom:10}}>
                  <div className="card-body">
                    <div style={{fontWeight:800, marginBottom:6}}>Customer: {customerName}</div>
                    <div className="data-pairs">
                      <div className="pair"><strong>Total</strong><div>₹ {Number(s.total||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div></div>
                      <div className="pair"><strong>Paid</strong><div>₹ {paid.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div></div>
                      <div className="pair" style={{color: balance>0 ? '#f59e0b' : '#22c55e'}}>
                        <strong>Balance</strong>
                        <div>{balance>0 ? `₹ ${balance.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}` : 'Paid ✅'}</div>
                      </div>
                    </div>
                    <div className="actions-row" style={{marginTop:10}}>
                      {balance > 0 ? (
                        <button className="btn primary btn-mobile-full" onClick={()=>setPayingSale(s)}>Record Payment</button>
                      ) : (
                        <span style={{color:'#22c55e', fontWeight:700}}>Paid</span>
                      )}
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
              <div className="input-group" style={{overflow:'visible'}}>
                <label>Mode</label>
                {isMobile ? (
                  <button type="button" className="input" style={{textAlign:'left'}} onClick={()=>openPicker('pay_mode_modal')}>
                    {payForm.mode || 'Payment Mode'}
                  </button>
                ) : (
                  <Dropdown
                    value={payForm.mode}
                    onChange={(v)=>setPayForm({...payForm, mode: v})}
                    placeholder={'Payment Mode'}
                    options={[{value:'Cash',label:'Cash'},{value:'Gpay',label:'Gpay'},{value:'Card',label:'Card'}]}
                  />
                )}
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
      {/* Mobile full-screen picker */}
      {isMobile && pickerOpen && (
        <div style={{position:'fixed', inset:0, background:'#0b0f14', zIndex:9999, display:'flex', flexDirection:'column'}}>
          <div style={{padding:'12px', borderBottom:'1px solid #1f2937', display:'flex', alignItems:'center', gap:8}}>
            <button type="button" className="btn secondary btn-sm" onClick={closePicker}>Back</button>
            <div style={{fontWeight:800}}>{
              pickerType==='customer' ? 'Select Customer' :
              pickerType==='sale_type' ? 'Select Sale Type' :
              pickerType==='sale_category' ? 'Select Sale Category' :
              pickerType==='material' ? 'Select Material' :
              pickerType==='uom' ? 'Select UOM' :
              pickerType==='pay_mode' ? 'Select Payment Mode' :
              pickerType==='pay_mode_modal' ? 'Select Payment Mode' :
              'Select Option'
            }</div>
          </div>
          <div style={{padding:'10px'}}>
            {['customer','material'].includes(pickerType) && (
              <input className="input" placeholder="Search..." value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)} />
            )}
          </div>
          <div style={{flex:1, overflowY:'auto', padding:'10px'}}>
            {pickerType==='customer' && (
              <div className="card" style={{padding:0}}>
                <div className="card-body" style={{padding:0}}>
                  {(customers||[])
                    .filter(c=>{
                      const q = pickerSearch.toLowerCase();
                      if (!q) return true;
                      return String(c.name||'').toLowerCase().includes(q);
                    })
                    .map(c=> (
                      <button key={c.id} type="button" className="btn secondary" style={{display:'block', width:'100%', textAlign:'left', borderRadius:0, border:'0', borderBottom:'1px solid #1f2937'}} onClick={()=>{ setForm(prev=>({...prev, customer_id: String(c.id)})); closePicker(); }}>{c.name}</button>
                    ))}
                </div>
              </div>
            )}
            {pickerType==='sale_type' && (
              <div className="card" style={{padding:0}}>
                <div className="card-body" style={{padding:0}}>
                  {['Cash','Credit'].map(t=> (
                    <button key={t} type="button" className="btn secondary" style={{display:'block', width:'100%', textAlign:'left', borderRadius:0, border:'0', borderBottom:'1px solid #1f2937'}} onClick={()=>{ setForm(prev=>({...prev, sale_type: t})); closePicker(); }}>{t}</button>
                  ))}
                </div>
              </div>
            )}
            {pickerType==='sale_category' && (
              <div className="card" style={{padding:0}}>
                <div className="card-body" style={{padding:0}}>
                  {saleCategories.map(c=> (
                    <button key={c} type="button" className="btn secondary" style={{display:'block', width:'100%', textAlign:'left', borderRadius:0, border:'0', borderBottom:'1px solid #1f2937'}} onClick={()=>{ setForm(prev=>({...prev, category: c})); closePicker(); }}>{c}</button>
                  ))}
                </div>
              </div>
            )}
            {pickerType==='material' && (
              <div className="card" style={{padding:0}}>
                <div className="card-body" style={{padding:0}}>
                  {(sortedMaterials||[])
                    .filter(m=>{
                      const q = pickerSearch.toLowerCase();
                      if (!q) return true;
                      return String(m.part_code||'').toLowerCase().includes(q) || String(m.metal_type||'').toLowerCase().includes(q);
                    })
                    .map(m=> (
                      <button key={m.part_code} type="button" className="btn secondary" style={{display:'block', width:'100%', textAlign:'left', borderRadius:0, border:'0', borderBottom:'1px solid #1f2937'}} onClick={async()=>{
                        const code = String(m.part_code);
                        const mat = m;
                        // Map product
                        let pid = '';
                        if (mat) {
                          const norm = String(mat.metal_type||'').toLowerCase();
                          let prod = products.find(p=> String(p.name||'').toLowerCase() === norm)
                            || products.find(p=> String(p.name||'').toLowerCase().includes(norm) || norm.includes(String(p.name||'').toLowerCase()));
                          if (!prod && /egg/.test(norm)) prod = products.find(p=> /egg/.test(String(p.name||'').toLowerCase()));
                          if (prod) pid = String(prod.id);
                        }
                        setAddForm(prev=>({ ...prev, material_code: code, material_type: mat ? mat.metal_type : '', product_id: pid }));
                        try {
                          const cust = customers.find(c=> String(c.id)===String(form.customer_id));
                          const categoryForPricing = form.category || (cust && cust.category) || '';
                          const r = await getPricingForSale({ customer_id: form.customer_id, material_code: code, category: categoryForPricing });
                          const base = Number(r?.data?.base_price || 0);
                          if (base > 0) setAddForm(prev=>({ ...prev, price_per_piece: String(base) }));
                        } catch(_) {}
                        try {
                          const rr = await getLastPurchasePrice({ material_code: code });
                          const dom = rr?.data?.dom || '';
                          if (dom) setAddForm(prev=>({ ...prev, dom: toDDMMYYYY(dom) }));
                          else {
                            const shelf = mat?.shelf_life ? String(mat.shelf_life) : '';
                            const numDays = Number((shelf.match(/\d+/)||[])[0]||0);
                            if (numDays > 0) {
                              const d = new Date(); d.setDate(d.getDate() - numDays);
                              const dd = String(d.getDate()).padStart(2,'0');
                              const mm = String(d.getMonth()+1).padStart(2,'0');
                              const yy = d.getFullYear();
                              setAddForm(prev=>({ ...prev, dom: `${dd}-${mm}-${yy}` }));
                            }
                          }
                        } catch(_) {}
                        closePicker();
                      }}>{m.part_code} - {m.metal_type}</button>
                    ))}
                </div>
              </div>
            )}
            {pickerType==='uom' && (
              <div className="card" style={{padding:0}}>
                <div className="card-body" style={{padding:0}}>
                  {['Piece','Tray'].map(u=> (
                    <button key={u} type="button" className="btn secondary" style={{display:'block', width:'100%', textAlign:'left', borderRadius:0, border:'0', borderBottom:'1px solid #1f2937'}} onClick={()=>{ setAddForm(prev=>({...prev, uom: u})); closePicker(); }}>{u}</button>
                  ))}
                </div>
              </div>
            )}
            {pickerType==='pay_mode' && (
              <div className="card" style={{padding:0}}>
                <div className="card-body" style={{padding:0}}>
                  {['Cash','Gpay','Card'].map(m=> (
                    <button key={m} type="button" className="btn secondary" style={{display:'block', width:'100%', textAlign:'left', borderRadius:0, border:'0', borderBottom:'1px solid #1f2937'}} onClick={()=>{ setPaymentAtCreate(prev=>({ ...prev, mode: m })); closePicker(); }}>{m}</button>
                  ))}
                </div>
              </div>
            )}
            {pickerType==='pay_mode_modal' && (
              <div className="card" style={{padding:0}}>
                <div className="card-body" style={{padding:0}}>
                  {['Cash','Gpay','Card'].map(m=> (
                    <button key={m} type="button" className="btn secondary" style={{display:'block', width:'100%', textAlign:'left', borderRadius:0, border:'0', borderBottom:'1px solid #1f2937'}} onClick={()=>{ setPayForm(prev=>({ ...prev, mode: m })); closePicker(); }}>{m}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;

