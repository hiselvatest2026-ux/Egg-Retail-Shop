import React, { createContext, useContext, useMemo } from 'react';

const ShopContext = createContext({ currentShop: null, shops: [], setShop: () => {} });

export const ShopProvider = ({ children }) => {
  const value = useMemo(() => ({ currentShop: null, shops: [], setShop: () => {} }), []);
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => useContext(ShopContext);

