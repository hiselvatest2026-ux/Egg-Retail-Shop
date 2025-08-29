import React, { useEffect, useState } from 'react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../api/api';
import Card from '../components/Card';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', pincode: '', gstin: '', credit_terms: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchVendors = async () => { const res = await getVendors(); setVendors(res.data); };
  useEffect(() => { fetchVendors(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name) { setError('Vendor Name is required.'); return; }
    const payload = { ...form };
    if (editing) {
      await updateVendor(editing, payload);
    } else {
      await createVendor(payload);
    }
    setForm({ name: '', phone: '', address: '', pincode: '', gstin: '', credit_terms: '' });
    setEditing(null);
    setSuccess(editing ? 'Vendor updated.' : 'Vendor added.');
    fetchVendors();
  };

  const startEdit = (v) => {
    setEditing(v.id);
    setForm({
      name: v.name || '',
      phone: v.phone || '',
      address: v.address || '',
      pincode: v.pincode || '',
      gstin: v.gstin || '',
      credit_terms: v.credit_terms || ''
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Master</h1>
          <p className="page-subtitle">Manage supplier/vendor details and credit terms</p>
        </div>
      </div>

      <Card title={editing ? 'Edit Vendor' : 'Add Vendor'}>
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(6, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Vendor Name</label>
            <input className="input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Phone Number</label>
            <input className="input" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
          </div>
          <div className="input-group" style={{gridColumn:'span 2'}}>
            <label>Address</label>
            <input className="input" value={form.address} onChange={e=>setForm({...form, address: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Pincode</label>
            <input className="input" value={form.pincode} onChange={e=>setForm({...form, pincode: e.target.value})} />
          </div>
          <div className="input-group">
            <label>GST#</label>
            <input className="input" value={form.gstin} onChange={e=>setForm({...form, gstin: e.target.value})} placeholder="If applicable" />
          </div>
          <div className="input-group">
            <label>Credit Terms</label>
            <input className="input" value={form.credit_terms} onChange={e=>setForm({...form, credit_terms: e.target.value})} placeholder="e.g., Net 30" />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit">{editing ? 'Update' : 'Add'}</button>
            {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ name:'', phone:'', address:'', pincode:'', gstin:'', credit_terms:'' }); }}>Cancel</button>}
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <Card title="Vendors List">
        <table className="table table-hover mt-2">
          <thead>
            <tr>
              <th>#</th>
              <th>Vendor Code</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Pincode</th>
              <th>GST#</th>
              <th>Credit Terms</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(v => (
              <tr key={v.id}>
                <td>#{v.id}</td>
                <td>{v.vendor_code}</td>
                <td>{v.name}</td>
                <td>{v.phone || '-'}</td>
                <td>{v.address || '-'}</td>
                <td>{v.pincode || '-'}</td>
                <td>{v.gstin || '-'}</td>
                <td>{v.credit_terms || '-'}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-sm" onClick={()=>startEdit(v)}>Edit</button>
                    <button className="btn danger btn-sm" onClick={async()=>{ await deleteVendor(v.id); fetchVendors(); }}>Delete</button>
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

export default Vendors;

