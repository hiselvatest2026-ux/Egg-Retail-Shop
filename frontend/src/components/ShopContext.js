import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getShops } from '../api/api';

const ShopContext = createContext({ currentShop: null, shops: [], setShop: () => {} });

export const ShopProvider = ({ children }) => {
  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);

  useEffect(() => {
    (async()=>{
      try {
        const res = await getShops();
        const list = res.data || [];
        setShops(list);
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('currentShopId') : null;
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

