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
  <div className="bg-white rounded shadow-sm border border-gray-200 p-4">
    <div className="text-sm" style={{color:'#6b7280'}}>{title}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getDashboard();
      setData(res.data);
      setLoading(false);
    })();
  }, []);

  const salesTrendChart = useMemo(() => {
    const labels = data?.sales_trend?.map(d => d.day) ?? [];
    const values = data?.sales_trend?.map(d => d.total) ?? [];
    return {
      labels,
      datasets: [{ label: 'Sales (last 7 days)', data: values, borderColor: 'rgb(37, 99, 235)', backgroundColor: 'rgba(37, 99, 235, .3)' }]
    };
  }, [data]);

  const lowStockChart = useMemo(() => {
    const labels = data?.low_stock?.map(d => d.name) ?? [];
    const values = data?.low_stock?.map(d => d.stock) ?? [];
    return {
      labels,
      datasets: [{ label: 'Stock', data: values, backgroundColor: 'rgba(16, 185, 129, .5)' }]
    };
  }, [data]);

  if (loading) return <div className="p-4">Loading dashboard...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Metric title="Total Sales Today" value={`₹ ${Number(data?.metrics?.total_sales_today || 0).toFixed(2)}`} />
        <Metric title="Current Stock Level" value={Number(data?.metrics?.current_stock_level || 0)} />
        <Metric title="Pending Orders" value={Number(data?.metrics?.pending_orders || 0)} />
      </div>

      <div className="flex gap-3 mb-6">
        <Link className="btn" to="/purchases">Go to Purchase</Link>
        <Link className="btn" to="/sales">Go to Sales</Link>
        <Link className="btn" to="/products">Go to Inventory</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Sales Trend">
          <Line data={salesTrendChart} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </Card>
        <Card title="Low/Current Stock by Product">
          <Bar data={lowStockChart} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

