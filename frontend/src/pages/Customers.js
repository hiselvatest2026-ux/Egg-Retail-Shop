import React, { useEffect, useState } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: '', contact_info: '' });
  const [editing, setEditing] = useState(null);

  const fetchCustomers = async () => { const res = await getCustomers(); setCustomers(res.data); };
  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    if (editing) {
      await updateCustomer(editing, form);
    } else {
      await createCustomer(form);
    }
    setForm({ name: '', contact_info: '' });
    setEditing(null);
    fetchCustomers();
  };

  const startEdit = (c) => { setEditing(c.id); setForm({ name: c.name || '', contact_info: c.contact_info || '' }); };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Customers</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end mb-4">
        <div>
          <label className="block text-sm">Name</label>
          <input className="border p-2 w-full" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Contact</label>
          <input className="border p-2 w-full" value={form.contact_info} onChange={e=>setForm({...form, contact_info: e.target.value})} />
        </div>
        <button className="bg-green-600 text-white px-3 py-2 rounded" type="submit">{editing ? 'Update' : 'Add'}</button>
      </form>

      <table className="w-full mt-4 border">
        <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Actions</th></tr></thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td>{c.contact_info}</td>
              <td className="space-x-2">
                <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={()=>startEdit(c)}>Edit</button>
                <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={async()=>{ await deleteCustomer(c.id); fetchCustomers(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Customers;

