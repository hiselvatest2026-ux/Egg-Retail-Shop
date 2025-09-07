import React from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { useShop } from './ShopContext';

const ShopSwitcher = () => {
  const { shops, currentShop, setShop } = useShop();
  const filtered = Array.isArray(shops) ? shops.filter(s => !/selva/i.test(String(s.name||''))) : shops;
  if (!filtered || filtered.length <= 1) return null;
  return (
    <div className="relative" style={{minWidth: 180}}>
      <Listbox value={currentShop} onChange={setShop}>
        <Listbox.Button className="input w-full flex items-center justify-between" style={{textAlign:'left'}}>
          <span>{currentShop ? (currentShop.name || `Shop #${currentShop.id}`) : 'Select shop'}</span>
          <span aria-hidden className="ml-2">▾</span>
        </Listbox.Button>
        <Transition>
          <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[#3A3A4C] bg-[#2A2A3C] focus:outline-none shadow-xl">
            {filtered.map(s => (
              <Listbox.Option key={s.id} value={s} className={({active,selected})=>`cursor-pointer px-3 py-2 text-white min-h-[44px] ${active||selected?'bg-[#3A3A4C]':''}`}>
                {s.name || `Shop #${s.id}`}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </Listbox>
    </div>
  );
};

export default ShopSwitcher;

