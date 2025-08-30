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
      `SELECT p.id,
              p.purchase_date,
              p.vendor_id,
              v.vendor_code,
              v.name AS vendor_name,
              p.product_name,
              p.price_per_unit,
              p.quantity,
              p.gst_percent,
              p.total
       FROM purchases p
       LEFT JOIN vendors v ON v.id = p.vendor_id
       ORDER BY p.purchase_date DESC, p.id DESC`
    );
    const headers = ['id','purchase_date','vendor_id','vendor_code','vendor_name','product_name','price_per_unit','quantity','gst_percent','total'];
    sendCsv(res, 'purchases.csv', headers, result.rows);
  } catch (err) { res.status(500).send(err.message); }
};

exports.salesCsv = async (req, res) => {
  try {
    const result = await pool.query(
      `WITH paid AS (
         SELECT invoice_id, SUM(amount) AS paid
         FROM payments
         GROUP BY invoice_id
       )
       SELECT s.id,
              s.sale_date,
              s.customer_id,
              c.name AS customer_name,
              COALESCE(s.product_name, s.egg_type) AS product_name,
              COALESCE(s.category, 'Retail') AS category,
              COALESCE(s.sale_type, 'Cash') AS sale_type,
              s.payment_method,
              s.total,
              COALESCE(p.paid,0) AS paid,
              (COALESCE(s.total,0) - COALESCE(p.paid,0)) AS balance,
              rt.route_name,
              rt.vehicle_number
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       LEFT JOIN paid p ON p.invoice_id = s.id
       LEFT JOIN route_trips rt ON rt.id = s.route_trip_id
       ORDER BY s.sale_date DESC, s.id DESC`
    );
    const headers = ['id','sale_date','customer_id','customer_name','product_name','category','sale_type','payment_method','total','paid','balance','route_name','vehicle_number'];
    sendCsv(res, 'sales.csv', headers, result.rows);
  } catch (err) { res.status(500).send(err.message); }
};

exports.collectionsCsv = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id,
              p.payment_date,
              p.customer_id,
              c.name AS customer_name,
              p.invoice_id,
              s.total AS invoice_total,
              p.amount,
              p.payment_mode
       FROM payments p
       LEFT JOIN customers c ON c.id = p.customer_id
       LEFT JOIN sales s ON s.id = p.invoice_id
       ORDER BY p.payment_date DESC, p.id DESC`
    );
    const headers = ['id','payment_date','customer_id','customer_name','invoice_id','invoice_total','amount','payment_mode'];
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
        SELECT pi.product_id, SUM(pi.quantity) AS qty
        FROM purchase_items pi
        JOIN purchases p ON p.id = pi.purchase_id
        WHERE p.purchase_date < ${startExpr}
        GROUP BY pi.product_id
      ),
      opening_sales AS (
        SELECT si.product_id, SUM(si.quantity) AS qty
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.sale_date < ${startExpr}
        GROUP BY si.product_id
      ),
      opening_adj AS (
        SELECT a.product_id, SUM(a.quantity) AS qty
        FROM stock_adjustments a
        WHERE a.created_at < ${startExpr}
        GROUP BY a.product_id
      ),
      period_purchases AS (
        SELECT pi.product_id, SUM(pi.quantity) AS qty
        FROM purchase_items pi
        JOIN purchases p ON p.id = pi.purchase_id
        WHERE p.purchase_date >= ${startExpr} AND p.purchase_date <= ${endExpr}
        GROUP BY pi.product_id
      ),
      period_sales AS (
        SELECT si.product_id, SUM(si.quantity) AS qty
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.sale_date >= ${startExpr} AND s.sale_date <= ${endExpr}
        GROUP BY si.product_id
      ),
      period_adj AS (
        SELECT a.product_id, SUM(a.quantity) AS qty
        FROM stock_adjustments a
        WHERE a.created_at >= ${startExpr} AND a.created_at <= ${endExpr}
        GROUP BY a.product_id
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

