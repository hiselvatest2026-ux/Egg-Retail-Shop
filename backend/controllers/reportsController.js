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
    const { start, end } = req.query;
    // Default period: today
    const startExpr = start ? `TO_TIMESTAMP($1, 'YYYY-MM-DD"T"HH24:MI:SS')` : `DATE_TRUNC('day', NOW())`;
    const endExpr = end ? `TO_TIMESTAMP(${start ? '$2' : '$1'}, 'YYYY-MM-DD"T"HH24:MI:SS')` : `NOW()`;

    const params = [];
    if (start) params.push(start);
    if (end) params.push(end);

    const sql = `
      WITH all_ids AS (
        SELECT id AS product_id, name FROM products
      ),
      opening_purchases AS (
        SELECT product_id, SUM(quantity) AS qty
        FROM purchase_items pi
        JOIN purchases p ON p.id = pi.purchase_id
        WHERE p.purchase_date < ${startExpr}
        GROUP BY product_id
      ),
      opening_sales AS (
        SELECT product_id, SUM(quantity) AS qty
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.sale_date < ${startExpr}
        GROUP BY product_id
      ),
      opening_adj AS (
        SELECT product_id, SUM(quantity) AS qty
        FROM stock_adjustments a
        WHERE a.created_at < ${startExpr}
        GROUP BY product_id
      ),
      period_purchases AS (
        SELECT product_id, SUM(quantity) AS qty
        FROM purchase_items pi
        JOIN purchases p ON p.id = pi.purchase_id
        WHERE p.purchase_date >= ${startExpr} AND p.purchase_date <= ${endExpr}
        GROUP BY product_id
      ),
      period_sales AS (
        SELECT product_id, SUM(quantity) AS qty
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.sale_date >= ${startExpr} AND s.sale_date <= ${endExpr}
        GROUP BY product_id
      ),
      period_adj AS (
        SELECT product_id, SUM(quantity) AS qty
        FROM stock_adjustments a
        WHERE a.created_at >= ${startExpr} AND a.created_at <= ${endExpr}
        GROUP BY product_id
      )
      SELECT 
        coalesce(ai.product_id, op.product_id, os.product_id, oa.product_id, pp.product_id, ps.product_id, pa.product_id) AS product_id,
        coalesce(ai.name, 'Product #' || coalesce(ai.product_id, op.product_id, os.product_id, oa.product_id, pp.product_id, ps.product_id, pa.product_id)) AS name,
        COALESCE(op.qty,0) - COALESCE(os.qty,0) - COALESCE(oa.qty,0) AS opening,
        COALESCE(pp.qty,0) AS purchase,
        COALESCE(ps.qty,0) AS sales,
        COALESCE(pa.qty,0) AS adjustments,
        (COALESCE(op.qty,0) - COALESCE(os.qty,0) - COALESCE(oa.qty,0)) + COALESCE(pp.qty,0) - COALESCE(ps.qty,0) - COALESCE(pa.qty,0) AS closing
      FROM all_ids ai
      FULL OUTER JOIN opening_purchases op ON op.product_id = ai.product_id
      FULL OUTER JOIN opening_sales os ON os.product_id = ai.product_id
      FULL OUTER JOIN opening_adj oa ON oa.product_id = ai.product_id
      FULL OUTER JOIN period_purchases pp ON pp.product_id = ai.product_id
      FULL OUTER JOIN period_sales ps ON ps.product_id = ai.product_id
      FULL OUTER JOIN period_adj pa ON pa.product_id = ai.product_id
      ORDER BY name ASC
    `;

    const result = await pool.query(sql, params);
    const headers = ['product_id','name','opening','purchase','sales','adjustments','closing'];
    sendCsv(res, 'stock.csv', headers, result.rows);
  } catch (err) { res.status(500).send(err.message); }
};

