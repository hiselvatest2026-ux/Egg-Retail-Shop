import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';

const classNames = (...classes) => classes.filter(Boolean).join(' ');

const Dropdown = ({ value, onChange, options, placeholder = 'Select', renderLabel, disabled = false }) => {
  const selected = options.find(opt => String(opt.value) === String(value));
  const label = selected ? (renderLabel ? renderLabel(selected) : selected.label) : placeholder;
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      {({ open }) => (
        <div className="relative ui-dropdown" style={{minWidth:0, width:'100%'}}>
          <Listbox.Button className="input w-full flex items-center justify-between" style={{textAlign:'left', height:42, width:'100%'}}>
            <span className={classNames(!selected && 'text-[#9fb0c2]')}>{label}</span>
            <span aria-hidden className="ml-2">▾</span>
          </Listbox.Button>
          <Transition as={Fragment} show={open} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#3A3A4C] bg-[#2A2A3C] focus:outline-none shadow-xl" style={{left:0, right:0, width:'100%', maxWidth:'100%'}}>
              {options.length === 0 && (
                <div className="px-3 py-2 text-sm text-[#cbd5e1]">No options</div>
              )}
              {options.map(opt => (
                <Listbox.Option
                  key={opt.value}
                  value={opt.value}
                  className={({ active, selected }) => classNames(
                    'cursor-pointer px-3 py-2 text-white',
                    'min-h-[44px]',
                    active || selected ? 'bg-[#3A3A4C]' : 'bg-transparent'
                  )}
                >
                  {renderLabel ? renderLabel(opt) : opt.label}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
};

export default Dropdown;

