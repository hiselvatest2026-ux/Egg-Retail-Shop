import React, { useEffect, useState } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/api';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', category: 'Retail', gstin: '', tax_applicability: 'Taxable' , contact_info: '', credit_limit: ''});
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCustomers = async () => { const res = await getCustomers(); setCustomers(res.data); };
  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted:', form);
    setError(''); setSuccess('');
    if (!form.name) { setError('Customer Name is required.'); return; }
    try {
      if (editing) {
        console.log('Updating customer:', editing, form);
        await updateCustomer(editing, form);
        setSuccess('Customer updated.');
      } else {
        console.log('Creating customer:', form);
        const result = await createCustomer(form);
        console.log('Create result:', result);
        setSuccess('Customer added.');
      }
      setForm({ name: '', phone: '', category: 'Retail', gstin: '', tax_applicability: 'Taxable', contact_info: '', credit_limit: '' });
      setEditing(null);
      await fetchCustomers();
    } catch (e) {
      console.error('Error in handleSubmit:', e);
      setError(e?.response?.data?.message || 'Save failed.');
    }
  };

  const startEdit = (c) => { setEditing(c.id); setForm({ name: c.name || '', phone: c.phone || '', category: c.category || 'Retail', gstin: c.gstin || '', tax_applicability: c.tax_applicability || 'Taxable', contact_info: c.contact_info || '', credit_limit: c.credit_limit || '' }); };

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const visibleCustomers = customers.slice(0, page * pageSize);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Master</h1>
          <p className="page-subtitle">Manage customer taxation and profiles</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title={editing ? 'Edit Customer' : 'Add Customer'}>
      <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(6, minmax(0,1fr))'}}>
        <div className="input-group">
          <label>Customer Name</label>
          <input className="input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
        </div>
        <div className="input-group">
          <label>Phone Number</label>
          <input className="input" type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
        </div>
        <div className="input-group" style={{overflow:'visible'}}>
          <label>Category</label>
          <Dropdown
            value={form.category}
            onChange={(v)=>setForm({...form, category: v})}
            options={[{value:'Retail',label:'Retail'},{value:'Wholesale',label:'Wholesale'},{value:'Walk-in',label:'Walk-in'}]}
          />
        </div>
        <div className="input-group">
          <label>GSTIN</label>
          <input className="input" type="text" value={form.gstin} onChange={e=>setForm({...form, gstin: e.target.value})} placeholder="If applicable" />
        </div>
        <div className="input-group" style={{overflow:'visible'}}>
          <label>Tax Applicability</label>
          <Dropdown
            value={form.tax_applicability}
            onChange={(v)=>setForm({...form, tax_applicability: v})}
            options={[{value:'Taxable',label:'Taxable'},{value:'Non-Taxable',label:'Non-Taxable'}]}
          />
        </div>
        <div className="input-group">
          <label>Contact</label>
          <input className="input" type="text" value={form.contact_info} onChange={e=>setForm({...form, contact_info: e.target.value})} />
        </div>
        <div className="input-group">
          <label>Credit Limit</label>
          <input className="input" type="number" step="0.01" value={form.credit_limit} onChange={e=>setForm({...form, credit_limit: e.target.value})} inputMode="decimal" />
        </div>
        <div className="actions-row">
          <button className="btn w-full sm:w-auto" type="submit" onClick={() => console.log('Button clicked!')}>{editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" className="btn secondary w-full sm:w-auto" onClick={()=>{ setEditing(null); setForm({ name: '', phone:'', category:'Retail', gstin:'', tax_applicability:'Taxable', contact_info:'', credit_limit:'' }); }}>Cancel</button>}
        </div>
        {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
        {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
      </form>
      </Card>

      <Card title="Customers List">
        <div className="hidden sm:block">
          <table className="table table-hover mt-2">
            <thead><tr><th>ID</th><th>Code</th><th>Name</th><th>Phone</th><th>Category</th><th>Credit Limit</th><th>GSTIN</th><th>Tax Applicability</th><th>Contact</th><th>Actions</th></tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.customer_code || ('C' + String(c.id).padStart(6,'0'))}</td>
                  <td>{c.name}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.category || '-'}</td>
                  <td>₹ {Number(c.credit_limit||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                  <td>{c.gstin || '-'}</td>
                  <td>{c.tax_applicability || '-'}</td>
                  <td>{c.contact_info || '-'}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm" onClick={()=>startEdit(c)}>Edit</button>
                      <button className="btn danger btn-sm" onClick={async()=>{ await deleteCustomer(c.id); fetchCustomers(); }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="block sm:hidden">
          {visibleCustomers.map(c => (
            <div key={c.id} className="card" style={{marginBottom:12}}>
              <div className="card-body">
                <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Customer #{c.id}</span>
                  <span className="badge">{c.category || '-'}</span>
                </div>
                <div style={{fontSize:13, color:'#9fb0c2', marginBottom:8}}>Code: {c.customer_code || ('C' + String(c.id).padStart(6,'0'))}</div>
                <div className="data-pairs">
                  <div className="pair"><strong>Name:</strong> {c.name}</div>
                  <div className="pair"><strong>Phone:</strong> {c.phone || '-'}</div>
                  <div className="pair" style={{textAlign:'right'}}><strong>Credit:</strong><div>₹ {Number(c.credit_limit||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div></div>
                  <div className="pair"><strong>GSTIN:</strong> {c.gstin || '-'}</div>
                  <div className="pair" style={{flexBasis:'100%'}}><strong>Tax:</strong> {c.tax_applicability || '-'}</div>
                  <div className="pair" style={{flexBasis:'100%'}}><strong>Contact:</strong> {c.contact_info || '-'}</div>
                </div>
                <div className="btn-group" style={{marginTop:10}}>
                  <button className="btn btn-sm" onClick={()=>startEdit(c)}>Edit</button>
                  <button className="btn danger btn-sm" onClick={async()=>{ await deleteCustomer(c.id); fetchCustomers(); }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {visibleCustomers.length < customers.length && (
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

export default Customers;

