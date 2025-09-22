import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import { getProducts, getMetals, getAdjustments, createAdjustment, deleteAdjustmentApi } from '../api/api';

const StockAdjustments = () => {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [form, setForm] = useState({ product_id: '', material_code: '', adjustment_type: '', quantity: '', note: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const [p, m, a] = await Promise.all([getProducts(), getMetals(), getAdjustments()]);
      setProducts(p.data || []);
      setMaterials(m.data || []);
      setAdjustments(a.data || []);
    } catch (e) { console.error('load adjustments failed', e); }
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.product_id) { setError('Please select a material.'); return; }
    if (!form.adjustment_type) { setError('Please select a type.'); return; }
    if (!form.quantity || Number.isNaN(Number(form.quantity))) { setError('Enter a valid quantity.'); return; }
    try {
      await createAdjustment({ product_id: Number(form.product_id), adjustment_type: form.adjustment_type, quantity: Number(form.quantity), note: form.note || null });
      setForm({ product_id: '', adjustment_type: '', quantity: '', note: '' });
      setSuccess('Adjustment recorded.');
      await load();
    } catch (e) { console.error('save failed', e); setError('Failed to save adjustment.'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Adjustments</h1>
          <p className="page-subtitle">Record Missing, Wastage, and Breakage</p>
        </div>
      </div>

      <Card title="Add Adjustment">
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(5, minmax(0,1fr))'}}>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Material (Code - Type)</label>
            <Dropdown
              value={form.material_code}
              onChange={(code)=>{
                // Map selected material to product id using name heuristics
                const mat = (materials||[]).find(m=> String(m.part_code)===String(code));
                let pid = '';
                if (mat) {
                  const norm = String(mat.metal_type||'').toLowerCase();
                  let prod = (products||[]).find(p=> String(p.name||'').toLowerCase() === norm)
                    || (products||[]).find(p=> String(p.name||'').toLowerCase().includes(norm) || norm.includes(String(p.name||'').toLowerCase()));
                  if (!prod && /egg/.test(norm)) prod = (products||[]).find(p=> /egg/.test(String(p.name||'').toLowerCase()));
                  if (prod) pid = String(prod.id);
                }
                setForm(prev=>({ ...prev, material_code: code, product_id: pid }));
              }}
              placeholder={materials.length ? 'Select material' : 'No materials found'}
              options={(materials||[]).map(m=>({ value:String(m.part_code), label:`${m.part_code} - ${m.metal_type}` }))}
            />
          </div>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Type</label>
            <Dropdown
              value={form.adjustment_type}
              onChange={(v)=>setForm({...form, adjustment_type: v})}
              placeholder={'Select type'}
              options={[{value:'Missing', label:'Missing'},{value:'Wastage', label:'Wastage'},{value:'Breakage', label:'Breakage'}]}
            />
          </div>
          <div className="input-group">
            <label>Quantity</label>
            <input className="input" value={form.quantity} onChange={e=>setForm({...form, quantity: e.target.value})} inputMode="numeric" />
          </div>
          <div className="input-group">
            <label>Note (optional)</label>
            <input className="input" value={form.note} onChange={e=>setForm({...form, note: e.target.value})} />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit">Add</button>
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <Card title="Adjustments List">
        <table className="table table-hover">
          <thead><tr><th>ID</th><th>Material Type</th><th>Type</th><th>Qty</th><th>Note</th><th>When</th><th>Actions</th></tr></thead>
          <tbody>
            {adjustments.map(a => (
              <tr key={a.id}>
                <td>#{a.id}</td>
                <td>{a.material_type || '-'}</td>
                <td>{a.adjustment_type}</td>
                <td>{a.quantity}</td>
                <td>{a.note || '-'}</td>
                <td>{new Date(a.created_at).toLocaleString()}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn danger btn-sm" onClick={async()=>{ try{ await deleteAdjustmentApi(a.id); await load(); }catch(e){ console.error('delete failed', e);} }}>Delete</button>
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

export default StockAdjustments;

