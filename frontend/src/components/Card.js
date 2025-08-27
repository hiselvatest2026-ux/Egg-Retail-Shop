import React from 'react';

const Card = ({ title, children, actions }) => (
  <div className="card">
    {title && (
      <div className="card-header">
        <div className="card-title">{title}</div>
        <div className="card-actions">{actions}</div>
      </div>
    )}
    <div className="card-body">{children}</div>
  </div>
);

export default Card;

