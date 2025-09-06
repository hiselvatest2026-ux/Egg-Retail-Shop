import React from 'react';
import { useShop } from './ShopContext';

const ShopChip = () => {
  const { currentShop } = useShop();
  if (!currentShop) return null;
  return (
    <span className="badge" title={`Shop ID: ${currentShop.id}`}>Shop: {currentShop.name || `#${currentShop.id}`}</span>
  );
};

export default ShopChip;

