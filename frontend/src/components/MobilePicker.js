import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const ensurePortalRoot = () => {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById('portal-root');
  if (!el) {
    el = document.createElement('div');
    el.setAttribute('id', 'portal-root');
    document.body.appendChild(el);
  }
  return el;
};

const MobilePicker = ({ open, title = 'Select', options = [], value, onChange, onClose, showSearch = false }) => {
  const [query, setQuery] = useState('');
  const root = ensurePortalRoot();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const filtered = useMemo(() => {
    if (!showSearch || !query) return options;
    const q = query.toLowerCase();
    return options.filter(opt => String(opt.label || '').toLowerCase().includes(q));
  }, [options, showSearch, query]);

  if (!open || !root) return null;

  const pick = (val) => { onChange && onChange(val); onClose && onClose(); };

  return createPortal(
    <div style={{position:'fixed', inset:0, zIndex:1000, display:'flex', flexDirection:'column'}}>
      <div onClick={onClose} style={{flex:1, background:'rgba(0,0,0,0.4)'}} />
      <div style={{background:'#2A2A3C', borderTopLeftRadius:16, borderTopRightRadius:16, padding:'10px 10px calc(12px + env(safe-area-inset-bottom)) 10px', maxHeight:'70vh', overflow:'hidden'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
          <div style={{fontWeight:800}}>{title}</div>
          <button className="btn secondary btn-sm" onClick={onClose}>Close</button>
        </div>
        {showSearch && (
          <div style={{marginBottom:8}}>
            <input className="input" placeholder="Search..." value={query} onChange={e=>setQuery(e.target.value)} />
          </div>
        )}
        <div style={{overflowY:'auto', maxHeight:'54vh', borderTop:'1px solid #3A3A4C'}}>
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-[#cbd5e1]">No options</div>
          )}
          {filtered.map(opt => (
            <div key={opt.value} role="button" onClick={()=>pick(opt.value)}
                 style={{padding:'12px 10px', borderBottom:'1px solid #3A3A4C', background: String(opt.value)===String(value) ? '#3A3A4C' : 'transparent'}}>
              {opt.label}
            </div>
          ))}
        </div>
      </div>
    </div>,
    root
  );
};

export default MobilePicker;

