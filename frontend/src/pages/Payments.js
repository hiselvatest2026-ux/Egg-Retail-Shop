import React, { useEffect, useState } from 'react';
import { getPayments, createPayment, updatePayment, deletePayment } from '../api/api';
import Card from '../components/Card';

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
      <h1 className="text-2xl font-bold mb-4">Payment Receipts</h1>

      <Card title={editing ? 'Edit Payment' : 'Add Payment'}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-sm">Customer ID</label>
          <input className="border p-2 w-full" value={form.customer_id} onChange={e=>setForm({...form, customer_id: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Invoice (Sale) ID</label>
          <input className="border p-2 w-full" value={form.invoice_id} onChange={e=>setForm({...form, invoice_id: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Amount</label>
          <input className="border p-2 w-full" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Mode</label>
          <input className="border p-2 w-full" placeholder="Cash / Card / UPI" value={form.payment_mode} onChange={e=>setForm({...form, payment_mode: e.target.value})} />
        </div>
        <button className="btn" type="submit">{editing ? 'Update' : 'Add'}</button>
      </form>
      </Card>

      <Card title="Payment Receipts List">
      <table className="table mt-2">
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
                <button className="btn" onClick={()=>{ setEditing(p.id); setForm({ customer_id: p.customer_id, invoice_id: p.invoice_id, amount: p.amount, payment_mode: p.payment_mode }); }}>Edit</button>
                <button className="btn danger" onClick={async()=>{ await deletePayment(p.id); fetchPayments(); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </Card>
    </div>
  );
};

export default Payments;

