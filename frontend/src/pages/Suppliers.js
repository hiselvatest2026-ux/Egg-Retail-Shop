import React, { useEffect, useState } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api/api';
import Card from '../components/Card';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ name: '', contact_info: '' });
  const [editing, setEditing] = useState(null);

  const fetchSuppliers = async () => { const res = await getSuppliers(); setSuppliers(res.data); };
  useEffect(() => { fetchSuppliers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    if (editing) {
      await updateSupplier(editing, form);
    } else {
      await createSupplier(form);
    }
    setForm({ name: '', contact_info: '' });
    setEditing(null);
    fetchSuppliers();
  };

  const startEdit = (s) => { setEditing(s.id); setForm({ name: s.name || '', contact_info: s.contact_info || '' }); };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Suppliers</h1>
      <Card title={editing ? 'Edit Supplier' : 'Add Supplier'}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-sm">Name</label>
          <input className="border p-2 w-full" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Contact</label>
          <input className="border p-2 w-full" value={form.contact_info} onChange={e=>setForm({...form, contact_info: e.target.value})} />
        </div>
        <button className="btn" type="submit">{editing ? 'Update' : 'Add'}</button>
      </form>
      </Card>

      <Card title="Suppliers List">
      <table className="table mt-2">
        <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Actions</th></tr></thead>
        <tbody>
          {suppliers.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.contact_info}</td>
              <td className="space-x-2">
                <button className="btn" onClick={()=>startEdit(s)}>Edit</button>
                <button className="btn danger" onClick={async()=>{ await deleteSupplier(s.id); fetchSuppliers(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </Card>
    </div>
  );
};

export default Suppliers;

