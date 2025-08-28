import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { getMetals, createMetal, updateMetal, deleteMetal } from '../api/api';

const MetalMaster = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ part_code:'', metal_type:'', gst_percent:'', description:'' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async ()=>{ const r = await getMetals(); setRows(r.data||[]); };
  useEffect(()=>{ load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.part_code || !form.metal_type || !form.gst_percent) { setError('Part Code, Metal Type and GST % are required.'); return; }
    try {
      if (editing) {
        await updateMetal(editing, { metal_type: form.metal_type, description: form.description });
        setSuccess('Metal updated. (GST % not editable)');
      } else {
        await createMetal({ ...form, gst_percent: Number(form.gst_percent) });
        setSuccess('Metal created.');
      }
      setForm({ part_code:'', metal_type:'', gst_percent:'', description:'' });
      setEditing(null);
      await load();
    } catch (e) { setError('Save failed.'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Metal Master (GST)</h1>
          <p className="page-subtitle">Define GST % per metal; fixed at sale time</p>
        </div>
      </div>

      <Card title={editing ? 'Edit Metal' : 'Add Metal'}>
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(5, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Part Code</label>
            <input className="input" value={form.part_code} onChange={e=>setForm({...form, part_code:e.target.value})} disabled={!!editing} />
          </div>
          <div className="input-group">
            <label>Metal Type</label>
            <input className="input" value={form.metal_type} onChange={e=>setForm({...form, metal_type:e.target.value})} />
          </div>
          <div className="input-group">
            <label>GST %</label>
            <input className="input" value={form.gst_percent} onChange={e=>setForm({...form, gst_percent:e.target.value})} inputMode="decimal" disabled={!!editing} />
          </div>
          <div className="input-group">
            <label>Description</label>
            <input className="input" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit">{editing ? 'Update' : 'Add'}</button>
            {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ part_code:'', metal_type:'', gst_percent:'', description:'' }); }}>Cancel</button>}
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <div style={{height:12}} />

      <Card title="Metals">
        <table className="table table-hover">
          <thead><tr><th>#</th><th>Part Code</th><th>Metal Type</th><th>GST %</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>{r.part_code}</td>
                <td>{r.metal_type}</td>
                <td>{Number(r.gst_percent).toFixed(2)}</td>
                <td>{r.description || '-'}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-sm" onClick={()=>{ setEditing(r.id); setForm({ part_code:r.part_code, metal_type:r.metal_type, gst_percent:r.gst_percent, description:r.description||'' }); }}>Edit</button>
                    <button className="btn danger btn-sm" onClick={async()=>{ await deleteMetal(r.id); await load(); }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default MetalMaster;

