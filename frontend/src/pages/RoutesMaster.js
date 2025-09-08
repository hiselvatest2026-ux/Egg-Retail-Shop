import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import { getRoutes, createRoute, updateRoute, deleteRouteApi } from '../api/api';

const RoutesMaster = () => {
  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ route_name:'', truck_no:'', salesman_name:'', mobile:'', area_name:'', pincode:'' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAll = async () => {
    try {
      const r = await getRoutes();
      const rows = (r.data||[]).map(x=>({ id:x.id, route_name: x.route_name, truck_no: x.vehicle_number || '', salesman_name: x.salesman_name || '', mobile: x.mobile || '', area_name: x.area_name || '', pincode: x.pincode || '' }));
      setRoutes(rows);
    } catch (e) { /* ignore */ }
  };
  useEffect(()=>{ fetchAll(); },[]);

  const filtered = useMemo(()=>{
    if (!search) return routes;
    const q = search.toLowerCase();
    return routes.filter(r => Object.values(r).some(v=> String(v||'').toLowerCase().includes(q)));
  }, [routes, search]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.route_name) { setError('Route Name is required'); return; }
    try {
      const payload = { route_name: form.route_name, vehicle_number: form.truck_no, salesman_name: form.salesman_name, mobile: form.mobile, area_name: form.area_name, pincode: form.pincode, active: true };
      if (editing) await updateRoute(editing, payload); else await createRoute(payload);
      setSuccess(editing ? 'Route updated.' : 'Route added.');
      setForm({ route_name:'', truck_no:'', salesman_name:'', mobile:'', area_name:'', pincode:'' }); setEditing(null);
      await fetchAll();
      setTimeout(()=>setSuccess(''),1500);
    } catch (e) { setError('Save failed'); }
  };

  return (
    <div className="page space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Route Master</h1>
          <p className="page-subtitle">Manage routes and delivery details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title={editing ? 'Edit Route' : 'Add Route'}>
          <form onSubmit={handleSubmit} className="form-grid-2">
            <div className="input-group"><label>Route Name</label><input className="input" value={form.route_name} onChange={e=>setForm({...form, route_name:e.target.value})} /></div>
            <div className="input-group"><label>Truck No</label><input className="input" value={form.truck_no} onChange={e=>setForm({...form, truck_no:e.target.value})} /></div>
            <div className="input-group"><label>Sales Man Name</label><input className="input" value={form.salesman_name} onChange={e=>setForm({...form, salesman_name:e.target.value})} /></div>
            <div className="input-group"><label>Mobile No</label><input className="input" value={form.mobile} onChange={e=>setForm({...form, mobile:e.target.value})} inputMode="numeric" /></div>
            <div className="input-group"><label>Area Name</label><input className="input" value={form.area_name} onChange={e=>setForm({...form, area_name:e.target.value})} /></div>
            <div className="input-group"><label>Pin code</label><input className="input" value={form.pincode} onChange={e=>setForm({...form, pincode:e.target.value})} inputMode="numeric" /></div>
            <div className="actions-row" style={{gridColumn:'1/-1', justifyContent:'flex-end'}}>
              <button className="btn primary w-full sm:w-auto" type="submit">{editing ? 'Update' : 'Add'}</button>
              {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ route_name:'', truck_no:'', salesman_name:'', mobile:'', area_name:'', pincode:'' }); }}>Cancel</button>}
            </div>
            {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
            {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
          </form>
        </Card>

        <Card title="Routes">
          <div className="flex items-center gap-3 mb-3" style={{flexWrap:'wrap'}}>
            <input className="input w-full sm:w-72" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
            <div className="btn-group" style={{marginLeft:'auto'}}>
              <button className="btn secondary btn-sm" onClick={fetchAll}>Refresh</button>
              <button className="btn btn-sm" onClick={async()=>{
                try {
                  const samples = [
                    { route_name:'North Zone', truck_no:'TN-01-AB-1234', salesman_name:'Kumar', mobile:'9000000001', area_name:'Anna Nagar', pincode:'600040' },
                    { route_name:'South Zone', truck_no:'TN-02-CD-5678', salesman_name:'Vijay', mobile:'9000000002', area_name:'Velachery', pincode:'600042' },
                    { route_name:'East Belt', truck_no:'TN-03-EF-9012', salesman_name:'Arun', mobile:'9000000003', area_name:'Tambaram', pincode:'600059' }
                  ];
                  for (const r of samples) {
                    await createRoute({ route_name:r.route_name, vehicle_number:r.truck_no, salesman_name:r.salesman_name, mobile:r.mobile, area_name:r.area_name, pincode:r.pincode, active:true });
                  }
                  await fetchAll();
                } catch (_) {}
              }}>Add Sample Routes</button>
            </div>
          </div>
          <div className="hidden sm:block overflow-x-auto">
            <table className="table table-hover table-zebra mt-2">
              <thead><tr><th>#</th><th>Route Name</th><th>Truck No</th><th>Sales Man</th><th>Mobile</th><th>Area</th><th>Pincode</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.route_name}</td>
                    <td>{r.truck_no || '-'}</td>
                    <td>{r.salesman_name || '-'}</td>
                    <td>{r.mobile || '-'}</td>
                    <td>{r.area_name || '-'}</td>
                    <td>{r.pincode || '-'}</td>
                    <td style={{textAlign:'right'}}>
                      <div className="btn-group" style={{justifyContent:'flex-end'}}>
                        <button className="btn icon btn-sm" title="Edit" onClick={()=>{ setEditing(r.id); setForm({ route_name:r.route_name, truck_no:r.truck_no, salesman_name:r.salesman_name, mobile:r.mobile, area_name:r.area_name, pincode:r.pincode }); }}>✏️</button>
                        <button className="btn danger btn-sm" onClick={async()=>{ try { await deleteRouteApi(r.id); await fetchAll(); } catch(e){} }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-2">
            {filtered.map(r => (
              <div key={r.id} className="card">
                <div className="card-body">
                  <div className="data-pairs">
                    <div className="pair"><strong>Route</strong><div>{r.route_name}</div></div>
                    <div className="pair"><strong>Truck</strong><div>{r.truck_no || '-'}</div></div>
                    <div className="pair"><strong>Salesman</strong><div>{r.salesman_name || '-'}</div></div>
                    <div className="pair"><strong>Mobile</strong><div>{r.mobile || '-'}</div></div>
                    <div className="pair"><strong>Area</strong><div>{r.area_name || '-'}</div></div>
                    <div className="pair"><strong>Pincode</strong><div>{r.pincode || '-'}</div></div>
                  </div>
                  <div className="btn-group" style={{marginTop:10, justifyContent:'flex-end'}}>
                    <button className="btn secondary btn-sm" onClick={()=>{ setEditing(r.id); setForm({ route_name:r.route_name, truck_no:r.truck_no, salesman_name:r.salesman_name, mobile:r.mobile, area_name:r.area_name, pincode:r.pincode }); }}>Edit</button>
                    <button className="btn danger btn-sm" onClick={async()=>{ try { await deleteRouteApi(r.id); await fetchAll(); } catch(e){} }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RoutesMaster;

