import React, { useEffect, useState } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/api';
import Card from '../components/Card';

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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Master</h1>
          <p className="page-subtitle">Manage customer taxation and profiles</p>
        </div>
      </div>
      <Card title={editing ? 'Edit Customer' : 'Add Customer'}>
      <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(6, minmax(0,1fr))'}}>
        <div className="input-group">
          <label>Customer Name</label>
          <input className="input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
        </div>
        <div className="input-group">
          <label>Phone Number</label>
          <input className="input" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
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
          <label>GSTIN</label>
          <input className="input" value={form.gstin} onChange={e=>setForm({...form, gstin: e.target.value})} placeholder="If applicable" />
        </div>
        <div className="input-group">
          <label>Tax Applicability</label>
          <select className="input" value={form.tax_applicability} onChange={e=>setForm({...form, tax_applicability: e.target.value})}>
            <option value="Taxable">Taxable</option>
            <option value="Non-Taxable">Non-Taxable</option>
          </select>
        </div>
        <div className="input-group">
          <label>Contact</label>
          <input className="input" value={form.contact_info} onChange={e=>setForm({...form, contact_info: e.target.value})} />
        </div>
        <div className="input-group">
          <label>Credit Limit</label>
          <input className="input" value={form.credit_limit} onChange={e=>setForm({...form, credit_limit: e.target.value})} inputMode="decimal" />
        </div>
        <div className="actions-row">
          <button className="btn" type="submit" onClick={() => console.log('Button clicked!')}>{editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ name: '', phone:'', category:'Retail', gstin:'', tax_applicability:'Taxable', contact_info:'', credit_limit:'' }); }}>Cancel</button>}
        </div>
        {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
        {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
      </form>
      </Card>

      <Card title="Customers List">
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
      </Card>
    </div>
  );
};

export default Customers;

