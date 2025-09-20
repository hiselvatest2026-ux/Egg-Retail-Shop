import React, { useState } from 'react';
import Card from '../components/Card';
import { adminAdjustCustomerTrays, adminAdjustVendorTrays, adminAttachSaleTrays, adminAttachPurchaseTrays } from '../api/api';

const TrayAdjustments = () => {
  const [cust, setCust] = useState({ customer_id: '', delta: '', reference_id: '' });
  const [vend, setVend] = useState({ vendor_id: '', delta: '', reference_id: '' });
  const [sale, setSale] = useState({ sale_id: '', tray_qty: '' });
  const [pur, setPur] = useState({ purchase_id: '', in_qty: '', out_qty: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const run = async (fn, payload) => {
    setMsg(''); setErr('');
    try {
      const res = await fn(payload);
      setMsg(res?.data?.message || 'Done');
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Failed');
    }
  };

  return (
    <div className="page space-y-4">
      <div className="page-header"><div><h1 className="page-title">Tray Adjustments (Admin)</h1><p className="page-subtitle">Update trays for existing records. Value/GST unaffected.</p></div></div>

      {msg && <div className="toast">{msg}</div>}
      {err && <div className="form-help">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Adjust Customer Trays">
          <div className="form-grid" style={{gridTemplateColumns:'repeat(3, minmax(0,1fr))'}}>
            <div className="input-group"><label>Customer ID</label><input className="input" value={cust.customer_id} onChange={e=>setCust({...cust, customer_id: e.target.value})} inputMode="numeric" /></div>
            <div className="input-group"><label>Delta (+in / -out)</label><input className="input" value={cust.delta} onChange={e=>setCust({...cust, delta: e.target.value})} inputMode="numeric" /></div>
            <div className="input-group"><label>Reference ID (opt)</label><input className="input" value={cust.reference_id} onChange={e=>setCust({...cust, reference_id: e.target.value})} inputMode="numeric" /></div>
          </div>
          <div className="actions-row" style={{justifyContent:'flex-end'}}>
            <button className="btn" onClick={()=> run(adminAdjustCustomerTrays, { customer_id: Number(cust.customer_id), delta: Number(cust.delta), reference_id: cust.reference_id ? Number(cust.reference_id) : undefined })}>Adjust</button>
          </div>
        </Card>

        <Card title="Adjust Vendor Trays (Shop)">
          <div className="form-grid" style={{gridTemplateColumns:'repeat(3, minmax(0,1fr))'}}>
            <div className="input-group"><label>Vendor ID</label><input className="input" value={vend.vendor_id} onChange={e=>setVend({...vend, vendor_id: e.target.value})} inputMode="numeric" /></div>
            <div className="input-group"><label>Delta (+in / -out)</label><input className="input" value={vend.delta} onChange={e=>setVend({...vend, delta: e.target.value})} inputMode="numeric" /></div>
            <div className="input-group"><label>Reference ID (opt)</label><input className="input" value={vend.reference_id} onChange={e=>setVend({...vend, reference_id: e.target.value})} inputMode="numeric" /></div>
          </div>
          <div className="actions-row" style={{justifyContent:'flex-end'}}>
            <button className="btn" onClick={()=> run(adminAdjustVendorTrays, { vendor_id: Number(vend.vendor_id), delta: Number(vend.delta), reference_id: vend.reference_id ? Number(vend.reference_id) : undefined })}>Adjust</button>
          </div>
        </Card>

        <Card title="Attach Trays to Existing Sale">
          <div className="form-grid" style={{gridTemplateColumns:'repeat(2, minmax(0,1fr))'}}>
            <div className="input-group"><label>Sale ID</label><input className="input" value={sale.sale_id} onChange={e=>setSale({...sale, sale_id: e.target.value})} inputMode="numeric" /></div>
            <div className="input-group"><label>Tray Qty</label><input className="input" value={sale.tray_qty} onChange={e=>setSale({...sale, tray_qty: e.target.value})} inputMode="numeric" /></div>
          </div>
          <div className="actions-row" style={{justifyContent:'flex-end'}}>
            <button className="btn" onClick={()=> run(adminAttachSaleTrays, { sale_id: Number(sale.sale_id), tray_qty: Number(sale.tray_qty) })}>Attach</button>
          </div>
        </Card>

        <Card title="Attach Trays to Existing Purchase">
          <div className="form-grid" style={{gridTemplateColumns:'repeat(3, minmax(0,1fr))'}}>
            <div className="input-group"><label>Purchase ID</label><input className="input" value={pur.purchase_id} onChange={e=>setPur({...pur, purchase_id: e.target.value})} inputMode="numeric" /></div>
            <div className="input-group"><label>In Qty</label><input className="input" value={pur.in_qty} onChange={e=>setPur({...pur, in_qty: e.target.value})} inputMode="numeric" /></div>
            <div className="input-group"><label>Out Qty</label><input className="input" value={pur.out_qty} onChange={e=>setPur({...pur, out_qty: e.target.value})} inputMode="numeric" /></div>
          </div>
          <div className="actions-row" style={{justifyContent:'flex-end'}}>
            <button className="btn" onClick={()=> run(adminAttachPurchaseTrays, { purchase_id: Number(pur.purchase_id), in_qty: Number(pur.in_qty||0), out_qty: Number(pur.out_qty||0) })}>Attach</button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TrayAdjustments;

