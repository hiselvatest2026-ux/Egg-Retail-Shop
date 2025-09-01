import React, { useEffect, useMemo, useState } from 'react';
import { getPayments, createPayment, updatePayment, deletePayment, getCustomers, getSales } from '../api/api';
import Card from '../components/Card';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({ customer_id: '', invoice_id: '', amount: '', payment_mode: '' });
  const [editing, setEditing] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await getPayments();
      setPayments(res.data);
    } catch (e) { console.error('load payments failed', e); }
  };

  useEffect(() => {
    fetchPayments();
    (async()=>{
      try {
        const [cRes, sRes] = await Promise.all([getCustomers(), getSales()]);
        setCustomers(cRes.data || []);
        setInvoices(sRes.data || []);
      } catch (e) { console.error('load dropdown data failed', e); }
    })();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!form.customer_id) return invoices;
    return invoices.filter(inv => String(inv.customer_id) === String(form.customer_id));
  }, [invoices, form.customer_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.customer_id) { setError('Please select a customer.'); return; }
    if (!form.invoice_id) { setError('Please select an invoice.'); return; }
    if (!form.amount || Number.isNaN(Number(form.amount))) { setError('Please enter a valid amount.'); return; }
    try {
      if (editing) {
        await updatePayment(editing, {
          amount: Number(form.amount),
          payment_mode: form.payment_mode || 'Cash'
        });
        setSuccess('Payment updated successfully.');
      } else {
        await createPayment({
          customer_id: Number(form.customer_id),
          invoice_id: Number(form.invoice_id),
          amount: Number(form.amount),
          payment_mode: form.payment_mode || 'Cash'
        });
        setSuccess('Payment added successfully.');
      }
      setForm({ customer_id: '', invoice_id: '', amount: '', payment_mode: '' });
      setEditing(null);
      await fetchPayments();
    } catch (e) {
      console.error('submit payment failed', e);
      setError('Failed to save payment. Please try again.');
    }
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
            <label>Customer</label>
            <select className="input" value={form.customer_id} onChange={e=>setForm({...form, customer_id: e.target.value, invoice_id: ''})}>
              <option value="">{customers.length ? 'Select customer' : 'No customers found'}</option>
              {customers.map(c => (<option key={c.id} value={c.id}>{c.name} (#{c.id})</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Invoice (Sale)</label>
            <select className="input" value={form.invoice_id} onChange={e=>setForm({...form, invoice_id: e.target.value})}>
              <option value="">{filteredInvoices.length ? 'Select invoice' : 'No invoices found'}</option>
              {filteredInvoices.map(inv => (<option key={inv.id} value={inv.id}>Invoice #{inv.id} - ₹ {Number(inv.total||0).toFixed(2)}</option>))}
            </select>
          </div>
          <div className="input-group">
            <label>Amount</label>
            <input className="input" value={form.amount} placeholder="e.g. 500.00" onChange={e=>setForm({...form, amount: e.target.value})} inputMode="decimal" />
          </div>
          <div className="input-group">
            <label>Mode</label>
            <input className="input" placeholder="Cash / Card / UPI" value={form.payment_mode} onChange={e=>setForm({...form, payment_mode: e.target.value})} />
          </div>
          <div className="actions-row sticky-actions">
            <button className="btn" type="submit">{editing ? 'Update Payment' : 'Add Payment'}</button>
            {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ customer_id: '', invoice_id: '', amount: '', payment_mode: '' }); }}>Cancel</button>}
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <Card title="Payment Receipts List">
        <div className="hide-on-mobile">
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
                      <button className="btn danger btn-sm" onClick={async()=>{ try { await deletePayment(p.id); await fetchPayments(); } catch(e){ console.error('delete failed', e);} }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cards-mobile">
          {payments.map(p => (
            <div key={p.id} className="card" style={{marginBottom:10}}>
              <div className="card-body">
                <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Payment #{p.id}</span>
                  <span className="badge">{p.payment_mode || 'Cash'}</span>
                </div>
                <div className="data-pairs">
                  <div className="pair"><strong>Customer:</strong> #{p.customer_id}</div>
                  <div className="pair"><strong>Invoice:</strong> #{p.invoice_id}</div>
                  <div className="pair"><strong>Amount:</strong> ₹ {Number(p.amount).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                </div>
                <div className="btn-group" style={{marginTop:10}}>
                  <button className="btn btn-sm" onClick={()=>{ setEditing(p.id); setForm({ customer_id: p.customer_id, invoice_id: p.invoice_id, amount: p.amount, payment_mode: p.payment_mode }); }}>Edit</button>
                  <button className="btn danger btn-sm" onClick={async()=>{ try { await deletePayment(p.id); await fetchPayments(); } catch(e){ console.error('delete failed', e);} }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Payments;

