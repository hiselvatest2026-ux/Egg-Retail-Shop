import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pricing Master</h1>
          <p className="page-subtitle">Set base prices per customer/category and material</p>
        </div>
      </div>

      <Card title={editing ? 'Edit Pricing' : 'Add Pricing'}>
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(5, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Customer</label>
            <select className="input" value={form.customer_id} onChange={e=>setForm({...form, customer_id: e.target.value})}>
              <option value="">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
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
            <label>Base Price</label>
            <input className="input" type="number" step="0.01" value={form.base_price} onChange={e=>setForm({...form, base_price: e.target.value})} />
          </div>
          <div className="input-group">
            <label>GST %</label>
            <input className="input" value={getSelectedMaterialGST()} disabled readOnly />
          </div>
          <div className="actions-row sticky-actions">
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
        <div className="hide-on-mobile">
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
              {pricing.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>{p.customer_name || 'All Customers'}</td>
                  <td>{p.category}</td>
                  <td>{p.material_code}</td>
                  <td>{p.material_description || '-'}</td>
                  <td>₹{Number(p.base_price).toFixed(2)}</td>
                  <td>{Number(p.gst_percent).toFixed(2)}%</td>
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
        </div>
        <div className="cards-mobile">
          {pricing.map(p => (
            <div key={p.id} className="card" style={{marginBottom:10}}>
              <div className="card-body">
                <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Pricing #{p.id}</span>
                  <span className="badge">{p.category}</span>
                </div>
                <div className="data-pairs">
                  <div className="pair"><strong>Customer:</strong> {p.customer_name || 'All Customers'}</div>
                  <div className="pair"><strong>Material Code:</strong> {p.material_code}</div>
                  <div className="pair" style={{flexBasis:'100%'}}><strong>Description:</strong> {p.material_description || '-'}</div>
                  <div className="pair"><strong>Base Price:</strong> ₹{Number(p.base_price).toFixed(2)}</div>
                  <div className="pair"><strong>GST %:</strong> {Number(p.gst_percent).toFixed(2)}%</div>
                </div>
                <div className="btn-group" style={{marginTop:10}}>
                  <button className="btn btn-sm" onClick={()=>startEdit(p)}>Edit</button>
                  <button className="btn danger btn-sm" onClick={async()=>{ 
                    await deletePricing(p.id); 
                    fetchPricing(); 
                  }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PricingMaster;