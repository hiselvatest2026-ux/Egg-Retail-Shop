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

  const { sale, items, total } = invoice;

  return (
    <div className="p-4">
      <Card title={`Invoice #${sale.id}`} actions={<button className="btn secondary" onClick={()=>window.print()}>Print</button>}>
        <div className="mb-4">
          <div>Date: {new Date(sale.sale_date).toLocaleString()}</div>
          <div>Customer: {sale.customer_name || `#${sale.customer_id}`}</div>
        </div>
        <table className="table mb-4">
          <thead>
            <tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id}>
                <td>{idx + 1}</td>
                <td>{it.product_name}</td>
                <td>{it.quantity}</td>
                <td>{it.price}</td>
                <td>{it.line_total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right text-xl font-bold">Grand Total: ₹ {Number(total || 0).toFixed(2)}</div>
      </Card>
    </div>
  );
};

export default Invoice;

