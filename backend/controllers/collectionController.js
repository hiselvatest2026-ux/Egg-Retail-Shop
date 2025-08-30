const pool = require('../models/db');

exports.creditCollection = async (req, res) => {
  try {
    const { start, end } = req.query;
    const params = [];
    const range = start && end ? `WHERE s.sale_date >= TO_DATE($1,'YYYY-MM-DD') AND s.sale_date <= TO_DATE($2,'YYYY-MM-DD')` : '';
    if (start && end) { params.push(start, end); }
    const r = await pool.query(`
      WITH pay AS (
        SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id
      ),
      inv AS (
        SELECT s.id, s.sale_date, s.customer_id, s.total, COALESCE(p.paid,0) AS paid, (COALESCE(s.total,0)-COALESCE(p.paid,0)) AS balance
        FROM sales s LEFT JOIN pay p ON p.invoice_id = s.id
        ${range}
      )
      SELECT i.id AS invoice_id, i.sale_date, c.id AS customer_id, COALESCE(c.customer_code, 'C' || LPAD(CAST(c.id AS TEXT), 6, '0')) AS customer_code,
             c.name AS customer_name, i.total, i.paid, i.balance
      FROM inv i JOIN customers c ON c.id=i.customer_id
      WHERE i.balance > 0 AND COALESCE((SELECT sale_type FROM sales WHERE id=i.id),'Cash')='Credit'
      ORDER BY i.sale_date DESC, i.id DESC
    `, params);
    const rows = r.rows.map(x=>({ ...x, total: Number(x.total||0), paid: Number(x.paid||0), balance: Number(x.balance||0) }));
    const kpis = {
      total_outstanding: rows.reduce((s,x)=>s+x.balance,0),
      overdue_30: 0,
      due_today: 0
    };
    res.json({ kpis, rows });
  } catch (e) { res.status(500).send(e.message); }
};

exports.routeCollection = async (req, res) => {
  try {
    const { start, end } = req.query;
    const params = [];
    const range = start && end ? `WHERE s.sale_date >= TO_DATE($1,'YYYY-MM-DD') AND s.sale_date <= TO_DATE($2,'YYYY-MM-DD')` : '';
    if (start && end) { params.push(start, end); }
    const r = await pool.query(`
      WITH pay AS (
        SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id
      ),
      inv AS (
        SELECT s.id, s.sale_date, s.route_trip_id, s.total, COALESCE(p.paid,0) AS paid,
               COALESCE((SELECT sale_type FROM sales WHERE id=s.id),'Cash') AS sale_type
        FROM sales s LEFT JOIN pay p ON p.invoice_id = s.id
        ${range}
      )
      SELECT rt.id AS route_trip_id, rt.service_date, COALESCE(rt.route_name, r.route_name) AS route_name, COALESCE(rt.vehicle_number, r.vehicle_number) AS vehicle_number,
             SUM(CASE WHEN i.sale_type='Cash' THEN i.total ELSE 0 END) AS cash_sales,
             SUM(CASE WHEN i.sale_type='Credit' THEN i.total ELSE 0 END) AS credit_issued,
             SUM(i.paid) AS credit_collected
      FROM inv i LEFT JOIN route_trips rt ON rt.id=i.route_trip_id LEFT JOIN routes r ON r.id=rt.route_id
      GROUP BY rt.id, rt.service_date, r.route_name, rt.route_name, r.vehicle_number, rt.vehicle_number
      ORDER BY rt.service_date DESC, route_trip_id DESC
    `, params);
    const routes = r.rows.map(x=>({ ...x, cash_sales:Number(x.cash_sales||0), credit_issued:Number(x.credit_issued||0), credit_collected:Number(x.credit_collected||0) }));
    const kpis = {
      routes_count: routes.length,
      cash_collected: routes.reduce((s,x)=>s+x.cash_sales,0),
      credit_issued: routes.reduce((s,x)=>s+x.credit_issued,0),
      credit_collected: routes.reduce((s,x)=>s+x.credit_collected,0)
    };
    res.json({ kpis, routes });
  } catch (e) { res.status(500).send(e.message); }
};

exports.walkinCollection = async (req, res) => {
  try {
    const { start, end } = req.query;
    const params = [];
    const range = start && end ? `WHERE s.sale_date >= TO_DATE($1,'YYYY-MM-DD') AND s.sale_date <= TO_DATE($2,'YYYY-MM-DD')` : '';
    if (start && end) { params.push(start, end); }
    const r = await pool.query(`
      WITH pay AS (
        SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id
      )
      SELECT s.id AS invoice_id, s.sale_date, s.total, COALESCE(p.paid,0) AS paid,
             COALESCE((SELECT sale_type FROM sales WHERE id=s.id),'Cash') AS sale_type
      FROM sales s LEFT JOIN pay p ON p.invoice_id=s.id
      ${range}
      AND s.category='Walk-in'
      ORDER BY s.sale_date DESC, s.id DESC
    `, params);
    const rows = r.rows.map(x=>({ ...x, total:Number(x.total||0), paid:Number(x.paid||0), balance:Number(x.total||0)-Number(x.paid||0) }));
    const kpis = {
      walkin_cash_collected: rows.reduce((s,x)=>s + (x.sale_type==='Cash'? x.total : 0), 0),
      walkin_credit_issued: rows.reduce((s,x)=>s + (x.sale_type==='Credit'? x.total : 0), 0),
      walkin_credit_collected: rows.reduce((s,x)=>s + (x.sale_type==='Credit'? x.paid : 0), 0)
    };
    res.json({ kpis, rows });
  } catch (e) { res.status(500).send(e.message); }
};

exports.totalCollection = async (req, res) => {
  try {
    const { start, end } = req.query;
    const params = [];
    const range = start && end ? `WHERE s.sale_date >= TO_DATE($1,'YYYY-MM-DD') AND s.sale_date <= TO_DATE($2,'YYYY-MM-DD')` : '';
    if (start && end) { params.push(start, end); }
    const r = await pool.query(`
      WITH pay AS (
        SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id
      )
      SELECT SUM(CASE WHEN s.sale_type='Cash' THEN s.total ELSE 0 END) AS cash_sales,
             SUM(CASE WHEN s.sale_type='Credit' THEN s.total ELSE 0 END) AS credit_issued,
             SUM(COALESCE(p.paid,0)) AS credit_collected
      FROM sales s LEFT JOIN pay p ON p.invoice_id=s.id
      ${range}
    `, params);
    const row = r.rows[0] || {};
    const total_cash = Number(row.cash_sales||0);
    const total_credit_issued = Number(row.credit_issued||0);
    const total_credit_collected = Number(row.credit_collected||0);
    res.json({ kpis: { total_cash, total_credit_issued, total_credit_collected, total_collection: total_cash + total_credit_collected } });
  } catch (e) { res.status(500).send(e.message); }
};

