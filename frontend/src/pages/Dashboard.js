import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/api';
import { Line, Bar } from 'react-chartjs-2';
import Card from '../components/Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Metric = ({ title, value }) => (
  <div className="kpi-card rounded shadow-sm border border-gray-200 p-4">
    <div className="kpi-title text-sm">{title}</div>
    <div className="kpi-value text-2xl font-bold">{value}</div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await getDashboard();
      setData(res.data);
    } catch (e) {
      setErrorMsg('Failed to load dashboard. Please check the API and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const salesTrendChart = useMemo(() => {
    const labels = data?.sales_trend?.map(d => d.day) ?? [];
    const values = data?.sales_trend?.map(d => d.total) ?? [];
    return {
      labels,
      datasets: [{ label: 'Sales (last 7 days)', data: values, borderColor: 'rgb(37, 99, 235)', backgroundColor: 'rgba(37, 99, 235, .3)' }]
    };
  }, [data]);

  const lowStockChart = useMemo(() => {
    const lowStock = Array.isArray(data?.low_stock) ? data.low_stock : [];
    const labels = lowStock.map(d => d?.name ?? '');
    const values = lowStock.map(d => Number(d?.stock ?? 0));
    return {
      labels,
      datasets: [{ label: 'Stock', data: values, backgroundColor: 'rgba(16, 185, 129, .5)' }]
    };
  }, [data]);

  if (loading) return <div className="p-4">Loading dashboard...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {errorMsg && (
        <div className="toast" style={{marginBottom:12}}>
          {errorMsg}
          <div className="btn-group" style={{marginTop:8}}>
            <button className="btn primary btn-sm" onClick={load}>Retry</button>
            <Link className="btn secondary btn-sm" to="/sales">Go to Sales</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Metric title="Total Sales Today" value={`₹ ${Number(data?.metrics?.total_sales_today || 0).toFixed(2)}`} />
        <Metric title="Purchases Today" value={`₹ ${Number(data?.metrics?.total_purchases_today || 0).toFixed(2)}`} />
        <Metric title="Total Stock Value" value={`₹ ${Number(data?.metrics?.total_stock_value || 0).toFixed(2)}`} />
        <Metric title="Pending Collections" value={`₹ ${Number(data?.metrics?.pending_collections || 0).toFixed(2)}`} />
      </div>

      <div className="mb-6">
        <div className="text-sm mb-2" style={{color:'#6b7280'}}>Quick Actions</div>
        <div className="flex flex-wrap gap-3">
          <Link className="btn" to="/sales">New Sale</Link>
          <Link className="btn" to="/walkin">Walk‑in Sale</Link>
          <Link className="btn" to="/purchases">New Purchase</Link>
          <Link className="btn" to="/inventory/adjustments">Stock Adjustment</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Sales Trend">
          <Line data={salesTrendChart} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </Card>
        <Card title="Low/Current Stock by Product">
          <Bar data={lowStockChart} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Sales">
          <div className="divide-y">
            {(data?.recent_sales || []).map((r)=> (
              <div key={r.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">Invoice #{r.id} — {r.customer_name || '-'}
                  </div>
                  <div className="text-xs" style={{color:'#6b7280'}}>{new Date(r.sale_date).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹ {Number(r.total||0).toFixed(2)}</div>
                  <div className="text-xs" style={{color:'#6b7280'}}>Paid ₹ {Number(r.paid||0).toFixed(2)} | Bal ₹ {Number(r.balance||0).toFixed(2)}</div>
                </div>
                <Link to={`/invoice/${r.id}`} className="btn btn-sm" style={{marginLeft:12}}>View</Link>
              </div>
            ))}
            {(!data?.recent_sales || data?.recent_sales.length === 0) && (
              <div className="py-4 text-sm" style={{color:'#6b7280'}}>No recent sales</div>
            )}
          </div>
        </Card>
        <Card title="Recent Purchases">
          <div className="divide-y">
            {(data?.recent_purchases || []).map((r)=> (
              <div key={r.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">Purchase #{r.id} — {r.vendor_name || '-'}</div>
                  <div className="text-xs" style={{color:'#6b7280'}}>{new Date(r.purchase_date).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹ {Number(r.total||0).toFixed(2)}</div>
                </div>
                <Link to={`/purchases/${r.id}/items`} className="btn btn-sm" style={{marginLeft:12}}>Open</Link>
              </div>
            ))}
            {(!data?.recent_purchases || data?.recent_purchases.length === 0) && (
              <div className="py-4 text-sm" style={{color:'#6b7280'}}>No recent purchases</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

