const pool = require('../models/db');

exports.getCreditSummary = async (_req, res) => {
  try {
    const result = await pool.query(`
      WITH pay AS (
        SELECT invoice_id, SUM(amount) AS paid
        FROM payments
        GROUP BY invoice_id
      ),
      due_per_invoice AS (
        SELECT s.id AS invoice_id,
               s.customer_id,
               s.sale_date,
               COALESCE(s.total, 0) - COALESCE(p.paid, 0) AS due
        FROM sales s
        LEFT JOIN pay p ON p.invoice_id = s.id
      ),
      positive_dues AS (
        SELECT * FROM due_per_invoice WHERE due > 0
      ),
      per_customer AS (
        SELECT c.id AS customer_id,
               c.name AS customer_name,
               SUM(d.due) AS total_due,
               SUM(CASE WHEN d.sale_date < NOW() - INTERVAL '30 days' THEN d.due ELSE 0 END) AS overdue_30
        FROM customers c
        JOIN positive_dues d ON d.customer_id = c.id
        GROUP BY c.id, c.name
      )
      SELECT * FROM per_customer ORDER BY total_due DESC, customer_name ASC;
    `);

    const rows = result.rows.map(r => ({
      customer_id: r.customer_id,
      customer_name: r.customer_name,
      total_due: Number(r.total_due || 0),
      overdue_30: Number(r.overdue_30 || 0)
    }));

    const kpis = {
      total_customers_with_dues: rows.length,
      total_outstanding: rows.reduce((s, r) => s + r.total_due, 0),
      total_overdue_30: rows.reduce((s, r) => s + r.overdue_30, 0)
    };

    res.json({ kpis, customers: rows });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

