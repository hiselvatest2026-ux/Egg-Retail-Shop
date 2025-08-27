import React, { useEffect, useState } from 'react';
import { getPayments, createPayment, updatePayment, deletePayment } from '../api/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({ customer_id: '', invoice_id: '', amount: '', payment_mode: '' });
  const [editing, setEditing] = useState(null);

  const fetchPayments = async () => {
    const res = await getPayments();
    setPayments(res.data);
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id || !form.invoice_id || !form.amount) return;
    if (editing) {
      await updatePayment(editing, {
        amount: Number(form.amount),
        payment_mode: form.payment_mode || 'Cash'
      });
    } else {
      await createPayment({
        customer_id: Number(form.customer_id),
        invoice_id: Number(form.invoice_id),
        amount: Number(form.amount),
        payment_mode: form.payment_mode || 'Cash'
      });
    }
    setForm({ customer_id: '', invoice_id: '', amount: '', payment_mode: '' });
    setEditing(null);
    fetchPayments();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Payment Receipts</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end mb-4">
        <div>
          <label className="block text-sm">Customer ID</label>
          <input className="border p-2" value={form.customer_id} onChange={e=>setForm({...form, customer_id: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Invoice (Sale) ID</label>
          <input className="border p-2" value={form.invoice_id} onChange={e=>setForm({...form, invoice_id: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Amount</label>
          <input className="border p-2" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Mode</label>
          <input className="border p-2" placeholder="Cash / Card / UPI" value={form.payment_mode} onChange={e=>setForm({...form, payment_mode: e.target.value})} />
        </div>
        <button className="bg-green-600 text-white px-3 py-2 rounded" type="submit">Add Payment</button>
      </form>

      <table className="w-full mt-4 border">
        <thead>
          <tr><th>ID</th><th>Customer</th><th>Invoice</th><th>Amount</th><th>Mode</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.customer_id}</td>
              <td>{p.invoice_id}</td>
              <td>{p.amount}</td>
              <td>{p.payment_mode}</td>
              <td className="space-x-2">
                <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={()=>{ setEditing(p.id); setForm({ customer_id: p.customer_id, invoice_id: p.invoice_id, amount: p.amount, payment_mode: p.payment_mode }); }}>Edit</button>
                <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={async()=>{ await deletePayment(p.id); fetchPayments(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Payments;

