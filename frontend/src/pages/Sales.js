import React, { useEffect, useState } from 'react';
import { getSales, createSale, updateSale, deleteSale, getCustomers, getPricingForSale, getMetals } from '../api/api';
import { Link } from 'react-router-dom';
import Card from '../components/Card';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({ customer_id: '', total: '', product_name: '', material_code: '', category: 'Retail' });
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [pricingInfo, setPricingInfo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null);

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
      } catch(e){ 
        console.error('data load failed', e);
      } 
    })(); 
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.customer_id) { setError('Please select a customer.'); return; }
    if (!form.total || Number.isNaN(Number(form.total))) { setError('Please enter a valid total amount.'); return; }
    try {
      const payload = { customer_id: Number(form.customer_id), total: Number(form.total), product_name: form.product_name || null };
      if (editing) { await updateSale(editing, payload); } else { await createSale(payload); }
      setForm({ customer_id: '', total: '', product_name: '', material_code: '', category: 'Retail' });
      setPricingInfo(null);
      setEditing(null);
      await fetchSales();
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="page-subtitle">Record sales and access invoices</p>
        </div>
      </div>

      <Card title={editing ? 'Edit Sale' : 'Add Sale'}>
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(5, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Customer</label>
            <select className="input" value={form.customer_id} onChange={e=>setForm({...form, customer_id: e.target.value})}>
              <option value="">{customers.length ? 'Select customer' : 'No customers found - add one first'}</option>
              {customers.map(c => (<option key={c.id} value={c.id}>{c.name} (#{c.id})</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Category</label>
            <select className="input" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}>
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Walk-in">Walk-in</option>
            </select>
          </div>
          <div className="input-group">
            <label>Material Code</label>
            <select className="input" value={form.material_code} onChange={e=>setForm({...form, material_code: e.target.value})}>
              <option value="">Select Material</option>
              {materials.map(m => (
                <option key={m.id} value={m.part_code}>{m.part_code} - {m.description || m.metal_type}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Total Amount</label>
            <input className="input" placeholder="e.g. 1450.00" value={form.total} onChange={e=>setForm({...form, total: e.target.value})} inputMode="decimal" />
          </div>
          <div className="input-group">
            <label>Product Name</label>
            <select className="input" value={form.product_name} onChange={e=>setForm({...form, product_name: e.target.value})}>
              <option value="">Select product</option>
              {materials.map(m => (
                <option key={m.id} value={m.metal_type}>{m.metal_type}</option>
              ))}
            </select>
          </div>
          
          {pricingInfo && (
            <div className="input-group" style={{gridColumn:'1/-1'}}>
              <div style={{background:'#f8f9fa', padding:'12px', borderRadius:'6px', border:'1px solid #e9ecef'}}>
                <h4 style={{margin:'0 0 8px 0', fontSize:'14px', color:'#495057'}}>Pricing Information</h4>
                <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'8px', fontSize:'12px'}}>
                  <div><strong>Base Price:</strong> ₹{pricingInfo.base_price}</div>
                  <div><strong>GST %:</strong> {pricingInfo.gst_percent}%</div>
                  <div><strong>GST Amount:</strong> ₹{pricingInfo.gst_amount}</div>
                  <div><strong>Final Price:</strong> ₹{pricingInfo.final_price}</div>
                  <div style={{gridColumn:'1/-1'}}>
                    <strong>Tax Status:</strong> {pricingInfo.is_taxable ? 'Taxable' : 'Non-Taxable'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="actions-row">
            <button className="btn" type="submit">{editing ? 'Update Sale' : 'Add Sale'}</button>
            {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ customer_id: '', total: '', egg_type: '', material_code: '', category: 'Retail' }); setPricingInfo(null); }}>Cancel</button>}
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <Card title="Sales List">
        <table className="table table-hover mt-2">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Total</th><th>Product</th><th>Category</th><th style={{width:260}}>Actions</th></tr>
          </thead>
          <tbody>
            {sales.map(s => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td><span className="badge">{s.customer_id}</span></td>
                <td>₹ {Number(s.total).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td>{s.product_name || s.egg_type || '-'}</td>
                <td>{s.category || 'Retail'}</td>
                <td>
                  <div className="btn-group">
                    <Link className="btn secondary btn-sm" to={`/invoice/${s.id}`}>Invoice</Link>
                    <Link className="btn secondary btn-sm" to={`/sales/${s.id}/items`}>Items</Link>
                    <button className="btn btn-sm" onClick={()=>{ setEditing(s.id); setForm({ customer_id: s.customer_id, total: s.total, product_name: s.product_name || s.egg_type || '', material_code: s.material_code || '', category: s.category || 'Retail' }); }}>Edit</button>
                    <button className="btn danger btn-sm" onClick={async()=>{ try { await deleteSale(s.id); await fetchSales(); } catch(e) { console.error('Delete failed', e); } }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Sales;

