import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import { getPricing, createPricing, updatePricing, deletePricing, getCustomers, getMetals } from '../api/api';

const PricingMaster = () => {
  const [pricing, setPricing] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({ 
    customer_id: '', 
    category: 'Retail', 
    material_code: '', 
    base_price: '' 
  });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPricing = async () => {
    try {
      const result = await getPricing();
      setPricing(result.data || []);
    } catch (e) {
      console.error('Error fetching pricing:', e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const result = await getCustomers();
      setCustomers(result.data || []);
    } catch (e) {
      console.error('Error fetching customers:', e);
    }
  };

  const fetchMaterials = async () => {
    try {
      const result = await getMetals();
      setMaterials(result.data || []);
    } catch (e) {
      console.error('Error fetching materials:', e);
    }
  };

  useEffect(() => {
    fetchPricing();
    fetchCustomers();
    fetchMaterials();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Pricing form submitted:', form);
    setError(''); setSuccess('');
    
    if (!form.material_code || !form.base_price) { 
      setError('Material Code and Base Price are required.'); 
      return; 
    }
    
    try {
      if (editing) {
        console.log('Updating pricing:', editing, form);
        await updatePricing(editing, form);
        setSuccess('Pricing updated.');
      } else {
        console.log('Creating pricing:', form);
        const result = await createPricing(form);
        console.log('Create pricing result:', result);
        setSuccess('Pricing created.');
      }
      setForm({ customer_id: '', category: 'Retail', material_code: '', base_price: '' });
      setEditing(null);
      await fetchPricing();
    } catch (e) {
      console.error('Error in pricing handleSubmit:', e);
      setError(e?.response?.data?.message || 'Save failed.');
    }
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({
      customer_id: p.customer_id || '',
      category: p.category || 'Retail',
      material_code: p.material_code || '',
      base_price: p.base_price || ''
    });
  };

  const getSelectedMaterialGST = () => {
    const material = materials.find(m => m.part_code === form.material_code);
    return material ? material.gst_percent : 0;
  };

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const visiblePricing = pricing.slice(0, page * pageSize);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pricing Master</h1>
          <p className="page-subtitle">Set base prices per customer/category and material</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title={editing ? 'Edit Pricing' : 'Add Pricing'}>
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(5, minmax(0,1fr))'}}>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Customer</label>
            <Dropdown
              value={form.customer_id}
              onChange={(v)=>setForm({...form, customer_id: v})}
              placeholder={'All Customers'}
              options={[{value:'', label:'All Customers'}, ...customers.map(c=>({ value:String(c.id), label:c.name }))]}
            />
          </div>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Category</label>
            <Dropdown
              value={form.category}
              onChange={(v)=>setForm({...form, category: v})}
              options={[{value:'Retail',label:'Retail'},{value:'Wholesale',label:'Wholesale'},{value:'Walk-in',label:'Walk-in'}]}
            />
          </div>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Material Code</label>
            <Dropdown
              value={form.material_code}
              onChange={(v)=>setForm({...form, material_code: v})}
              placeholder={'Select Material'}
              options={materials.map(m=>({ value:String(m.part_code), label:`${m.part_code} - ${m.description || m.metal_type}` }))}
            />
          </div>
          <div className="input-group">
            <label>Base Price</label>
            <input className="input" type="number" step="0.01" value={form.base_price} onChange={e=>setForm({...form, base_price: e.target.value})} />
          </div>
          <div className="input-group">
            <label>GST %</label>
            <input className="input" value={getSelectedMaterialGST()} disabled readOnly />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit" onClick={() => console.log('Pricing button clicked!')}>
              {editing ? 'Update' : 'Add'}
            </button>
            {editing && (
              <button type="button" className="btn secondary" onClick={()=>{ 
                setEditing(null); 
                setForm({ customer_id: '', category: 'Retail', material_code: '', base_price: '' }); 
              }}>
                Cancel
              </button>
            )}
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <div style={{height:12}} />

      <Card title="Pricing List">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Category</th>
              <th>Material Code</th>
              <th>Material Description</th>
              <th>Base Price</th>
              <th>GST %</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visiblePricing.map(p => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td>{p.customer_name || 'All Customers'}</td>
                <td>{p.category}</td>
                <td>{p.material_code}</td>
                <td>{p.material_description || '-'}</td>
                <td style={{textAlign:'right'}}>₹{Number(p.base_price).toFixed(2)}</td>
                <td style={{textAlign:'right'}}>{Number(p.gst_percent).toFixed(2)}%</td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-sm" onClick={()=>startEdit(p)}>Edit</button>
                    <button className="btn danger btn-sm" onClick={async()=>{ 
                      await deletePricing(p.id); 
                      fetchPricing(); 
                    }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Mobile cards */}
        <div className="block sm:hidden">
          {visiblePricing.map(p => (
            <div key={p.id} className="card" style={{marginTop:12}}>
              <div className="card-body">
                <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Pricing #{p.id}</span>
                </div>
                <div className="data-pairs">
                  <div className="pair"><strong>Customer</strong><div>{p.customer_name || 'All Customers'}</div></div>
                  <div className="pair"><strong>Category</strong><div>{p.category}</div></div>
                  <div className="pair"><strong>Material</strong><div>{p.material_code}</div></div>
                  <div className="pair" style={{textAlign:'right'}}><strong>Base Price</strong><div>₹{Number(p.base_price).toFixed(2)}</div></div>
                  <div className="pair" style={{textAlign:'right'}}><strong>GST %</strong><div>{Number(p.gst_percent).toFixed(2)}%</div></div>
                </div>
                <div className="btn-group" style={{marginTop:10}}>
                  <button className="btn btn-sm" onClick={()=>startEdit(p)}>Edit</button>
                  <button className="btn danger btn-sm" onClick={async()=>{ await deletePricing(p.id); fetchPricing(); }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {visiblePricing.length < pricing.length && (
            <div style={{display:'flex', justifyContent:'center', marginTop:12}}>
              <button type="button" className="btn primary w-full" onClick={()=> setPage(p=>p+1)}>Load More</button>
            </div>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
};

export default PricingMaster;