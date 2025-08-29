import React, { useEffect, useState } from 'react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../api/api';
import Card from '../components/Card';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', pincode: '', gstin: '', credit_terms: '' });
  const [editing, setEditing] = useState(null);

  const fetchVendors = async () => { const res = await getVendors(); setVendors(res.data); };
  useEffect(() => { fetchVendors(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    const payload = { ...form };
    if (editing) {
      await updateVendor(editing, payload);
    } else {
      await createVendor(payload);
    }
    setForm({ name: '', phone: '', address: '', pincode: '', gstin: '', credit_terms: '' });
    setEditing(null);
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Vendor Master</h1>
      <Card title={editing ? 'Edit Vendor' : 'Add Vendor'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
          <div>
            <label className="block text-sm">Vendor Name</label>
            <input className="border p-2 w-full" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Phone</label>
            <input className="border p-2 w-full" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Address</label>
            <input className="border p-2 w-full" value={form.address} onChange={e=>setForm({...form, address: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Pincode</label>
            <input className="border p-2 w-full" value={form.pincode} onChange={e=>setForm({...form, pincode: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">GST#</label>
            <input className="border p-2 w-full" value={form.gstin} onChange={e=>setForm({...form, gstin: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Credit terms</label>
            <input className="border p-2 w-full" value={form.credit_terms} onChange={e=>setForm({...form, credit_terms: e.target.value})} />
          </div>
          <button className="btn" type="submit">{editing ? 'Update' : 'Add'}</button>
        </form>
      </Card>

      <Card title="Vendors List">
        <table className="table mt-2">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vendor Code</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Pincode</th>
              <th>GST#</th>
              <th>Credit terms</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(v => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.vendor_code}</td>
                <td>{v.name}</td>
                <td>{v.phone}</td>
                <td>{v.address}</td>
                <td>{v.pincode}</td>
                <td>{v.gstin}</td>
                <td>{v.credit_terms}</td>
                <td className="space-x-2">
                  <button className="btn" onClick={()=>startEdit(v)}>Edit</button>
                  <button className="btn danger" onClick={async()=>{ await deleteVendor(v.id); fetchVendors(); }}>Delete</button>
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

