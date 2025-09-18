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
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ChartDataLabels);

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
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const params = {};
      if (start) params.start = start;
      if (end) params.end = end;
      const res = await getDashboard(params);
      setData(res.data);
    } catch (e) {
      setErrorMsg('Failed to load dashboard. Please check the API and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const salesTrendBar = useMemo(() => {
    const labels = data?.sales_trend?.map(d => d.day) ?? [];
    const revenueValues = data?.sales_trend?.map(d => Number(d.total||0)) ?? [];
    const qtyMap = new Map((data?.sales_qty_trend||[]).map(r => [r.day, Number(r.qty||0)]));
    const qtyValues = labels.map(day => qtyMap.get(day) || 0);
    return {
      labels,
      datasets: [
        { type: 'bar', label: 'Revenue', data: revenueValues, backgroundColor: 'rgba(37, 99, 235, .7)', yAxisID: 'y' },
        { type: 'line', label: 'Qty', data: qtyValues, borderColor: 'rgb(34,197,94)', backgroundColor: 'rgba(34,197,94,0)', yAxisID: 'y1', borderWidth: 2, pointRadius: 3, tension: 0.25 }
      ]
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

  const qtyTrendBar = useMemo(() => {
    const labels = data?.sales_qty_trend?.map(d => d.day) ?? [];
    const values = data?.sales_qty_trend?.map(d => Number(d.qty||0)) ?? [];
    return { labels, datasets: [{ label: 'Quantity', data: values, backgroundColor: 'rgba(34,197,94,.7)' }] };
  }, [data]);

  const groupByDay = (rows, valueKey) => {
    const map = new Map();
    (rows||[]).forEach(r => {
      const day = r.day; const cat = r.category || 'Other'; const val = Number(r[valueKey]||0);
      if (!map.has(day)) map.set(day, {});
      const obj = map.get(day); obj[cat] = (obj[cat]||0) + val;
    });
    const days = Array.from(map.keys()).sort();
    const cats = Array.from(new Set([].concat(...Array.from(map.values()).map(o=>Object.keys(o)))));
    const datasets = cats.map((c,i)=>({ label: c, data: days.map(d => (map.get(d)?.[c]||0)), backgroundColor: `hsl(${(i*67)%360} 70% 50% / .6)` }));
    return { labels: days, datasets };
  };

  const qtyByCategoryChart = useMemo(() => groupByDay(data?.sales_qty_by_category, 'qty'), [data]);
  const revenueByCategoryChart = useMemo(() => groupByDay(data?.sales_revenue_by_category, 'total'), [data]);

  const valueLabelOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#111827',
        formatter: (v) => typeof v === 'number' ? (Math.round(v) === v ? v : v.toFixed(0)) : v,
        font: { weight: '700' }
      },
      tooltip: { enabled: true }
    },
    scales: {
      x: { ticks: { autoSkip: false } },
      y: { beginAtZero: true, title: { display: true, text: 'Revenue (₹)' } },
      y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Qty' } }
    }
  };

  if (loading) return <div className="p-4">Loading dashboard...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="form-row" style={{marginBottom: 12}}>
        <div className="input-group">
          <label>Start Date</label>
          <input className="input date" type="date" value={start} onChange={(e)=>setStart(e.target.value)} />
        </div>
        <div className="input-group">
          <label>End Date</label>
          <input className="input date" type="date" value={end} onChange={(e)=>setEnd(e.target.value)} />
        </div>
        <div className="input-group" style={{alignSelf:'end'}}>
          <button className="btn" onClick={load}>Apply</button>
        </div>
      </div>
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
        <Metric title="Total Stock Value" value={`₹ ${Number(data?.metrics?.total_stock_value || 0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`} />
        <Metric title="Pending Collections" value={`₹ ${Number(data?.metrics?.pending_collections || 0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`} />
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
        <Card title="Sales Revenue (Daily)">
          <div style={{ background:'#ffffff', borderRadius:12, padding:12 }}>
            <Bar data={salesTrendBar} options={valueLabelOptions} />
          </div>
        </Card>
        <Card title="Sales Quantity Trend">
          <div style={{ background:'#ffffff', borderRadius:12, padding:12 }}>
            <Bar data={qtyTrendBar} options={valueLabelOptions} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Qty by Customer Type (Daily)">
          <div style={{ background:'#ffffff', borderRadius:12, padding:12 }}>
            <Bar data={qtyByCategoryChart} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { x: { stacked:true }, y: { stacked:true } } }} />
          </div>
        </Card>
        <Card title="Revenue by Customer Type (Daily)">
          <div style={{ background:'#ffffff', borderRadius:12, padding:12 }}>
            <Bar data={revenueByCategoryChart} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { x: { stacked:true }, y: { stacked:true } } }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Low/Current Stock by Product">
          <div style={{ background:'#ffffff', borderRadius:12, padding:12 }}>
            <Bar data={lowStockChart} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </div>
        </Card>
        <div />
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

