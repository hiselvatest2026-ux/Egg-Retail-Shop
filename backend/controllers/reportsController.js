const pool = require('../models/db');

function sendCsv(res, filename, headers, rows) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const csv = [headers.join(',')]
    .concat(rows.map(r => headers.map(h => escape(r[h])).join(',')))
    .join('\n');
  res.send(csv);
}

exports.purchasesCsv = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.supplier_id, p.egg_type, p.total, p.purchase_date
       FROM purchases p
       ORDER BY p.id DESC`
    );
    const headers = ['id','supplier_id','egg_type','total','purchase_date'];
    sendCsv(res, 'purchases.csv', headers, result.rows);
  } catch (err) { res.status(500).send(err.message); }
};

exports.salesCsv = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.customer_id, s.egg_type, s.total, s.sale_date
       FROM sales s
       ORDER BY s.id DESC`
    );
    const headers = ['id','customer_id','egg_type','total','sale_date'];
    sendCsv(res, 'sales.csv', headers, result.rows);
  } catch (err) { res.status(500).send(err.message); }
};

exports.collectionsCsv = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.customer_id, p.invoice_id, p.amount, p.payment_mode, p.payment_date
       FROM payments p
       ORDER BY p.id DESC`
    );
    const headers = ['id','customer_id','invoice_id','amount','payment_mode','payment_date'];
    sendCsv(res, 'collections.csv', headers, result.rows);
  } catch (err) { res.status(500).send(err.message); }
};

exports.stockCsv = async (req, res) => {
  try {
    const result = await pool.query(`
      WITH purchase_qty AS (
        SELECT product_id, SUM(quantity) AS qty FROM purchase_items GROUP BY product_id
      ),
      sales_qty AS (
        SELECT product_id, SUM(quantity) AS qty FROM sale_items GROUP BY product_id
      )
      SELECT p.id AS product_id, p.name, COALESCE(pq.qty, 0) - COALESCE(sq.qty, 0) AS stock
      FROM products p
      LEFT JOIN purchase_qty pq ON pq.product_id = p.id
      LEFT JOIN sales_qty sq ON sq.product_id = p.id
      ORDER BY p.name ASC
    `);
    const headers = ['product_id','name','stock'];
    sendCsv(res, 'stock.csv', headers, result.rows);
  } catch (err) { res.status(500).send(err.message); }
};

