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
  Legend,
  LineController,
  BarController
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
  ChartDataLabels
);

const Metric = ({ title, value }) => (
  <div
    className="kpi-card rounded shadow-sm border border-gray-200 p-4"
    style={{
      background:'#FFFFFF',
      borderRadius:12,
      boxShadow:'0 2px 4px rgba(0,0,0,0.08)',
      transition:'transform 120ms ease, box-shadow 120ms ease'
    }}
    onMouseEnter={(e)=>{ e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.12)'; e.currentTarget.style.transform='translateY(-2px)'; }}
    onMouseLeave={(e)=>{ e.currentTarget.style.boxShadow='0 2px 4px rgba(0,0,0,0.08)'; e.currentTarget.style.transform='translateY(0)'; }}
  >
    <div className="kpi-title text-sm" style={{color:'#7A7A7A', fontWeight:700}}>{title}</div>
    <div className="kpi-value text-2xl font-bold" style={{color:'#333333'}}>{value}</div>
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
      const params = { t: Date.now() };
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

  const formatDay = (s) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  const formatINRCompact = (value) => {
    const n = Number(value || 0);
    const abs = Math.abs(n);
    if (abs >= 10000000) return `${(n/10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `${(n/100000).toFixed(2)}L`;
    if (abs >= 1000) return `${(n/1000).toFixed(1)}K`;
    return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const [isDesktop, setIsDesktop] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    try {
      const mqDesktop = window.matchMedia('(min-width: 1024px)');
      const mqNarrow = window.matchMedia('(max-width: 768px)');
      const handler = () => { setIsDesktop(!!mqDesktop.matches); setIsNarrow(!!mqNarrow.matches); };
      handler();
      mqDesktop.addEventListener('change', handler);
      mqNarrow.addEventListener('change', handler);
      return () => { mqDesktop.removeEventListener('change', handler); mqNarrow.removeEventListener('change', handler); };
    } catch(_) { setIsDesktop(true); setIsNarrow(false); }
  }, []);

  const salesTrendBar = useMemo(() => {
    const rows = data?.sales_trend ?? [];
    const labels = rows.map(d => formatDay(d.day));
    const revenueValues = rows.map(d => Number(d.total||0));
    return {
      labels,
      datasets: [
        { type: 'bar', label: 'Revenue', data: revenueValues, backgroundColor: 'rgba(37, 99, 235, .7)', yAxisID: 'y' }
      ]
    };
  }, [data]);

  

  const qtyTrendBar = useMemo(() => {
    const labels = (data?.sales_qty_trend?.map(d => d.day) ?? []).map(formatDay);
    const values = data?.sales_qty_trend?.map(d => Number(d.qty||0)) ?? [];
    return { labels, datasets: [{ label: 'Quantity', data: values, backgroundColor: 'rgba(34,197,94,.7)' }] };
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
    return { labels: days.map(formatDay), datasets };
  };

  // Build Top-N + Others stacked daily revenue (by customer type)
  const topStackedRevenue = useMemo(() => {
    const rows = Array.isArray(data?.sales_revenue_by_category) ? data.sales_revenue_by_category : [];
    if (!rows.length) return { labels: [], datasets: [] };
    const dayKeys = Array.from(new Set(rows.map(r => r.day))).sort();
    const labels = dayKeys.map(formatDay);
    const totals = new Map();
    rows.forEach(r => {
      const key = r.category || 'Other';
      totals.set(key, (totals.get(key)||0) + Number(r.total||0));
    });
    const topN = 3;
    const sortedCats = Array.from(totals.entries()).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
    const topCats = new Set(sortedCats.slice(0, topN));
    const perDay = new Map();
    rows.forEach(r => {
      const day = formatDay(r.day);
      if (!perDay.has(day)) perDay.set(day, new Map());
      const cat = r.category || 'Other';
      const key = topCats.has(cat) ? cat : 'Others';
      const m = perDay.get(day);
      m.set(key, (m.get(key)||0) + Number(r.total||0));
    });
    const catPalette = (idx) => `hsl(${(idx*67)%360} 70% 50% / .75)`;
    const finalCats = Array.from(topCats);
    if (Array.from(totals.keys()).some(c => !topCats.has(c))) finalCats.push('Others');
    const datasets = finalCats.map((cat, i) => ({
      label: cat,
      data: labels.map(d => (perDay.get(d)?.get(cat)||0)),
      backgroundColor: cat === 'Others' ? 'hsl(215 15% 65% / .7)' : catPalette(i),
      stack: 'rev'
    }));
    return { labels, datasets };
  }, [data]);

  // Build Top-N + Others stacked daily quantity (by customer type)
  const topStackedQty = useMemo(() => {
    const rows = Array.isArray(data?.sales_qty_by_category) ? data.sales_qty_by_category : [];
    if (!rows.length) return { labels: [], datasets: [] };
    const dayKeys = Array.from(new Set(rows.map(r => r.day))).sort();
    const labels = dayKeys.map(formatDay);
    const totals = new Map();
    rows.forEach(r => {
      const key = r.category || 'Other';
      totals.set(key, (totals.get(key)||0) + Number(r.qty||0));
    });
    const topN = 3;
    const sortedCats = Array.from(totals.entries()).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
    const topCats = new Set(sortedCats.slice(0, topN));
    const perDay = new Map();
    rows.forEach(r => {
      const day = formatDay(r.day);
      if (!perDay.has(day)) perDay.set(day, new Map());
      const cat = r.category || 'Other';
      const key = topCats.has(cat) ? cat : 'Others';
      const m = perDay.get(day);
      m.set(key, (m.get(key)||0) + Number(r.qty||0));
    });
    const catPalette = (idx) => `hsl(${(idx*67)%360} 70% 50% / .75)`;
    const finalCats = Array.from(topCats);
    if (Array.from(totals.keys()).some(c => !topCats.has(c))) finalCats.push('Others');
    const datasets = finalCats.map((cat, i) => ({
      label: cat,
      data: labels.map(d => (perDay.get(d)?.get(cat)||0)),
      backgroundColor: cat === 'Others' ? 'hsl(215 15% 65% / .7)' : catPalette(i),
      stack: 'qty'
    }));
    return { labels, datasets };
  }, [data]);

  const qtyByCategoryChart = useMemo(() => groupByDay(data?.sales_qty_by_category, 'qty'), [data]);
  const revenueByCategoryChart = useMemo(() => groupByDay(data?.sales_revenue_by_category, 'total'), [data]);

  const datalabelBase = {
    anchor: 'end',
    align: 'top',
    offset: 6,
    color: '#111827',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.1)',
    padding: { top: 2, bottom: 2, left: 4, right: 4 },
    clip: false,
    font: { weight: '700' },
    // formatter is overridden per chart to apply compact INR or raw qty
  };

  const baseLegend = {
    position: 'bottom',
    labels: {
      boxWidth: 14,
      boxHeight: 14,
      padding: 12,
      color: '#374151',
      font: { weight: '700', size: 12 }
    }
  };

  const valueLabelOptions = {
    responsive: true,
    plugins: {
      legend: baseLegend,
      datalabels: {
        ...datalabelBase,
        display: (ctx) => {
          const val = Number(ctx?.dataset?.data?.[ctx?.dataIndex] || 0);
          return val > 0;
        },
        formatter: (v, ctx) => {
          const lbl = String(ctx?.dataset?.label||'').toLowerCase();
          if (lbl.includes('quantity') || lbl === 'qty') {
            const n = Number(v||0);
            return Math.round(n) === n ? String(n) : String(n.toFixed(0));
          }
          return `₹ ${formatINRCompact(v)}`;
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items) => (items && items[0] ? items[0].label : ''),
          label: (ctx) => {
            const lbl = String(ctx?.dataset?.label||'').toLowerCase();
            const raw = Number(ctx.parsed?.y ?? ctx.raw ?? 0);
            if (lbl.includes('quantity') || lbl === 'qty') {
              return `${raw.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
            }
            return `₹ ${formatINRCompact(raw)}`;
          }
        }
      }
    },
    scales: {
      x: { ticks: { autoSkip: false } },
      y: { beginAtZero: true, title: { display: true, text: 'Revenue (₹)' } },
      y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Qty' } }
    }
  };

  if (loading) return <div className="p-4" style={{background:'#0F1220', minHeight:'100vh', color:'#E5E7EB'}}>Loading dashboard...</div>;

  return (
    <div className="p-4" style={{background:'#0F1220'}}>
      <div style={{maxWidth:1200, margin:'0 auto'}}>
      <h1 className="text-2xl font-bold mb-4" style={{color:'#E5E7EB'}}>Dashboard</h1>
      <div className="form-row" style={{marginBottom: 12, color:'#E5E7EB'}}>
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
        <Metric title="MTD Sales" value={`₹ ${Number(data?.metrics?.mtd_sales || 0).toFixed(2)}`} />
        <Metric title="YTD Sales" value={`₹ ${Number(data?.metrics?.ytd_sales || 0).toFixed(2)}`} />
        <Metric title="Purchases Today" value={`₹ ${Number(data?.metrics?.total_purchases_today || 0).toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        <Metric title="Total Stock Value" value={`₹ ${Number(data?.metrics?.total_stock_value || 0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`} />
        <Metric title="Pending Collections" value={`₹ ${Number(data?.metrics?.pending_collections || 0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`} />
      </div>

      <div className="mb-6">
        <div className="text-sm mb-2" style={{color:'#E5E7EB'}}>Quick Actions</div>
        <div className="flex flex-wrap gap-3">
          <Link className="btn" style={{background:'#2196F3', color:'#fff', border:'none'}} to="/sales">New Sale</Link>
          <Link className="btn" style={{background:'#2196F3', color:'#fff', border:'none'}} to="/walkin">Walk‑in Sale</Link>
          <Link className="btn" style={{background:'#2196F3', color:'#fff', border:'none'}} to="/purchases">New Purchase</Link>
          <Link className="btn" style={{background:'#2196F3', color:'#fff', border:'none'}} to="/inventory/adjustments">Stock Adjustment</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title={null}>
          <div style={{ background:'#ffffff', borderRadius:12, padding:16, boxShadow:'0 2px 4px rgba(0,0,0,0.08)' }}>
            <div style={{color:'#333333', fontWeight:900, marginBottom:6}}>Daily Sales Revenue trend</div>
            <Bar data={salesTrendBar} options={{
              responsive: true,
              plugins: {
                legend: baseLegend,
                datalabels: {
                  ...datalabelBase,
                  display: (ctx) => !isNarrow && Number(ctx?.dataset?.data?.[ctx?.dataIndex]||0) > 0,
                  formatter: (v) => `₹ ${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`
                },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    title: (items) => (items && items[0] ? items[0].label : ''),
                    label: (ctx) => `₹ ${Number(ctx.parsed?.y ?? ctx.raw ?? 0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`
                  }
                }
              },
              scales: {
                x: { ticks: { autoSkip: false } },
                y: { beginAtZero: true, title: { display: true, text: 'Revenue (₹)' } }
              }
            }} />
          </div>
        </Card>
        <Card title={null}>
          <div style={{ background:'#ffffff', borderRadius:12, padding:16, boxShadow:'0 2px 4px rgba(0,0,0,0.08)' }}>
            <div style={{color:'#333333', fontWeight:900, marginBottom:6}}>Daily Sales Quantity trend</div>
            <Bar data={qtyTrendBar} options={{
              responsive: true,
              plugins: {
                legend: baseLegend,
                datalabels: {
                  ...datalabelBase,
                  display: (ctx) => !isNarrow && Number(ctx?.dataset?.data?.[ctx?.dataIndex]||0) > 0,
                  formatter: (v) => Number(v||0).toLocaleString(undefined,{ maximumFractionDigits: 0 })
                }
              },
              scales: {
                x: { ticks: { autoSkip: false } },
                y: { beginAtZero: true }
              }
            }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title={null}>
          <div style={{ background:'#ffffff', borderRadius:12, padding:16, boxShadow:'0 2px 4px rgba(0,0,0,0.08)' }}>
            <div style={{color:'#333333', fontWeight:900, marginBottom:6}}>Daily Sales Revenue by customer Type</div>
            <Bar data={topStackedRevenue} options={{
              responsive: true,
              plugins: {
                legend: baseLegend,
                datalabels: {
                  ...datalabelBase,
                  display: (ctx) => !isNarrow && Number(ctx?.dataset?.data?.[ctx?.dataIndex]||0) > 0,
                  formatter: (v) => `₹ ${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`
                },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    title: (items) => (items && items[0] ? items[0].label : ''),
                    label: (ctx) => `₹ ${Number(ctx.parsed?.y ?? ctx.raw ?? 0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`
                  }
                }
              },
              scales: { x: { stacked:true }, y: { stacked:true, beginAtZero:true } }
            }} />
          </div>
        </Card>
        <Card title={null}>
          <div style={{ background:'#ffffff', borderRadius:12, padding:16, boxShadow:'0 2px 4px rgba(0,0,0,0.08)' }}>
            <div style={{color:'#333333', fontWeight:900, marginBottom:6}}>Daily Sales Quantity by customer Type</div>
            <Bar data={topStackedQty} options={{
              responsive: true,
              plugins: {
                legend: baseLegend,
                datalabels: { ...datalabelBase, display: (ctx) => !isNarrow && Number(ctx?.dataset?.data?.[ctx?.dataIndex]||0) > 0 }
              },
              scales: { x: { stacked:true }, y: { stacked:true, beginAtZero:true } }
            }} />
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;