import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
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
  const [submitting, setSubmitting] = useState(false);
  const [pricingRows, setPricingRows] = useState([]);
  const [payMethod, setPayMethod] = useState('Card'); // default Card per Option 10
  const [platform, setPlatform] = useState('web'); // 'android' | 'ios' | 'web'

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
    try {
      const ua = (navigator && navigator.userAgent) ? navigator.userAgent : '';
      if (/Android/i.test(ua)) setPlatform('android');
      else if (/iPhone|iPad|iPod/i.test(ua)) setPlatform('ios');
      else setPlatform('web');
    } catch(_) { setPlatform('web'); }
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
      setSubmitting(true);
      const q = Number(qty||0);
      const price = Number(pricePerUnit||0);
      if (!defaultProduct || !defaultMaterial) { setError('Setup error: masters missing'); return; }
      if (!walkinCustomer) { setError('Please create a customer named or categorized "Walk-in" to proceed.'); return; }
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
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Loading…</div>;

  const fontFamily = platform==='android'
    ? 'Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif'
    : (platform==='ios'
      ? 'SF Pro Display, -apple-system, system-ui, Segoe UI, Arial, sans-serif'
      : 'Inter, system-ui, -apple-system, Segoe UI, Arial, sans-serif');

  const segRadius = platform==='ios' ? 12 : 10;
  const segHeight = isMobile ? 44 : 40;
  const ctaRadius = platform==='ios' ? 14 : 12;
  const ctaShadow = platform==='android' ? '0 6px 14px rgba(33,150,243,0.3)' : '0 12px 24px rgba(33,150,243,0.25)';
  const accentBlue = '#2196F3';
  const bgSoft = '#F7F4EF';
  const textPrimary = '#333333';
  const textSecondary = '#7A7A7A';
  const errorRed = '#F44336';

  return (
    <div className="page" style={{background:bgSoft, fontFamily}}>
      <div className="page-header" style={{background:'transparent'}}>
        <div>
          <button type="button" className="btn secondary btn-sm" onClick={()=>navigate(-1)} aria-label="Go back" style={{marginBottom:8}}>{'<'} Back</button>
          <h1 className="page-title" style={{color:textPrimary, fontSize:isMobile?28:24, fontWeight:800}}>Walk‑in Sale</h1>
          <p className="page-subtitle" style={{color:textSecondary}}>Quick & Easy Checkout</p>
        </div>
      </div>

      <Card title={null}>
        <div className="card-body" style={{padding:isMobile?16:22, background:'#FFFFFF', borderRadius:12, boxShadow:'0px 2px 4px rgba(0,0,0,0.08)'}}>
          <div style={{marginBottom:10}}>
            <div style={{color:textPrimary, fontSize:isMobile?22:20, fontWeight:900}}>Quick & Easy Checkout</div>
            <div style={{height:1, background:'#E5E5E5', marginTop:8}} />
          </div>
          <div style={{color:textPrimary, fontWeight:700, marginBottom:6}}>{defaultMaterial ? `${defaultMaterial.part_code} - ${defaultMaterial.metal_type}` : 'Walk-in Item'}</div>
          <div className="form-row" style={{marginBottom:12, alignItems:'end'}}>
            <div className="input-group" style={{gridColumn:'1/-1'}}>
              <label style={{fontSize:12, fontWeight:800, color:textSecondary}}>Quantity</label>
              <input className="input" style={{height:isMobile?56:46, fontSize:isMobile?18:16, borderRadius:12, background:'#FFFFFF', borderColor:'#E5E7EB'}} inputMode="numeric" placeholder="e.g., 1" value={qty} onChange={e=>setQty(e.target.value.replace(/[^0-9]/g,''))} />
              {available != null && <div className="form-help" style={{color:textSecondary}}>Available: {available}</div>}
            </div>
            <div className="input-group">
              <label style={{fontSize:12, fontWeight:800, color:textSecondary}}>Price / unit</label>
              <input className="input" readOnly value={pricePerUnit} style={{height:isMobile?56:46, fontSize:isMobile?18:16, borderRadius:12, background:'#FFFFFF', borderColor:'#E5E7EB'}} />
            </div>
            <div className="input-group" style={{textAlign:'right'}}>
              <label style={{fontSize:12, fontWeight:800, color:textSecondary}}>Total</label>
              <div className="badge" style={{background:accentBlue, color:'#fff', border:'none', fontSize:isMobile?22:18, padding:isMobile?'12px 16px':'10px 14px', fontWeight:900, borderRadius:12, boxShadow:'0 6px 16px rgba(0,0,0,0.08)'}}>₹ {total.toFixed(2)}</div>
            </div>
          </div>

          {/* Payment method segmented buttons */}
          <div className="btn-group" style={{gap:8, margin:'8px 0 12px 0'}}>
            {['Cash','Gpay','Card'].map(m => {
              const selected = String(payMethod).toLowerCase() === String(m).toLowerCase();
              return (
                <button key={m} type="button" className="btn" onClick={()=>setPayMethod(m)}
                  style={{
                    background: selected ? accentBlue : '#E5E7EB',
                    color: selected ? '#fff' : textSecondary,
                    border:'none',
                    borderRadius:segRadius,
                    minHeight:segHeight,
                    padding:isMobile?'10px 14px':'8px 12px',
                    fontWeight:800
                  }}>
                  {selected ? '✓ ' : ''}{m === 'Gpay' ? 'GPay' : m}
                </button>
              );
            })}
          </div>

          {/* Validation error below payment selectors */}
          {(!(Number(qty||0)>0)) && (
            <div className="form-help" style={{color:errorRed, marginTop:-6, marginBottom:8}}>Enter a valid quantity</div>
          )}

          {error && <div className="form-help" style={{marginBottom:8}}>{error}</div>}
          <div className="actions-row" style={{justifyContent:'center'}}>
            <button disabled={submitting} className="btn" style={{
              width:isMobile?'100%':'100%',
              minHeight:isMobile?56:50,
              fontSize:isMobile?18:16,
              background:accentBlue,
              color:'#fff',
              fontWeight:900,
              border:'none',
              borderRadius:ctaRadius,
              boxShadow:ctaShadow
            }} onClick={()=>submitSale(payMethod)}>
              {submitting ? 'Processing…' : `Pay with ${payMethod === 'Gpay' ? 'GPay' : payMethod}`}
            </button>
          </div>
          <div style={{marginTop:8, textAlign:'center', color:'#7A7A7A'}}>Invoice opens after successful payment</div>
        </div>
      </Card>

      {/* Bottom sheet removed in consolidated flow */}
    </div>
  );
};

export default WalkinSale;

