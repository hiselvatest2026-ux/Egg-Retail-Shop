import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSaleInvoice } from '../api/api';

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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Invoice #{sale.id}</h1>
        <button className="bg-gray-700 text-white px-3 py-2 rounded" onClick={()=>window.print()}>Print</button>
      </div>
      <div className="mb-4">
        <div>Date: {new Date(sale.sale_date).toLocaleString()}</div>
        <div>Customer ID: {sale.customer_id}</div>
      </div>

      <table className="w-full border mb-4">
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
    </div>
  );
};

export default Invoice;

