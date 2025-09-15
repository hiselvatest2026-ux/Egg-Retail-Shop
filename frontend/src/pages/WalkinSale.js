import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { getMetals, getProducts, getAvailable, getPricingForSale, getLastPurchasePrice, createSale, createSaleItem, createPayment, getCustomers } from '../api/api';

const WalkinSale = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [available, setAvailable] = useState(null);
  const [total, setTotal] = useState(0);
  const [showSheet, setShowSheet] = useState(false);

  const defaultMaterial = useMemo(() => {
    // Prefer Egg
    const eggs = (materials||[]).find(m => String(m.metal_type||'').toLowerCase().includes('egg'))
      || (materials||[])[0];
    return eggs || null;
  }, [materials]);

  const defaultProduct = useMemo(() => {
    if (!defaultMaterial) return null;
    const label = String(defaultMaterial.metal_type||'').toLowerCase();
    const prod = (products||[]).find(p => String(p.name||'').toLowerCase() === label)
      || (products||[]).find(p => String(p.name||'').toLowerCase().includes(label) || label.includes(String(p.name||'').toLowerCase()));
    return prod || null;
  }, [defaultMaterial, products]);

  const walkinCustomer = useMemo(() => {
    const c = (customers||[]).find(cu => String(cu.name||'').toLowerCase().includes('walk')) || (customers||[])[0];
    return c || null;
  }, [customers]);

  useEffect(() => {
    try {
      const mq = window.matchMedia('(max-width: 640px)');
      const apply = () => setIsMobile(!!mq.matches);
      apply();
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    } catch(_) {}
  }, []);

  useEffect(() => {
    (async()=>{
      try {
        const [m, p, c] = await Promise.all([getMetals(), getProducts(), getCustomers()]);
        setMaterials(m.data||[]);
        setProducts(p.data||[]);
        setCustomers(c.data||[]);
      } catch(e){ setError('Failed to load data'); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    // Auto-get price for Walk-in; fallback to Retail; then fallback to last purchase price
    (async()=>{
      try {
        if (!walkinCustomer || !defaultMaterial) return;
        const materialCode = defaultMaterial.part_code;
        let selected = 0;
        // 1) Try Walk-in
        try {
          const r1 = await getPricingForSale({ customer_id: walkinCustomer.id, material_code: materialCode, category: 'Walk-in' });
          selected = Number(r1?.data?.base_price || 0);
        } catch(_) { /* ignore */ }
        // 2) Fallback Retail
        if (!(selected > 0)) {
          try {
            const r2 = await getPricingForSale({ customer_id: walkinCustomer.id, material_code: materialCode, category: 'Retail' });
            selected = Number(r2?.data?.base_price || 0);
          } catch(_) { /* ignore */ }
        }
        // 3) Fallback last purchase unit price
        if (!(selected > 0)) {
          try {
            const rr = await getLastPurchasePrice({ material_code: materialCode });
            const price = Number(rr?.data?.price || 0);
            if (price > 0) selected = price;
          } catch(_) { /* ignore */ }
        }
        // 4) Enforce current business rate for Egg Walk-in
        const isEgg = String(defaultMaterial.metal_type||'').toLowerCase().includes('egg');
        if (isEgg) selected = 5.80;
        if (selected > 0) setPricePerUnit(String(selected.toFixed ? selected.toFixed(2) : selected));
      } catch(_){ /* ignore */ }
    })();
  }, [walkinCustomer, defaultMaterial]);

  useEffect(() => {
    const q = Number(qty||0);
    const p = Number(pricePerUnit||0);
    setTotal(q>0 && p>0 ? q * p : 0);
  }, [qty, pricePerUnit]);

  useEffect(() => {
    (async()=>{
      try {
        if (!defaultProduct) { setAvailable(null); return; }
        const res = await getAvailable({ product_id: defaultProduct.id });
        setAvailable(Number(res.data?.available||0));
      } catch(_){ setAvailable(null); }
    })();
  }, [defaultProduct]);

  const submitSale = async (mode) => {
    try {
      setError('');
      const q = Number(qty||0);
      const price = Number(pricePerUnit||0);
      if (!walkinCustomer || !defaultProduct || !defaultMaterial) { setError('Setup error: masters missing'); return; }
      if (!(q>0) || !(price>0)) { setError('Enter a valid quantity'); return; }
      if (available != null && q > available) { setError(`Insufficient stock. Available: ${available}`); return; }
      const payload = { customer_id: Number(walkinCustomer.id), total: Number((q*price).toFixed(2)), product_name: defaultMaterial.metal_type, payment_method: mode, sale_type: 'Cash' };
      const res = await createSale(payload);
      const sale = res.data;
      await createSaleItem(sale.id, { product_id: Number(defaultProduct.id), quantity: q, price: price });
      await createPayment({ customer_id: Number(walkinCustomer.id), invoice_id: Number(sale.id), amount: Number((q*price).toFixed(2)), payment_mode: mode });
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('inventory:refresh', { detail: { type: 'closing' } })); } catch(_) {}
      navigate(`/invoice/${sale.id}`);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create sale');
    }
  };

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Walk‑in Sale</h1>
          <p className="page-subtitle">Quantity‑only entry with auto‑pricing and one‑tap payment</p>
        </div>
      </div>

      <Card title={defaultMaterial ? `${defaultMaterial.part_code} - ${defaultMaterial.metal_type}` : 'Walk-in Item'}>
        <div className="card-body" style={{padding:isMobile?16:22}}>
          <div className="form-row" style={{marginBottom:12}}>
            <div className="input-group" style={{gridColumn:'1/-1'}}>
              <label style={{fontSize:12, fontWeight:800}}>Quantity</label>
              <input className="input" style={{height:isMobile?56:46, fontSize:isMobile?18:14}} inputMode="numeric" placeholder="e.g., 1" value={qty} onChange={e=>setQty(e.target.value)} />
              {available != null && <div className="form-help">Available: {available}</div>}
            </div>
            <div className="input-group">
              <label style={{fontSize:12, fontWeight:800}}>Price / unit</label>
              <input className="input" readOnly value={pricePerUnit} style={{height:isMobile?56:46, fontSize:isMobile?18:14}} />
            </div>
            <div className="input-group">
              <label style={{fontSize:12, fontWeight:800}}>Total</label>
              <div className="badge" style={{fontSize:isMobile?20:16, padding:isMobile?'10px 14px':'8px 12px', fontWeight:900}}>₹ {total.toFixed(2)}</div>
            </div>
          </div>
          {error && <div className="form-help" style={{marginBottom:8}}>{error}</div>}
          <div className="actions-row" style={{justifyContent:'center'}}>
            <button className="btn primary" style={{width:isMobile?'100%':'auto', minHeight:isMobile?56:40, fontSize:isMobile?18:14}} onClick={()=>submitSale('Cash')}>Pay Now (Cash)</button>
          </div>
          <div style={{marginTop:8, textAlign:'center'}}>
            <button type="button" className="btn secondary btn-sm" onClick={()=>setShowSheet(true)} style={{width:isMobile?'100%':'auto'}}>Other payment options</button>
          </div>
        </div>
      </Card>

      {isMobile && showSheet && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000}} onClick={()=>setShowSheet(false)}>
          <div style={{position:'absolute', left:0, right:0, bottom:0, background:'#1a1f2b', borderTopLeftRadius:16, borderTopRightRadius:16, padding:16, boxShadow:'0 -10px 30px rgba(0,0,0,.5)'}} onClick={e=>e.stopPropagation()}>
            <div style={{height:4, width:48, background:'#334155', borderRadius:9999, margin:'0 auto 12px auto'}} />
            <div className="btn-group" style={{flexDirection:'column'}}>
              <button className="btn" style={{width:'100%', minHeight:56, fontSize:18}} onClick={()=>{ setShowSheet(false); submitSale('Cash'); }}>Pay Cash & Generate</button>
              <button className="btn secondary" style={{width:'100%', minHeight:56, fontSize:18}} onClick={()=>{ setShowSheet(false); submitSale('Gpay'); }}>Pay GPay & Generate</button>
              <button className="btn secondary" style={{width:'100%', minHeight:56, fontSize:18}} onClick={()=>{ setShowSheet(false); submitSale('Card'); }}>Pay Card & Generate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalkinSale;

