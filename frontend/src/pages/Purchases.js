import React, { useEffect, useState } from 'react';
import { getPurchases, deletePurchase } from '../api/api';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const fetchPurchases = async () => { const res = await getPurchases(); setPurchases(res.data); };
  useEffect(() => { fetchPurchases(); }, []);
  return (<div className="p-4">
    <h1 className="text-xl font-bold mb-4">Purchases</h1>
    <table className="w-full mt-4 border">
      <thead><tr><th>ID</th><th>Supplier</th><th>Total</th><th>Actions</th></tr></thead>
      <tbody>{purchases.map(p => (<tr key={p.id}>
        <td>{p.id}</td><td>{p.supplier_id}</td><td>{p.total}</td>
        <td><button className="bg-red-500 text-white px-2 py-1 rounded" onClick={()=>{deletePurchase(p.id); fetchPurchases();}}>Delete</button></td>
      </tr>))}</tbody>
    </table>
  </div>);
}
export default Purchases;