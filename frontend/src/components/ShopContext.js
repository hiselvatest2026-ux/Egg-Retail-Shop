import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getLocations } from '../api/api';

const ShopContext = createContext({ currentShop: null, shops: [], setShop: () => {} });

export const ShopProvider = ({ children }) => {
  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);

  useEffect(() => {
    (async()=>{
      try {
        const res = await getLocations();
        const list = res.data || [];
        setShops(list);
        let saved = typeof window !== 'undefined' ? window.localStorage.getItem('currentShopId') : null;
        // Allow deep link via ?shop_id= or ?shop=
        if (typeof window !== 'undefined') {
          try {
            const params = new URLSearchParams(window.location.search);
            const qId = params.get('shop_id');
            const qName = params.get('shop');
            if (qId) saved = String(qId);
            else if (qName) {
              const byName = list.find(s => String(s.name||'').toLowerCase() === String(qName).toLowerCase());
              if (byName) saved = String(byName.id);
            }
          } catch(_) {}
        }
        const initial = list.find(s => String(s.id) === String(saved)) || list[0] || null;
        if (initial) {
          setCurrentShop(initial);
          if (typeof window !== 'undefined') window.localStorage.setItem('currentShopId', String(initial.id));
        }
      } catch(_) {}
    })();
  }, []);

  const setShop = (shop) => {
    setCurrentShop(shop);
    if (typeof window !== 'undefined') window.localStorage.setItem('currentShopId', shop ? String(shop.id) : '');
  };

  const value = useMemo(() => ({ currentShop, shops, setShop }), [currentShop, shops]);
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => useContext(ShopContext);

