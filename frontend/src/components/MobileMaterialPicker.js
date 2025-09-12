import React from 'react';

const MobileMaterialPicker = ({ value, options, onChange, placeholder }) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const selected = options?.find(o => String(o.value) === String(value));
  const filtered = React.useMemo(() => {
    const q = String(query || '').toLowerCase();
    if (!q) return options || [];
    return (options || []).filter(o => String(o.label || '').toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div>
      <label className="block" style={{fontSize:12, color:'#b6beca', marginBottom:4}}>{placeholder || 'Material'}</label>
      <button type="button" className="input" onClick={()=>setOpen(true)} style={{textAlign:'left'}}>
        {selected ? selected.label : 'Select material'}
      </button>
      {open && (
        <div>
          <div className="backdrop" onClick={()=>setOpen(false)} />
          <div style={{position:'fixed', left:0, right:0, bottom:0, height:'65vh', background:'#0f1418', borderTopLeftRadius:16, borderTopRightRadius:16, zIndex:1000, boxShadow:'0 -10px 30px rgba(0,0,0,.4)', borderTop:'1px solid #273140'}}>
            <div style={{padding:12, borderBottom:'1px solid #273140', display:'flex', alignItems:'center', gap:8}}>
              <input autoFocus className="input" placeholder="Search material..." value={query} onChange={e=>setQuery(e.target.value)} />
              <button className="btn secondary btn-sm" onClick={()=>setOpen(false)}>Close</button>
            </div>
            <div style={{padding:12, overflowY:'auto', height:'calc(65vh - 68px)'}}>
              {(filtered||[]).map(opt => (
                <div key={String(opt.value)} onClick={()=>{ onChange && onChange(opt.value); setOpen(false); }}
                     style={{padding:'12px 14px', border:'1px solid #2a3040', borderRadius:12, marginBottom:10, cursor:'pointer', background:'#10161b'}}>
                  {opt.label}
                </div>
              ))}
              {filtered && filtered.length === 0 && (
                <div style={{color:'#9fb0c2'}}>No results</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMaterialPicker;

