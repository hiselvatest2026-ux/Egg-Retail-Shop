const pool = require('../models/db');

exports.getSummary = async (req, res) => {
  try {
    const locHeader = req.headers['x-shop-id'];
    const locId = locHeader ? Number(locHeader) : null;
    const { start, end } = req.query || {};
    const condSalesItems = locId ? 'WHERE si.location_id = $1' : '';
    const condPurchItems = locId ? 'WHERE pi.location_id = $1' : '';
    const condSalesToday = locId ? 'AND si.location_id = $1' : '';
    const condPurchToday = locId ? 'AND pi.location_id = $1' : '';
    const params = locId ? [locId] : [];

    const [
      salesTodayRes,
      purchasesTodayRes,
      pendingOrdersRes,
      pendingCollectionsRes,
      salesTrendRes,
      stockPerProductRes,
      stockValueRes,
      recentSalesRes,
      recentPurchasesRes
    ] = await Promise.all([
      // Compute today's sales from sale_items (sum of quantity*price) for sales with today's date
      pool.query(
        `SELECT COALESCE(SUM(si.quantity*si.price),0) AS total_sales_today
         FROM sale_items si JOIN sales s ON s.id=si.sale_id
         WHERE s.sale_date::date = CURRENT_DATE ${condSalesToday}`,
        params
      ),
      // Compute today's purchases from purchase_items
      pool.query(
        `SELECT COALESCE(SUM(pi.quantity*pi.price),0) AS total_purchases_today
         FROM purchase_items pi JOIN purchases p ON p.id=pi.purchase_id
         WHERE p.purchase_date::date = CURRENT_DATE ${condPurchToday}`,
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
      // Pending collections (amount outstanding) for Credit sales
      pool.query(
        `WITH paid AS (
           SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id
         ),
         computed AS (
           SELECT sale_id, SUM(quantity * price) AS total FROM sale_items GROUP BY sale_id
         ),
         inv AS (
           SELECT s.id,
                  COALESCE(c.total, NULLIF(s.total,0), 0) AS total,
                  COALESCE(p.paid,0) AS paid,
                  COALESCE(s.sale_type,'Cash') AS sale_type
           FROM sales s
           LEFT JOIN computed c ON c.sale_id = s.id
           LEFT JOIN paid p ON p.invoice_id = s.id
         )
         SELECT SUM(GREATEST(total - paid, 0))::numeric AS pending_collections
         FROM inv
         WHERE sale_type = 'Credit'`,
        []
      ),
      // Revenue trend (date-ranged if provided, else last 7 days)
      (async ()=>{
        const whereParts = [];
        const p = [];
        if (locId) { whereParts.push(`si.location_id = $${p.length+1}`); p.push(locId); }
        if (start) { whereParts.push(`s.sale_date::date >= TO_DATE($${p.length+1}, 'YYYY-MM-DD')`); p.push(start); }
        if (end) { whereParts.push(`s.sale_date::date <= TO_DATE($${p.length+1}, 'YYYY-MM-DD')`); p.push(end); }
        let where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
        if (!start && !end) {
          // default last 7 days window
          where = `WHERE s.sale_date >= CURRENT_DATE - INTERVAL '6 days' ${locId?`AND si.location_id = $1`:''}`;
          return pool.query(
            `WITH items_by_day AS (
               SELECT s.sale_date::date AS day, SUM(si.quantity*si.price) AS total
               FROM sale_items si JOIN sales s ON s.id=si.sale_id
               ${where}
               GROUP BY s.sale_date::date
             )
             SELECT day, COALESCE(total,0) AS total
             FROM items_by_day
             ORDER BY day`,
            params
          );
        }
        return pool.query(
          `WITH items_by_day AS (
             SELECT s.sale_date::date AS day, SUM(si.quantity*si.price) AS total
             FROM sale_items si JOIN sales s ON s.id=si.sale_id
             ${where}
             GROUP BY s.sale_date::date
           )
           SELECT day, COALESCE(total,0) AS total
           FROM items_by_day
           ORDER BY day`,
          p
        );
      })(),
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
      ),
      // Total stock value = sum(price * (opening + purchases - sales - adjustments))
      pool.query(
        `WITH purchase_qty AS (
           SELECT product_id, SUM(quantity) AS qty FROM purchase_items pi ${condPurchItems} GROUP BY product_id
         ),
         sales_qty AS (
           SELECT product_id, SUM(quantity) AS qty FROM sale_items si ${condSalesItems} GROUP BY product_id
         ),
         adjustments AS (
           SELECT product_id, SUM(quantity) AS qty FROM stock_adjustments WHERE adjustment_type IN ('Missing','Wastage','Breakage') GROUP BY product_id
         ),
         opening AS (
           SELECT product_id, SUM(quantity) AS qty FROM opening_stocks GROUP BY product_id
         )
         SELECT COALESCE(SUM(COALESCE(p.price,0) * (COALESCE(op.qty,0) + COALESCE(pq.qty,0) - COALESCE(sq.qty,0) - COALESCE(adj.qty,0))), 0) AS total_value
         FROM products p
         LEFT JOIN purchase_qty pq ON pq.product_id = p.id
         LEFT JOIN sales_qty sq ON sq.product_id = p.id
         LEFT JOIN adjustments adj ON adj.product_id = p.id
         LEFT JOIN opening op ON op.product_id = p.id`,
        params
      ),
      // Recent sales (latest 5)
      pool.query(
        `WITH paid AS (
           SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id
         ),
         computed AS (
           SELECT sale_id, SUM(quantity*price) AS total FROM sale_items GROUP BY sale_id
         )
         SELECT s.id, s.sale_date, c.name AS customer_name,
                COALESCE(ct.total, NULLIF(s.total,0), 0) AS total,
                COALESCE(p.paid,0) AS paid,
                (COALESCE(ct.total, NULLIF(s.total,0), 0) - COALESCE(p.paid,0)) AS balance
         FROM sales s
         LEFT JOIN customers c ON c.id = s.customer_id
         LEFT JOIN paid p ON p.invoice_id = s.id
         LEFT JOIN computed ct ON ct.sale_id = s.id
         ORDER BY s.sale_date DESC, s.id DESC
         LIMIT 5`,
        []
      ),
      // Recent purchases (latest 5)
      pool.query(
        `WITH items_total AS (
           SELECT pi.purchase_id, SUM(pi.quantity*pi.price) AS total
           FROM purchase_items pi
           ${condPurchItems}
           GROUP BY pi.purchase_id
         )
         SELECT pu.id, pu.purchase_date, v.name AS vendor_name,
                COALESCE(it.total, NULLIF(pu.total,0), 0) AS total
         FROM purchases pu
         LEFT JOIN vendors v ON v.id = pu.vendor_id
         LEFT JOIN items_total it ON it.purchase_id = pu.id
         ORDER BY pu.purchase_date DESC, pu.id DESC
         LIMIT 5`,
        params
      )
    ]);

    // Compute current stock level as total across products
    const currentStockTotal = stockPerProductRes.rows.reduce((sum, row) => sum + Number(row.stock || 0), 0);

    // Build additional trends with date range
    const buildWhere = (tableAlias) => {
      const parts = [];
      const p = [];
      if (locId) { parts.push(`${tableAlias}.location_id = $${p.length+1}`); p.push(locId); }
      if (start) { parts.push(`(s.sale_date AT TIME ZONE 'Asia/Kolkata')::date >= TO_DATE($${p.length+1}, 'YYYY-MM-DD')`); p.push(start); }
      if (end) { parts.push(`(s.sale_date AT TIME ZONE 'Asia/Kolkata')::date <= TO_DATE($${p.length+1}, 'YYYY-MM-DD')`); p.push(end); }
      return { where: parts.length ? `WHERE ${parts.join(' AND ')}` : '', params: p };
    };
    const qtyTrendWhere = buildWhere('si');
    const catWhere = buildWhere('si');
    const [qtyTrendRes, qtyByCatRes, revByCatRes] = await Promise.all([
      pool.query(
        `SELECT s.sale_date::date AS day, COALESCE(SUM(si.quantity),0) AS qty
         FROM sale_items si JOIN sales s ON s.id=si.sale_id
         ${qtyTrendWhere.where}
         GROUP BY s.sale_date::date
         ORDER BY day`,
        qtyTrendWhere.params
      ),
      pool.query(
        `SELECT s.sale_date::date AS day, COALESCE(s.category, c.category, 'Retail') AS category,
                COALESCE(SUM(si.quantity),0) AS qty
         FROM sale_items si
         JOIN sales s ON s.id=si.sale_id
         LEFT JOIN customers c ON c.id = s.customer_id
         ${catWhere.where}
         GROUP BY s.sale_date::date, category
         ORDER BY day, category`,
        catWhere.params
      ),
      pool.query(
        `SELECT s.sale_date::date AS day, COALESCE(s.category, c.category, 'Retail') AS category,
                COALESCE(SUM(si.quantity*si.price),0) AS total
         FROM sale_items si
         JOIN sales s ON s.id=si.sale_id
         LEFT JOIN customers c ON c.id = s.customer_id
         ${catWhere.where}
         GROUP BY s.sale_date::date, category
         ORDER BY day, category`,
        catWhere.params
      )
    ]);

    res.json({
      metrics: {
        total_sales_today: Number(salesTodayRes.rows[0]?.total_sales_today || 0),
        total_purchases_today: Number(purchasesTodayRes.rows[0]?.total_purchases_today || 0),
        current_stock_level: currentStockTotal,
        pending_orders: Number(pendingOrdersRes.rows[0]?.pending_invoices || 0),
        pending_collections: Number(pendingCollectionsRes.rows[0]?.pending_collections || 0),
        total_stock_value: Number(stockValueRes.rows[0]?.total_value || 0)
      },
      sales_trend: salesTrendRes.rows.map(r => ({ day: r.day, total: Number(r.total) })),
      sales_qty_trend: qtyTrendRes.rows.map(r => ({ day: r.day, qty: Number(r.qty||0) })),
      sales_qty_by_category: qtyByCatRes.rows.map(r => ({ day: r.day, category: r.category, qty: Number(r.qty||0) })),
      sales_revenue_by_category: revByCatRes.rows.map(r => ({ day: r.day, category: r.category, total: Number(r.total||0) })),
      low_stock: stockPerProductRes.rows.map(r => ({ product_id: r.product_id, name: r.name, stock: Number(r.stock) })),
      recent_sales: recentSalesRes.rows.map(r => ({
        id: r.id,
        sale_date: r.sale_date,
        customer_name: r.customer_name || '-',
        total: Number(r.total || 0),
        paid: Number(r.paid || 0),
        balance: Number(r.balance || 0)
      })),
      recent_purchases: recentPurchasesRes.rows.map(r => ({
        id: r.id,
        purchase_date: r.purchase_date,
        vendor_name: r.vendor_name || '-',
        total: Number(r.total || 0)
      }))
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

