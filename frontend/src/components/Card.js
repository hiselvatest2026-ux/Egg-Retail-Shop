import React from 'react';

const Card = ({ title, children, actions }) => (
  <div className="bg-white rounded shadow-sm border border-gray-200">
    {title && (
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <div>{actions}</div>
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

export default Card;

