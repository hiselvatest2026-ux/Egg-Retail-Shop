import React from 'react';
import Card from '../components/Card';

const TemplateCard = ({ name, desc }) => (
  <div className="card" style={{borderStyle:'dashed'}}>
    <div className="card-body">
      <div style={{fontWeight:700}}>{name}</div>
      <div style={{color:'#475569', marginTop:4, fontSize:13}}>{desc}</div>
      <div className="btn-group" style={{marginTop:12}}>
        <button className="btn">Preview</button>
        <button className="btn secondary">Set Default</button>
      </div>
    </div>
  </div>
);

const InvoicePrinting = () => (
  <div className="page">
    <div className="page-header">
      <div>
        <h1 className="page-title">Invoice Printing</h1>
        <p className="page-subtitle">Choose a template and print invoices</p>
      </div>
    </div>
    <Card title="Templates">
      <div className="stat-grid">
        <TemplateCard name="Classic" desc="Clean, compact layout with logo and totals" />
        <TemplateCard name="Modern" desc="Bold headings, colored accents, item notes" />
        <TemplateCard name="Thermal" desc="58/80mm printer friendly minimal design" />
        <TemplateCard name="Tax Invoice" desc="GST fields and invoice summary table" />
      </div>
    </Card>
  </div>
);

export default InvoicePrinting;

