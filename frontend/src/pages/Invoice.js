import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSaleInvoice } from '../api/api';
import Card from '../components/Card';

const Invoice = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getSaleInvoice(id);
      setInvoice(res.data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-4">Loading invoice...</div>;
  if (!invoice) return <div className="p-4">Invoice not found.</div>;

  const { company, sale, items, total, totals } = invoice;

  return (
    <div className="p-4">
      <Card title={`Invoice #${sale.id}`} actions={<button className="btn secondary" onClick={()=>window.print()}>Print</button>}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16}}>
          <div>
            <div className="text-xl font-bold">{company?.company_name || 'Company'}</div>
            <div style={{whiteSpace:'pre-line'}}>{company?.address || ''}</div>
            <div>GSTIN: {company?.gstin || '-'}</div>
            <div>Phone: {company?.phone || '-'}</div>
            <div>Email: {company?.email || '-'}</div>
          </div>
          <div>
            <div><strong>Invoice No:</strong> #{sale.id}</div>
            <div><strong>Date:</strong> {new Date(sale.sale_date).toLocaleString()}</div>
            <div><strong>Payment Mode:</strong> {sale.payment_method || '-'}</div>
            <div><strong>Sale Type:</strong> {sale.sale_type || '-'}</div>
            {sale.route_name && <div><strong>Route:</strong> {sale.route_name} ({sale.route_vehicle||'-'})</div>}
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16}}>
          <div>
            <div className="text-md font-bold">Bill To</div>
            <div>{sale.customer_name} (#{sale.customer_code})</div>
            <div style={{whiteSpace:'pre-line'}}>{sale.customer_address || ''}</div>
            <div>Phone: {sale.customer_phone || '-'}</div>
            <div>GSTIN: {sale.customer_gstin || '-'}</div>
            <div>Tax Status: {sale.tax_applicability || '-'}</div>
          </div>
        </div>

        <table className="table mb-4">
          <thead>
            <tr><th>#</th><th>HSN/SAC</th><th>Product</th><th>Qty</th><th>Rate</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th></tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((it, idx) => (
                <tr key={it.id}>
                  <td>{idx + 1}</td>
                  <td>{it.hsn_sac || '-'}</td>
                  <td>{it.product_name}</td>
                  <td>{it.quantity}</td>
                  <td>{Number(it.price).toFixed(2)}</td>
                  <td>{Number(it.taxable_value||0).toFixed(2)}</td>
                  <td>{Number(it.cgst||0).toFixed(2)}</td>
                  <td>{Number(it.sgst||0).toFixed(2)}</td>
                  <td>{Number(it.igst||0).toFixed(2)}</td>
                  <td>{Number(it.line_total).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} style={{color:'#64748b'}}>No line items added yet.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:16}}>
          <div>
            <div style={{marginTop:32}}>Thank you for your business!</div>
          </div>
          <div>
            <div>Subtotal: ₹ {Number(totals?.subtotal||0).toFixed(2)}</div>
            <div>CGST: ₹ {Number(totals?.cgst_total||0).toFixed(2)}</div>
            <div>SGST: ₹ {Number(totals?.sgst_total||0).toFixed(2)}</div>
            <div>IGST: ₹ {Number(totals?.igst_total||0).toFixed(2)}</div>
            <div>Round off: ₹ {Number(totals?.round_off||0).toFixed(2)}</div>
            <div className="text-xl font-bold">Grand Total: ₹ {Number(totals?.grand_total||total||0).toFixed(2)}</div>
            <div>Paid: ₹ {Number(totals?.paid||0).toFixed(2)}</div>
            <div>Balance: ₹ {Number(totals?.balance||0).toFixed(2)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Invoice;

