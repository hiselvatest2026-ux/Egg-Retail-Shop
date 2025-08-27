const pool = require('../models/db');

exports.getSummary = async (req, res) => {
  try {
    const [salesTodayRes, pendingOrdersRes, salesTrendRes, stockPerProductRes] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(total), 0) AS total_sales_today FROM sales WHERE sale_date::date = CURRENT_DATE"),
      pool.query(`
        SELECT COUNT(*)::int AS pending_invoices
        FROM sales s
        LEFT JOIN (
          SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id
        ) p ON p.invoice_id = s.id
        WHERE (COALESCE(s.total, 0) - COALESCE(p.paid, 0)) > 0
      `),
      pool.query(`
        SELECT sale_date::date AS day, COALESCE(SUM(total), 0) AS total
        FROM sales
        WHERE sale_date >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY day
        ORDER BY day
      `),
      pool.query(`
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
        ORDER BY stock ASC, p.name ASC
        LIMIT 10
      `)
    ]);

    // Compute current stock level as total across products
    const currentStockTotal = stockPerProductRes.rows.reduce((sum, row) => sum + Number(row.stock || 0), 0);

    res.json({
      metrics: {
        total_sales_today: Number(salesTodayRes.rows[0]?.total_sales_today || 0),
        current_stock_level: currentStockTotal,
        pending_orders: Number(pendingOrdersRes.rows[0]?.pending_invoices || 0)
      },
      sales_trend: salesTrendRes.rows.map(r => ({ day: r.day, total: Number(r.total) })),
      low_stock: stockPerProductRes.rows.map(r => ({ product_id: r.product_id, name: r.name, stock: Number(r.stock) }))
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

