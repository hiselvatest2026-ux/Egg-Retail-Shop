import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { getMetals, getProducts, getAvailable, getPricingForSale, getLastPurchasePrice, createSale, createSaleItem, createPayment, getCustomers } from '../api/api';

const WalkinSale = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [available, setAvailable] = useState(null);
  const [total, setTotal] = useState(0);

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
        // 1) Try Walk-in
        let base = 0;
        try {
          const r1 = await getPricingForSale({ customer_id: walkinCustomer.id, material_code: materialCode, category: 'Walk-in' });
          base = Number(r1?.data?.base_price || 0);
        } catch(_) { /* ignore */ }
        // 2) Fallback Retail
        if (!(base > 0)) {
          try {
            const r2 = await getPricingForSale({ customer_id: walkinCustomer.id, material_code: materialCode, category: 'Retail' });
            base = Number(r2?.data?.base_price || 0);
          } catch(_) { /* ignore */ }
        }
        if (base > 0) { setPricePerUnit(String(base)); return; }
        // 3) Fallback last purchase unit price
        try {
          const rr = await getLastPurchasePrice({ material_code: materialCode });
          const price = Number(rr?.data?.price || 0);
          if (price > 0) setPricePerUnit(String(price));
        } catch(_) { /* ignore */ }
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
        <div className="form-row" style={{marginBottom:12}}>
          <div className="input-group">
            <label>Quantity</label>
            <input className="input" inputMode="numeric" placeholder="e.g., 1" value={qty} onChange={e=>setQty(e.target.value)} />
            {available != null && <div className="form-help">Available: {available}</div>}
          </div>
          <div className="input-group">
            <label>Price / unit</label>
            <input className="input" readOnly value={pricePerUnit} />
          </div>
          <div className="input-group">
            <label>Total</label>
            <div className="badge" style={{fontSize:16, padding:'8px 12px'}}>₹ {total.toFixed(2)}</div>
          </div>
        </div>
        {error && <div className="form-help" style={{marginBottom:8}}>{error}</div>}
        <div className="btn-group" style={{justifyContent:'flex-end'}}>
          <button className="btn" onClick={()=>submitSale('Cash')}>Pay Cash & Generate Invoice</button>
          <button className="btn secondary" onClick={()=>submitSale('Gpay')}>Pay GPay & Generate Invoice</button>
        </div>
      </Card>
    </div>
  );
};

export default WalkinSale;

