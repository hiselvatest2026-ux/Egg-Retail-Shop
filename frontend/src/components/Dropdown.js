import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';

const classNames = (...classes) => classes.filter(Boolean).join(' ');

const ScrollOnOpen = ({ active, btnRef }) => {
  useEffect(() => {
    if (active) {
      try { btnRef.current?.scrollIntoView({ behavior:'smooth', block:'center' }); } catch(_){ }
    }
  }, [active, btnRef]);
  return null;
};

const Dropdown = ({ value, onChange, options, placeholder = 'Select', renderLabel, disabled = false, searchable = false }) => {
  const selected = options.find(opt => String(opt.value) === String(value));
  const label = selected ? (renderLabel ? renderLabel(selected) : selected.label) : placeholder;
  const btnRef = useRef(null);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!searchable || !query) return options;
    const q = query.toLowerCase();
    return options.filter(opt => String(opt.label || '').toLowerCase().includes(q));
  }, [options, searchable, query]);
  const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false;
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      {({ open }) => (
        <div className="relative ui-dropdown" style={{minWidth:0}}>
          <Listbox.Button ref={btnRef} className="input w-full flex items-center justify-between" style={{textAlign:'left', height:42}}>
            <span className={classNames(!selected && 'text-[#9fb0c2]')}>{label}</span>
            <span aria-hidden className="ml-2">▾</span>
          </Listbox.Button>
          <Transition as={Fragment} show={open} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div>
              {open && isMobile && (
                <div style={{position:'fixed', inset:0, zIndex:49}} onClick={(e)=>{ /* click outside to close via headlessui */ }} />
              )}
              <Listbox.Options
                className={classNames(
                  isMobile
                    ? 'fixed inset-x-0 bottom-0 z-50 max-h-[60vh] w-full rounded-t-2xl border border-[#3A3A4C] bg-[#2A2A3C] shadow-2xl p-2'
                    : 'absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[#3A3A4C] bg-[#2A2A3C] shadow-xl',
                  'focus:outline-none'
                )}
              >
                {isMobile && (
                  <div style={{display:'flex', flexDirection:'column', gap:8, padding:4}}>
                    <div style={{width:36, height:4, borderRadius:4, background:'#3A3A4C', alignSelf:'center', marginBottom:6}} />
                    {searchable && (
                      <input className="input" placeholder="Search..." value={query} onChange={e=>setQuery(e.target.value)} />
                    )}
                  </div>
                )}
                {filtered.length === 0 && (
                  <div className="px-3 py-2 text-sm text-[#cbd5e1]">No options</div>
                )}
                {filtered.map(opt => (
                  <Listbox.Option
                    key={opt.value}
                    value={opt.value}
                    className={({ active, selected }) => classNames(
                      'cursor-pointer px-3 py-3 text-white',
                      'min-h-[48px]',
                      active || selected ? 'bg-[#3A3A4C]' : 'bg-transparent'
                    )}
                  >
                    {renderLabel ? renderLabel(opt) : opt.label}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Transition>
          <ScrollOnOpen active={open && isMobile} btnRef={btnRef} />
        </div>
      )}
    </Listbox>
  );
};

export default Dropdown;

