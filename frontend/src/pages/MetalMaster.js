import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { getMetals, createMetal, updateMetal, deleteMetal } from '../api/api';

const MetalMaster = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ part_code:'', metal_type:'Egg', gst_percent:'0', description:'' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async ()=>{ const r = await getMetals(); setRows(r.data||[]); };
  useEffect(()=>{ load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    console.log('Metal form submitted:', form);
    setError(''); setSuccess('');
    if (!form.metal_type || !form.gst_percent) { setError('Material Type and GST % are required.'); return; }
    try {
      if (editing) {
        console.log('Updating metal:', editing, { metal_type: form.metal_type, description: form.description });
        await updateMetal(editing, { metal_type: form.metal_type, description: form.description });
        setSuccess('Material updated. (GST % not editable)');
      } else {
        console.log('Creating metal:', { metal_type: form.metal_type, gst_percent: Number(form.gst_percent), description: form.description });
        const result = await createMetal({ metal_type: form.metal_type, gst_percent: Number(form.gst_percent), description: form.description });
        console.log('Create metal result:', result);
        setSuccess('Material created.');
      }
      setForm({ part_code:'', metal_type:'Egg', gst_percent:'0', description:'' });
      setEditing(null);
      await load();
    } catch (e) { 
      console.error('Error in metal handleSubmit:', e);
      setError('Save failed.'); 
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Material Master (GST)</h1>
          <p className="page-subtitle">Define GST % per material; fixed at sale time</p>
        </div>
      </div>

      <Card title={editing ? 'Edit Material' : 'Add Material'}>
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(5, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Material Code</label>
            <input className="input" value={form.part_code} disabled readOnly placeholder="Auto-generated (MCodexxxxx)" />
          </div>
          <div className="input-group">
            <label>Material Type</label>
            <select
              className="input"
              value={form.metal_type}
              onChange={e=>{
                const nextType = e.target.value;
                const mappedGst = nextType === 'Panner' ? '5' : '0';
                setForm({...form, metal_type: nextType, gst_percent: mappedGst});
              }}
            >
              <option value="Egg">Egg</option>
              <option value="Panner">Panner</option>
            </select>
          </div>
          <div className="input-group">
            <label>GST %</label>
            <select className="input" value={form.gst_percent} disabled>
              <option value="0">0</option>
              <option value="5">5</option>
            </select>
          </div>
          <div className="input-group">
            <label>Material Description</label>
            <input className="input" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit" onClick={() => console.log('Metal button clicked!')}>{editing ? 'Update' : 'Add'}</button>
            {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ part_code:'', metal_type:'', gst_percent:'', description:'' }); }}>Cancel</button>}
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <div style={{height:12}} />

      <Card title="Material">
        <table className="table table-hover">
          <thead><tr><th>#</th><th>Material Code</th><th>Material Type</th><th>GST %</th><th>Material Description</th><th>Actions</th></tr></thead>
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
                    <button className="btn btn-sm" onClick={()=>{ setEditing(r.id); setForm({ part_code:r.part_code, metal_type:r.metal_type, gst_percent:String(r.gst_percent), description:r.description||'' }); }}>Edit</button>
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

