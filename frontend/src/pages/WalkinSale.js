import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMetals, getProducts, getAvailable, getPricingForSale, getLastPurchasePrice, createSale, createSaleItem, createPayment, getCustomers, getPricing } from '../api/api';

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
  const [pricingRows, setPricingRows] = useState([]);
  const [payMethod, setPayMethod] = useState('Card');

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
    const list = customers || [];
    // Prefer explicit category match
    const byCategory = list.find(cu => String(cu.category||'').toLowerCase().includes('walk'));
    if (byCategory) return byCategory;
    // Normalize and match common Walk-in name variants without falling back to arbitrary first customer
    const normalize = (v) => String(v||'').toLowerCase().replace(/[^a-z]/g, '');
    const byName = list.find(cu => {
      const n = normalize(cu.name);
      return n.includes('walkin') || n.includes('walk');
    });
    return byName || null;
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
        const [m, p, c, pr] = await Promise.all([getMetals(), getProducts(), getCustomers(), getPricing()]);
        setMaterials(m.data||[]);
        setProducts(p.data||[]);
        setCustomers(c.data||[]);
        setPricingRows(pr.data||[]);
      } catch(e){ setError('Failed to load data'); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    // Auto-get price for Walk-in; fallback to Retail; then fallback to last purchase price
    (async()=>{
      try {
        if (!defaultMaterial) return;
        const materialCode = defaultMaterial.part_code;
        let selected = 0;
        // 0) Prefer Pricing Master row by category Walk-in for this material
        try {
          const pm = (pricingRows||[]).find(r => String(r.material_code)===String(materialCode) && String(r.category||'').toLowerCase()==='walk-in');
          if (pm) selected = Number(pm.base_price||0);
        } catch(_) {}
        // 1) Try Walk-in
        if (!(selected > 0) && walkinCustomer) try {
          const r1 = await getPricingForSale({ customer_id: walkinCustomer.id, material_code: materialCode, category: 'Walk-in' });
          selected = Number(r1?.data?.base_price || 0);
        } catch(_) { /* ignore */ }
        // 2) Fallback Retail
        if (!(selected > 0) && walkinCustomer) {
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
        // No client-side enforced rate; rely on Pricing Master then last purchase price
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
      const effectiveMode = String(mode) === 'GPay' ? 'Gpay' : mode;
      const q = Number(qty||0);
      const price = Number(pricePerUnit||0);
      if (!defaultProduct || !defaultMaterial) { setError('Setup error: masters missing'); return; }
      if (!walkinCustomer) { setError('Please create a customer named or categorized "Walk-in" to proceed.'); return; }
      if (!(q>0) || !(price>0)) { setError('Enter a valid quantity'); return; }
      if (available != null && q > available) { setError(`Insufficient stock. Available: ${available}`); return; }
      const payload = { customer_id: Number(walkinCustomer.id), total: Number((q*price).toFixed(2)), product_name: defaultMaterial.metal_type, payment_method: effectiveMode, sale_type: 'Cash' };
      const res = await createSale(payload);
      const sale = res.data;
      await createSaleItem(sale.id, { product_id: Number(defaultProduct.id), quantity: q, price: price });
      await createPayment({ customer_id: Number(walkinCustomer.id), invoice_id: Number(sale.id), amount: Number((q*price).toFixed(2)), payment_mode: effectiveMode });
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('inventory:refresh', { detail: { type: 'closing' } })); } catch(_) {}
      navigate(`/invoice/${sale.id}`);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create sale');
    }
  };

  if (loading) return <div className="p-4" style={{background:'#F8F5F1', minHeight:'100vh'}}>Loading…</div>;

  return (
    <div className="page" style={{background:'#F8F5F1', minHeight:'100vh', padding:isMobile?16:24}}>
      <div style={{maxWidth:520, margin:'0 auto'}}>
        {/* Top App Bar spacer visually aligns with theme */}
        <div style={{height:isMobile?0:8}} />
        <div style={{background:'#FFFFFF', borderRadius:12, boxShadow:'0px 4px 10px rgba(0, 0, 0, 0.05)', padding:isMobile?16:20, fontFamily:'Inter, Roboto, "SF Pro Display", system-ui, -apple-system, Segoe UI, Arial, sans-serif'}}>
          {/* Title */}
          <div style={{color:'#333333', fontSize:isMobile?22:20, fontWeight:800}}>Quick & Easy Checkout</div>
          <div style={{height:1, background:'#E0E0E0', margin:'10px 0 14px 0'}} />

          {/* Product info */}
          <div style={{color:'#333333', fontSize:isMobile?18:16, fontWeight:600, marginBottom:10}}>
            {defaultMaterial ? `${defaultMaterial.part_code} - ${defaultMaterial.metal_type}` : 'Walk-in Item'}
          </div>

          {/* Quantity + Price row */}
          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:12, marginBottom:8}}>
            {/* Quantity stepper */}
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                <label style={{color:'#333333', fontWeight:600}}>Quantity</label>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <button type="button" aria-label="Decrease quantity" onClick={()=>{
                  const n = Math.max(0, Number(qty||0) - 1);
                  setQty(String(n));
                }} style={{minWidth:48, minHeight:48, borderRadius:10, background:'#505050', color:'#FFFFFF', border:'0', fontSize:22, fontWeight:800}}>-</button>
                <input aria-label="Quantity" className="input" style={{flex:1, textAlign:'center', height:48, fontSize:18, background:'#FFFFFF', border:'1px solid #E0E0E0', borderRadius:10, color:'#333333'}} inputMode="numeric" pattern="[0-9]*" placeholder="1" value={qty} onChange={(e)=>{
                  const v = e.target.value.replace(/[^0-9]/g,'');
                  setQty(v);
                }} />
                <button type="button" aria-label="Increase quantity" onClick={()=>{
                  const n = Number(qty||0) + 1;
                  setQty(String(n));
                }} style={{minWidth:48, minHeight:48, borderRadius:10, background:'#505050', color:'#FFFFFF', border:'0', fontSize:22, fontWeight:800}}>+</button>
              </div>
              {available != null && <div style={{marginTop:6, color:'#7A7A7A', fontSize:12}}>Available: {available}</div>}
            </div>

            {/* Price per unit */}
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                <label style={{color:'#333333', fontWeight:600}}>Price / unit</label>
              </div>
              <input className="input" readOnly value={pricePerUnit} style={{width:'100%', height:48, fontSize:18, background:'#FFFFFF', border:'1px solid #E0E0E0', borderRadius:10, color:'#333333'}} />
            </div>
          </div>

          {/* Total */}
          <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, margin:'10px 0 4px 0'}}>
            <div style={{color:'#333333', fontWeight:600}}>Total</div>
            <div aria-live="polite" style={{background:'#28A89A', color:'#FFFFFF', fontWeight:900, fontSize:isMobile?22:20, padding:'10px 14px', borderRadius:10, minWidth:160, textAlign:'center'}}>
              ₹ {total.toFixed(2)}
            </div>
          </div>

          {/* Payment segmented */}
          <div role="tablist" aria-label="Select payment method" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginTop:12}}>
            {['Cash','GPay','Card'].map(m=>{
              const selected = String(payMethod).toLowerCase() === String(m).toLowerCase();
              return (
                <button key={m} role="tab" aria-selected={selected} onClick={()=>setPayMethod(m)} style={{
                  height:44,
                  borderRadius:10,
                  border:'0',
                  background: selected ? '#2196F3' : '#E0E0E0',
                  color: selected ? '#FFFFFF' : '#7A7A7A',
                  fontWeight: selected ? 800 : 600
                }}>
                  {selected ? '✓ ' : ''}{m}
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && <div role="alert" style={{marginTop:10, color:'#E53935', fontSize:13}}>{error}</div>}

          {/* CTA */}
          <div className="actions-row" style={{marginTop:16, justifyContent:'center'}}>
            <button className="btn" onClick={()=>submitSale(payMethod)} style={{
              width:'100%',
              minHeight:52,
              background:'#2196F3',
              color:'#FFFFFF',
              fontWeight:800,
              border:'0',
              borderRadius:12,
              boxShadow:'0px 4px 10px rgba(0, 0, 0, 0.05)',
              fontSize:18
            }}>
              {`Pay with ${payMethod}`}
            </button>
          </div>

          {/* Footer note */}
          <div style={{marginTop:10, textAlign:'center', color:'#7A7A7A', fontSize:12}}>Invoice opens after successful payment</div>
        </div>
      </div>
    </div>
  );
};

export default WalkinSale;

