const pool = require('../models/db');

exports.getSummary = async (req, res) => {
  try {
    const locHeader = req.headers['x-shop-id'];
    const locId = locHeader ? Number(locHeader) : null;
    const condSalesItems = locId ? 'WHERE si.location_id = $1' : '';
    const condPurchItems = locId ? 'WHERE pi.location_id = $1' : '';
    const condSalesToday = locId ? 'AND si.location_id = $1' : '';
    const params = locId ? [locId] : [];

    const [salesTodayRes, pendingOrdersRes, salesTrendRes, stockPerProductRes] = await Promise.all([
      // Compute today's sales from sale_items (sum of quantity*price) for sales with today's date
      pool.query(
        `SELECT COALESCE(SUM(si.quantity*si.price),0) AS total_sales_today
         FROM sale_items si JOIN sales s ON s.id=si.sale_id
         WHERE s.sale_date::date = CURRENT_DATE ${condSalesToday}`,
        params
      ),
      // Pending invoices: compute total from items per sale, compare with payments
      pool.query(
        `WITH items_total AS (
           SELECT si.sale_id, SUM(si.quantity*si.price) AS total
           FROM sale_items si
           ${condSalesItems}
           GROUP BY si.sale_id
         ),
         paid AS (
           SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id
         )
         SELECT COUNT(*)::int AS pending_invoices
         FROM sales s
         LEFT JOIN items_total it ON it.sale_id = s.id
         LEFT JOIN paid p ON p.invoice_id = s.id
         WHERE (COALESCE(it.total, COALESCE(s.total,0)) - COALESCE(p.paid,0)) > 0`,
        params
      ),
      // 7-day trend from items
      pool.query(
        `WITH items_by_day AS (
           SELECT s.sale_date::date AS day, SUM(si.quantity*si.price) AS total
           FROM sale_items si JOIN sales s ON s.id=si.sale_id
           WHERE s.sale_date >= CURRENT_DATE - INTERVAL '6 days' ${condSalesToday}
           GROUP BY s.sale_date::date
         )
         SELECT day, COALESCE(total,0) AS total
         FROM items_by_day
         ORDER BY day`,
        params
      ),
      // Current stock per product (purchases - sales), scoped by location if provided
      pool.query(
        `WITH purchase_qty AS (
           SELECT product_id, SUM(quantity) AS qty FROM purchase_items pi ${condPurchItems} GROUP BY product_id
         ),
         sales_qty AS (
           SELECT product_id, SUM(quantity) AS qty FROM sale_items si ${condSalesItems} GROUP BY product_id
         )
         SELECT p.id AS product_id, p.name, COALESCE(pq.qty, 0) - COALESCE(sq.qty, 0) AS stock
         FROM products p
         LEFT JOIN purchase_qty pq ON pq.product_id = p.id
         LEFT JOIN sales_qty sq ON sq.product_id = p.id
         ORDER BY stock ASC, p.name ASC
         LIMIT 10`,
        params
      )
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

