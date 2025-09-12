import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';

const classNames = (...classes) => classes.filter(Boolean).join(' ');

const Dropdown = ({ value, onChange, options, placeholder = 'Select', renderLabel, disabled = false, mobileFullScreen = false }) => {
  const selected = options.find(opt => String(opt.value) === String(value));
  const label = selected ? (renderLabel ? renderLabel(selected) : selected.label) : placeholder;
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      {({ open }) => (
        <div className="relative ui-dropdown" style={{minWidth:0}}>
          <Listbox.Button className="input w-full flex items-center justify-between" style={{textAlign:'left', height:42}}>
            <span className={classNames(!selected && 'text-[#9fb0c2]')}>{label}</span>
            <span aria-hidden className="ml-2">▾</span>
          </Listbox.Button>
          <Transition as={Fragment} show={open} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className={classNames(
              mobileFullScreen ? 'fixed inset-x-0 bottom-0 z-50 max-h-[65vh] rounded-t-lg border-t border-[#3A3A4C] bg-[#2A2A3C] shadow-2xl' : 'absolute z-50 mt-1 max-h-60 w-full rounded-lg border border-[#3A3A4C] bg-[#2A2A3C] shadow-xl',
              'overflow-y-auto focus:outline-none'
            )}>
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

