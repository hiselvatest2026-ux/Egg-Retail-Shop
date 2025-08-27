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
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Receipts</h1>
          <p className="page-subtitle">Record customer payments and reconcile invoices</p>
        </div>
      </div>

      <Card title={editing ? 'Edit Payment' : 'Add Payment'}>
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(5, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Customer ID</label>
            <input className="input" value={form.customer_id} placeholder="e.g. 501" onChange={e=>setForm({...form, customer_id: e.target.value})} inputMode="numeric" />
          </div>
          <div className="input-group">
            <label>Invoice (Sale) ID</label>
            <input className="input" value={form.invoice_id} placeholder="e.g. 1201" onChange={e=>setForm({...form, invoice_id: e.target.value})} inputMode="numeric" />
          </div>
          <div className="input-group">
            <label>Amount</label>
            <input className="input" value={form.amount} placeholder="e.g. 500.00" onChange={e=>setForm({...form, amount: e.target.value})} inputMode="decimal" />
          </div>
          <div className="input-group">
            <label>Mode</label>
            <input className="input" placeholder="Cash / Card / UPI" value={form.payment_mode} onChange={e=>setForm({...form, payment_mode: e.target.value})} />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit">{editing ? 'Update Payment' : 'Add Payment'}</button>
            {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ customer_id: '', invoice_id: '', amount: '', payment_mode: '' }); }}>Cancel</button>}
          </div>
        </form>
      </Card>

      <Card title="Payment Receipts List">
        <table className="table table-hover mt-2">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Invoice</th><th>Amount</th><th>Mode</th><th style={{width:220}}>Actions</th></tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td><span className="badge">{p.customer_id}</span></td>
                <td>{p.invoice_id}</td>
                <td>₹ {Number(p.amount).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td>{p.payment_mode || 'Cash'}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-sm" onClick={()=>{ setEditing(p.id); setForm({ customer_id: p.customer_id, invoice_id: p.invoice_id, amount: p.amount, payment_mode: p.payment_mode }); }}>Edit</button>
                    <button className="btn danger btn-sm" onClick={async()=>{ await deletePayment(p.id); fetchPayments(); }}>Delete</button>
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

export default Payments;

