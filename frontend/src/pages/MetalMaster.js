import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import { getMetals, createMetal, updateMetal, deleteMetal } from '../api/api';

const MetalMaster = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ part_code:'', metal_type:'Egg', gst_percent:'0', description:'', shelf_life:'' });
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
        console.log('Updating metal:', editing, { metal_type: form.metal_type, description: form.description, shelf_life: form.shelf_life });
        await updateMetal(editing, { metal_type: form.metal_type, description: form.description, shelf_life: form.shelf_life });
        setSuccess('Material updated. (GST % not editable)');
      } else {
        console.log('Creating metal:', { metal_type: form.metal_type, gst_percent: Number(form.gst_percent), description: form.description, shelf_life: form.shelf_life });
        const result = await createMetal({ metal_type: form.metal_type, gst_percent: Number(form.gst_percent), description: form.description, shelf_life: form.shelf_life });
        console.log('Create metal result:', result);
        setSuccess('Material created.');
      }
      setForm({ part_code:'', metal_type:'Egg', gst_percent:'0', description:'', shelf_life:'' });
      setEditing(null);
      await load();
    } catch (e) { 
      console.error('Error in metal handleSubmit:', e);
      setError('Save failed.'); 
    }
  };

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const visibleRows = rows.slice(0, page * pageSize);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Material Master (GST)</h1>
          <p className="page-subtitle">Define GST % per material; fixed at sale time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title={editing ? 'Edit Material' : 'Add Material'}>
        <form onSubmit={handleSubmit} className="form-grid" style={{gridTemplateColumns:'repeat(6, minmax(0,1fr))'}}>
          <div className="input-group">
            <label>Material Code</label>
            <input className="input" value={form.part_code} disabled readOnly placeholder="Auto-generated (Mxxxxx)" />
          </div>
          <div className="input-group" style={{overflow:'visible'}}>
            <label>Material Type</label>
            <Dropdown
              value={form.metal_type}
              onChange={(nextType)=>{
                const mappedGst = '0';
                setForm({...form, metal_type: nextType, gst_percent: mappedGst});
              }}
              options={[{value:'Egg',label:'Egg'}]}
            />
          </div>
          <div className="input-group">
            <label>GST %</label>
            <input className="input" value={form.gst_percent} disabled readOnly />
          </div>
          <div className="input-group">
            <label>Material Description</label>
            <input className="input" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          </div>
          <div className="input-group">
            <label>Shelf Life</label>
            <input className="input" title="Eg.. 12 days" placeholder="Eg.. 12 days" value={form.shelf_life} onChange={e=>setForm({...form, shelf_life:e.target.value})} />
          </div>
          <div className="actions-row">
            <button className="btn" type="submit" onClick={() => console.log('Metal button clicked!')}>{editing ? 'Update' : 'Add'}</button>
            {editing && <button type="button" className="btn secondary" onClick={()=>{ setEditing(null); setForm({ part_code:'', metal_type:'', gst_percent:'', description:'', shelf_life:'' }); }}>Cancel</button>}
          </div>
          {error && <div className="form-help" style={{gridColumn:'1/-1'}}>{error}</div>}
          {success && <div className="toast" style={{gridColumn:'1/-1'}}>{success}</div>}
        </form>
      </Card>

      <div style={{height:12}} />

      <Card title="Material">
        <table className="table table-hover">
          <thead><tr><th>#</th><th>Material Code</th><th>Material Type</th><th>GST %</th><th>Material Description</th><th>Shelf Life</th><th>Actions</th></tr></thead>
          <tbody>
            {visibleRows.map(r => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>{r.part_code}</td>
                <td>{r.metal_type}</td>
                <td>{Number(r.gst_percent).toFixed(2)}</td>
                <td>{r.description || '-'}</td>
                <td>{r.shelf_life || '-'}</td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-sm" onClick={()=>{ setEditing(r.id); setForm({ part_code:r.part_code, metal_type:r.metal_type, gst_percent:String(r.gst_percent), description:r.description||'', shelf_life:r.shelf_life||'' }); }}>Edit</button>
                    <button className="btn danger btn-sm" onClick={async()=>{ await deleteMetal(r.id); await load(); }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Mobile cards */}
        <div className="block sm:hidden">
          {visibleRows.map(r => (
            <div key={r.id} className="card" style={{marginTop:12}}>
              <div className="card-body">
                <div className="card-title" style={{display:'flex', justifyContent:'space-between'}}>
                  <span>Material #{r.id}</span>
                </div>
                <div className="data-pairs">
                  <div className="pair"><strong>Code</strong><div>{r.part_code}</div></div>
                  <div className="pair"><strong>Type</strong><div>{r.metal_type}</div></div>
                  <div className="pair" style={{textAlign:'right'}}><strong>GST %</strong><div>{Number(r.gst_percent).toFixed(2)}</div></div>
                  <div className="pair" style={{flexBasis:'100%'}}><strong>Description</strong><div>{r.description || '-'}</div></div>
                  <div className="pair" style={{flexBasis:'100%'}}><strong>Shelf Life</strong><div>{r.shelf_life || '-'}</div></div>
                </div>
                <div className="btn-group" style={{marginTop:10}}>
                  <button className="btn btn-sm" onClick={()=>{ setEditing(r.id); setForm({ part_code:r.part_code, metal_type:r.metal_type, gst_percent:String(r.gst_percent), description:r.description||'', shelf_life:r.shelf_life||'' }); }}>Edit</button>
                  <button className="btn danger btn-sm" onClick={async()=>{ await deleteMetal(r.id); await load(); }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          {visibleRows.length < rows.length && (
            <div style={{display:'flex', justifyContent:'center', marginTop:12}}>
              <button type="button" className="btn primary w-full" onClick={()=> setPage(p=>p+1)}>Load More</button>
            </div>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
};

export default MetalMaster;

