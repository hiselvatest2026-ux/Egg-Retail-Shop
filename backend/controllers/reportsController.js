const pool = require('../models/db');

function sendCsv(res, filename, headers, rows) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // Prevent CDN/browser caching so MIS "Load" always shows fresh data
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
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
    const { start, end } = req.query;
    const locHeader = req.headers['x-shop-id'];
    const locId = locHeader ? Number(locHeader) : null;
    const allShops = String(req.query.all_shops||'') === '1';
    const locFilterPI = allShops ? '' : (locId ? 'WHERE pi.location_id = $1' : 'WHERE 1=1');
    // Append to existing WHERE clause in header_only; must start with AND when present
    const locFilterPU = allShops ? '' : (locId ? 'AND EXISTS (SELECT 1 FROM purchase_items x WHERE x.purchase_id = pu.id AND x.location_id = $1)' : '');
    const params = allShops ? [] : (locId ? [locId] : []);
    const dateRangePI = [];
    if (start) { dateRangePI.push(`(p.purchase_date AT TIME ZONE 'Asia/Kolkata')::date >= TO_DATE($${params.length+dateRangePI.length+1}, 'YYYY-MM-DD')`); params.push(start); }
    if (end) { dateRangePI.push(`(p.purchase_date AT TIME ZONE 'Asia/Kolkata')::date <= TO_DATE($${params.length+dateRangePI.length+1}, 'YYYY-MM-DD')`); params.push(end); }
    const dateFilterPI = dateRangePI.length ? ` AND ${dateRangePI.join(' AND ')}` : '';
    const dateRangePU = [];
    const params2 = [...(allShops ? [] : (locId ? [locId] : []))];
    if (start) { dateRangePU.push(`(pu.purchase_date AT TIME ZONE 'Asia/Kolkata')::date >= TO_DATE($${params2.length+dateRangePU.length+1}, 'YYYY-MM-DD')`); params2.push(start); }
    if (end) { dateRangePU.push(`(pu.purchase_date AT TIME ZONE 'Asia/Kolkata')::date <= TO_DATE($${params2.length+dateRangePU.length+1}, 'YYYY-MM-DD')`); params2.push(end); }
    const dateFilterPU = dateRangePU.length ? ` AND ${dateRangePU.join(' AND ')}` : '';
    // Prefer item-level details; include fallback rows for header-only purchases with no items
    const result = await pool.query(
      `WITH mm_guess AS (
         SELECT p.id AS product_id,
                CASE
                  WHEN LOWER(p.name) LIKE 'egg%' THEN 'M00001'
                  WHEN LOWER(p.name) LIKE 'paneer%' OR LOWER(p.name) LIKE 'panner%' THEN 'M00002'
                  ELSE NULL
                END AS part_code
         FROM products p
       ),
       item_rows AS (
         SELECT pu.id AS id,
                to_char((pu.purchase_date AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM-DD HH24:MI:SS') AS purchase_date,
                pu.vendor_id,
                v.vendor_code,
                v.name AS vendor_name,
                COALESCE(mm.metal_type, pr.name, '-') AS material_type,
                pi.price AS price_per_unit,
                pi.quantity AS quantity,
                COALESCE(mm.gst_percent, 0) AS gst_percent,
                pu.type AS type,
                ROUND((CASE WHEN pu.type='Return' THEN -1 ELSE 1 END) * pi.price * pi.quantity * (1 + (COALESCE(mm.gst_percent,0)/100.0)), 2) AS total
         FROM purchase_items pi
         JOIN purchases pu ON pu.id = pi.purchase_id
         JOIN purchases p ON p.id = pi.purchase_id
         LEFT JOIN vendors v ON v.id = pu.vendor_id
         LEFT JOIN products pr ON pr.id = pi.product_id
         LEFT JOIN mm_guess g ON g.product_id = pi.product_id
         LEFT JOIN metal_master mm ON mm.part_code = g.part_code
         ${locFilterPI}${dateFilterPI}
       ),
       header_only AS (
         SELECT pu.id AS id,
                to_char((pu.purchase_date AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM-DD HH24:MI:SS') AS purchase_date,
                pu.vendor_id,
                v.vendor_code,
                v.name AS vendor_name,
                COALESCE(pu.product_name, '-') AS material_type,
                pu.price_per_unit AS price_per_unit,
                pu.quantity AS quantity,
                COALESCE(pu.gst_percent, 0) AS gst_percent,
                pu.type AS type,
                (CASE WHEN pu.type='Return' THEN -1 ELSE 1 END) * COALESCE(pu.total, 0) AS total
         FROM purchases pu
         LEFT JOIN vendors v ON v.id = pu.vendor_id
         WHERE NOT EXISTS (SELECT 1 FROM purchase_items pi WHERE pi.purchase_id = pu.id)
         ${locFilterPU}${dateFilterPU}
       )
       SELECT * FROM item_rows
       UNION ALL
       SELECT * FROM header_only
       ORDER BY purchase_date DESC, id DESC`
    , params);
    const headers = ['id','purchase_date','vendor_id','vendor_code','vendor_name','material_type','price_per_unit','quantity','gst_percent','type','total'];
    sendCsv(res, 'purchases.csv', headers, result.rows);
  } catch (err) { res.status(500).send(err.message); }
};

exports.salesCsv = async (req, res) => {
  try {
    const { start, end } = req.query;
    // Treat stored timestamps as UTC and convert to Asia/Kolkata for date grouping and display
    // Build date window using Asia/Kolkata local dates
    const where = [];
    const params = [];
    // Interpret stored sale_date as UTC if it's naive, then convert to Asia/Kolkata for filtering
    if (start) { where.push(`((s.sale_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')::date >= TO_DATE($${params.length+1}, 'YYYY-MM-DD')`); params.push(start); }
    if (end) { where.push(`((s.sale_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')::date <= TO_DATE($${params.length+1}, 'YYYY-MM-DD')`); params.push(end); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await pool.query(
      `WITH paid AS (
         SELECT invoice_id, SUM(amount) AS paid
         FROM payments
         GROUP BY invoice_id
       ),
       mm_guess AS (
         SELECT p.id AS product_id,
                CASE
                  WHEN LOWER(p.name) LIKE 'egg%' THEN 'M00001'
                  WHEN LOWER(p.name) LIKE 'paneer%' OR LOWER(p.name) LIKE 'panner%' THEN 'M00002'
                  ELSE NULL
                END AS part_code
         FROM products p
       ),
       items AS (
         SELECT si.sale_id,
                STRING_AGG(COALESCE(mm.metal_type, p.name, '-'), '; ' ORDER BY si.id) AS material_text
         FROM sale_items si
         JOIN products p ON p.id = si.product_id
         LEFT JOIN mm_guess g ON g.product_id = si.product_id
         LEFT JOIN metal_master mm ON mm.part_code = g.part_code
         GROUP BY si.sale_id
       ),
       item_stats AS (
         SELECT si.sale_id,
                SUM(si.quantity) AS quantity,
                CASE WHEN COUNT(*) = 1 THEN MAX(si.price) ELSE NULL END AS price_per_unit
         FROM sale_items si
         GROUP BY si.sale_id
       ),
       computed AS (
         SELECT sale_id, SUM(quantity * price) AS computed_total
         FROM sale_items
         GROUP BY sale_id
       )
       SELECT s.id,
              to_char(((s.sale_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM-DD HH24:MI:SS') AS sale_date,
              s.customer_id,
              c.name AS customer_name,
              COALESCE(i.material_text, s.egg_type, s.product_name, CASE WHEN ct.computed_total IS NULL AND COALESCE(p.paid,0) > 0 THEN 'Payment Only' ELSE '-' END) AS product_name,
              REPLACE(COALESCE(s.category, c.category, 'Retail'), 'Horecha', 'Horeca') AS category,
              COALESCE(s.sale_type, 'Cash') AS sale_type,
              s.payment_method,
              COALESCE(isum.quantity, NULL) AS quantity,
              COALESCE(isum.price_per_unit, NULL) AS price_per_unit,
              /* Prefer computed total from items; else sale.total; else paid to avoid negative balance */
              COALESCE(ct.computed_total, NULLIF(s.total, 0), COALESCE(p.paid,0), 0) AS total,
              COALESCE(p.paid,0) AS paid,
              (COALESCE(ct.computed_total, NULLIF(s.total, 0), COALESCE(p.paid,0), 0) - COALESCE(p.paid,0)) AS balance
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       LEFT JOIN paid p ON p.invoice_id = s.id
       LEFT JOIN items i ON i.sale_id = s.id
       LEFT JOIN item_stats isum ON isum.sale_id = s.id
       LEFT JOIN computed ct ON ct.sale_id = s.id
       ${whereSql}
       ORDER BY s.sale_date DESC, s.id DESC`,
       params
    );
    const headers = ['id','sale_date','customer_id','customer_name','product_name','category','sale_type','payment_method','quantity','price_per_unit','total','paid','balance'];
    sendCsv(res, 'sales.csv', headers, result.rows);
  } catch (err) { res.status(500).send(err.message); }
};

exports.collectionsCsv = async (req, res) => {
  try {
    const { start, end } = req.query;
    const where = [];
    const params = [];
    if (start) { where.push(`(p.payment_date AT TIME ZONE 'Asia/Kolkata')::date >= TO_DATE($${params.length+1}, 'YYYY-MM-DD')`); params.push(start); }
    if (end) { where.push(`(p.payment_date AT TIME ZONE 'Asia/Kolkata')::date <= TO_DATE($${params.length+1}, 'YYYY-MM-DD')`); params.push(end); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT p.id,
              to_char((p.payment_date AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM-DD HH24:MI:SS') AS payment_date,
              p.customer_id,
              c.name AS customer_name,
              p.invoice_id,
              s.total AS invoice_total,
              p.amount,
              p.payment_mode
       FROM payments p
       LEFT JOIN customers c ON c.id = p.customer_id
       LEFT JOIN sales s ON s.id = p.invoice_id
       ${whereSql}
       ORDER BY p.payment_date DESC, p.id DESC`,
      params
    );
    const headers = ['id','payment_date','customer_id','customer_name','invoice_id','invoice_total','amount','payment_mode'];
    sendCsv(res, 'collections.csv', headers, result.rows);
  } catch (err) { res.status(500).send(err.message); }
};

exports.stockCsv = async (req, res) => {
  try {
    const { start, end, all_shops } = req.query;
    const locHeader = req.headers['x-shop-id'];
    const locId = all_shops === '1' ? null : (locHeader ? Number(locHeader) : null);
    const hasWindow = !!start; // if start provided, use windowed mode; else snapshot-to-date

    const params = [];
    const pushParam = (v) => { params.push(v); return `$${params.length}`; };

    const condPI = locId ? `WHERE pi.location_id = ${pushParam(locId)}` : '';
    const condSI = locId ? `WHERE si.location_id = ${pushParam(locId)}` : '';

    let sql;
    if (!hasWindow) {
      // Snapshot to date: opening from opening_stocks; purchases/sales/adjustments cumulative; closing derived
      sql = `
        WITH all_ids AS (
          SELECT id AS product_id, name FROM products
        ),
        opening AS (
          SELECT os.product_id, SUM(os.quantity) AS qty FROM opening_stocks os GROUP BY os.product_id
        ),
        purchase_qty AS (
          SELECT pi.product_id, SUM(pi.quantity) AS qty FROM purchase_items pi ${condPI} GROUP BY pi.product_id
        ),
        sales_qty AS (
          SELECT si.product_id, SUM(si.quantity) AS qty FROM sale_items si ${condSI} GROUP BY si.product_id
        ),
        adjustments AS (
          SELECT sa.product_id,
                 SUM(CASE WHEN sa.adjustment_type IN ('Wastage','Breakage','Missing') THEN sa.quantity ELSE 0 END) AS neg_qty
          FROM stock_adjustments sa GROUP BY sa.product_id
        )
        SELECT 
          coalesce(ai.product_id, op.product_id, pq.product_id, sq.product_id, adj.product_id) AS product_id,
          coalesce(ai.name, 'Product #' || coalesce(ai.product_id, op.product_id, pq.product_id, sq.product_id, adj.product_id)) AS name,
          COALESCE(op.qty,0) AS opening,
          COALESCE(pq.qty,0) AS purchase,
          COALESCE(sq.qty,0) AS sales,
          COALESCE(adj.neg_qty,0) AS adjustments,
          (COALESCE(op.qty,0) + COALESCE(pq.qty,0) - COALESCE(sq.qty,0) - COALESCE(adj.neg_qty,0)) AS closing
        FROM all_ids ai
        LEFT JOIN opening op ON op.product_id = ai.product_id
        LEFT JOIN purchase_qty pq ON pq.product_id = ai.product_id
        LEFT JOIN sales_qty sq ON sq.product_id = ai.product_id
        LEFT JOIN adjustments adj ON adj.product_id = ai.product_id
        ORDER BY name ASC`;
    } else {
      const startParam = pushParam(start);
      const endParam = pushParam(end || start);
      // Windowed report using provided start/end timestamps (inclusive)
      sql = `
        WITH all_ids AS (
          SELECT id AS product_id, name FROM products
        ),
        opening_purchases AS (
          SELECT pi.product_id, SUM(pi.quantity) AS qty
          FROM purchase_items pi JOIN purchases p ON p.id = pi.purchase_id
          WHERE p.purchase_date < TO_TIMESTAMP(${startParam}, 'YYYY-MM-DD"T"HH24:MI:SS') ${locId ? `AND pi.location_id = ${pushParam(locId)}` : ''}
          GROUP BY pi.product_id
        ),
        opening_sales AS (
          SELECT si.product_id, SUM(si.quantity) AS qty
          FROM sale_items si JOIN sales s ON s.id = si.sale_id
          WHERE s.sale_date < TO_TIMESTAMP(${startParam}, 'YYYY-MM-DD"T"HH24:MI:SS') ${locId ? `AND si.location_id = ${pushParam(locId)}` : ''}
          GROUP BY si.product_id
        ),
        opening_adj AS (
          SELECT a.product_id, SUM(a.quantity) AS qty
          FROM stock_adjustments a
          WHERE a.created_at < TO_TIMESTAMP(${startParam}, 'YYYY-MM-DD"T"HH24:MI:SS')
          GROUP BY a.product_id
        ),
        period_purchases AS (
          SELECT pi.product_id, SUM(pi.quantity) AS qty
          FROM purchase_items pi JOIN purchases p ON p.id = pi.purchase_id
          WHERE p.purchase_date >= TO_TIMESTAMP(${startParam}, 'YYYY-MM-DD"T"HH24:MI:SS')
            AND p.purchase_date <= TO_TIMESTAMP(${endParam}, 'YYYY-MM-DD"T"HH24:MI:SS')
            ${locId ? `AND pi.location_id = ${pushParam(locId)}` : ''}
          GROUP BY pi.product_id
        ),
        period_sales AS (
          SELECT si.product_id, SUM(si.quantity) AS qty
          FROM sale_items si JOIN sales s ON s.id = si.sale_id
          WHERE s.sale_date >= TO_TIMESTAMP(${startParam}, 'YYYY-MM-DD"T"HH24:MI:SS')
            AND s.sale_date <= TO_TIMESTAMP(${endParam}, 'YYYY-MM-DD"T"HH24:MI:SS')
            ${locId ? `AND si.location_id = ${pushParam(locId)}` : ''}
          GROUP BY si.product_id
        ),
        period_adj AS (
          SELECT a.product_id, SUM(a.quantity) AS qty
          FROM stock_adjustments a
          WHERE a.created_at >= TO_TIMESTAMP(${startParam}, 'YYYY-MM-DD"T"HH24:MI:SS')
            AND a.created_at <= TO_TIMESTAMP(${endParam}, 'YYYY-MM-DD"T"HH24:MI:SS')
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
        ORDER BY name ASC`;
    }

    const result = await pool.query(sql, params);
    const headers = ['product_id','name','opening','purchase','sales','adjustments','closing'];
    sendCsv(res, 'stock.csv', headers, result.rows);
  } catch (err) { res.status(500).send(err.message); }
};

