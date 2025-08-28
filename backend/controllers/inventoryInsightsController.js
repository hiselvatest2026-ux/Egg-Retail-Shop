const pool = require('../models/db');

exports.getInsights = async (_req, res) => {
  try {
    // Current stock with value (using product price * stock as a naive value)
    const stockRes = await pool.query(`
      WITH purchase_qty AS (
        SELECT product_id, SUM(quantity) AS qty FROM purchase_items GROUP BY product_id
      ),
      sales_qty AS (
        SELECT product_id, SUM(quantity) AS qty FROM sale_items GROUP BY product_id
      ),
      adjustments AS (
        SELECT product_id, SUM(quantity) AS qty FROM stock_adjustments WHERE adjustment_type IN ('Missing','Wastage','Breakage') GROUP BY product_id
      )
      SELECT p.id, p.name, p.price, COALESCE(pq.qty,0) - COALESCE(sq.qty,0) - COALESCE(adj.qty,0) AS stock
      FROM products p
      LEFT JOIN purchase_qty pq ON pq.product_id = p.id
      LEFT JOIN sales_qty sq ON sq.product_id = p.id
      LEFT JOIN adjustments adj ON adj.product_id = p.id
    `);
    const stockRows = stockRes.rows.map(r => ({ id:r.id, name:r.name, price:Number(r.price||0), stock:Number(r.stock||0), value: Number(r.price||0)*Number(r.stock||0) }));

    const totalValue = stockRows.reduce((s,r)=>s+r.value,0);
    const lowStock = stockRows.filter(r => r.stock <= 5).sort((a,b)=>a.stock-b.stock).slice(0,10);

    // Fast/slow movers based on last 30 days
    const moversRes = await pool.query(`
      SELECT si.product_id, p.name, SUM(si.quantity) AS qty
      FROM sale_items si JOIN sales s ON s.id=si.sale_id JOIN products p ON p.id=si.product_id
      WHERE s.sale_date >= NOW() - INTERVAL '30 days'
      GROUP BY si.product_id, p.name
      ORDER BY qty DESC
    `);
    const movers = moversRes.rows.map(r => ({ product_id:r.product_id, name:r.name, qty:Number(r.qty||0) }));
    const fastMovers = movers.slice(0,10);
    const slowMovers = movers.slice(-10).reverse();

    // Reorder suggestions: stock <= 5 or stock cover < 7 days (rough heuristic)
    const avgRes = await pool.query(`
      SELECT si.product_id, AVG(si.quantity) AS avg_qty
      FROM sale_items si JOIN sales s ON s.id=si.sale_id
      WHERE s.sale_date >= NOW() - INTERVAL '30 days'
      GROUP BY si.product_id
    `);
    const avgMap = new Map(avgRes.rows.map(r => [String(r.product_id), Number(r.avg_qty||0)]));
    const reorder = stockRows.filter(r => {
      const avg = avgMap.get(String(r.id)) || 0;
      const coverDays = avg > 0 ? r.stock / avg : r.stock > 0 ? 999 : 0;
      return r.stock <= 5 || coverDays < 7;
    }).map(r => ({ product_id:r.id, name:r.name, stock:r.stock }));

    res.json({
      kpis: {
        total_stock_value: totalValue,
        low_stock_count: lowStock.length
      },
      low_stock,
      fast_movers: fastMovers,
      slow_movers: slowMovers,
      reorder_suggestions: reorder
    });
  } catch (e) { res.status(500).send(e.message); }
};

