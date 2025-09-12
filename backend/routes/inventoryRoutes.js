const express = require('express');
const router = express.Router();
const { getInsights } = require('../controllers/inventoryInsightsController');
const pool = require('../models/db');

router.get('/insights', getInsights);

// Opening stocks endpoints
router.get('/opening-stocks', async (_req, res) => {
  try {
    const r = await pool.query(`SELECT p.id AS product_id, p.name, COALESCE(op.quantity,0) AS quantity
                                FROM products p LEFT JOIN opening_stocks op ON op.product_id = p.id
                                ORDER BY p.name ASC`);
    res.json(r.rows);
  } catch (e) { res.status(500).send(e.message); }
});

router.put('/opening-stocks', async (req, res) => {
  try {
    const { items } = req.body; // [{product_id, quantity}]
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items array required' });
    await pool.query('BEGIN');
    for (const it of items) {
      await pool.query(`INSERT INTO opening_stocks (product_id, quantity) VALUES ($1,$2)
                        ON CONFLICT (product_id) DO UPDATE SET quantity=EXCLUDED.quantity, updated_at=NOW()`, [it.product_id, it.quantity]);
    }
    await pool.query('COMMIT');
    res.json({ message: 'Opening stocks saved' });
  } catch (e) { try { await pool.query('ROLLBACK'); } catch(_){} res.status(500).send(e.message); }
});

// Opening stocks by material (Material Master)
router.get('/opening-stocks/materials', async (_req, res) => {
  try {
    const r = await pool.query(`SELECT m.part_code AS material_code, m.metal_type AS material_type, COALESCE(osm.quantity,0) AS quantity
                                FROM metal_master m LEFT JOIN opening_stocks_material osm ON osm.material_code = m.part_code
                                ORDER BY m.part_code ASC`);
    res.json(r.rows);
  } catch (e) { res.status(500).send(e.message); }
});

router.put('/opening-stocks/materials', async (req, res) => {
  try {
    const { items } = req.body; // [{material_code, quantity}]
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items array required' });
    await pool.query('BEGIN');
    for (const it of items) {
      await pool.query(`INSERT INTO opening_stocks_material (material_code, quantity) VALUES ($1,$2)
                        ON CONFLICT (material_code) DO UPDATE SET quantity=EXCLUDED.quantity, updated_at=NOW()`, [it.material_code, it.quantity]);
    }
    await pool.query('COMMIT');
    res.json({ message: 'Opening stocks (materials) saved' });
  } catch (e) { try { await pool.query('ROLLBACK'); } catch(_){} res.status(500).send(e.message); }
});

// Auto-derived closing stocks by material (normalized to pieces)
router.get('/closing-stocks/materials', async (req, res) => {
  try {
    const locHeader = req.headers['x-shop-id'];
    const locId = req.query.location_id ? Number(req.query.location_id) : (locHeader ? Number(locHeader) : null);
    // Materials
    const matsRes = await pool.query(`SELECT part_code AS material_code, metal_type AS material_type FROM metal_master ORDER BY part_code ASC`);
    const materials = matsRes.rows;
    // Opening derived from product opening mapped to materials (keeps consistency with product-level view)
    const openingRes = await pool.query(`
      WITH gp AS (
        SELECT id AS product_id,
               CASE
                 WHEN LOWER(name) LIKE 'egg%' THEN 'M00001'
                 WHEN LOWER(name) LIKE 'paneer%' OR LOWER(name) LIKE 'panner%' THEN 'M00002'
                 ELSE NULL
               END AS part_code
        FROM products
      )
      SELECT gp.part_code AS material_code, COALESCE(SUM(os.quantity),0) AS qty
      FROM opening_stocks os
      JOIN gp ON gp.product_id = os.product_id
      GROUP BY gp.part_code
    `);
    const openingMap = new Map(openingRes.rows.map(r=>[r.material_code, Number(r.qty||0)]));
    const purchasesRes = await pool.query(`
      WITH gp AS (
        SELECT id AS product_id,
               CASE
                 WHEN LOWER(name) LIKE 'egg%' THEN 'M00001'
                 WHEN LOWER(name) LIKE 'paneer%' OR LOWER(name) LIKE 'panner%' THEN 'M00002'
                 ELSE NULL
               END AS part_code
        FROM products
      )
      SELECT gp.part_code AS material_code, COALESCE(SUM(pi.quantity),0) AS qty
      FROM purchase_items pi
      JOIN gp ON gp.product_id = pi.product_id
      GROUP BY gp.part_code
    `);
    const purchaseMap = new Map(purchasesRes.rows.map(r=>[r.material_code, Number(r.qty||0)]));
    const salesRes = await pool.query(`
      WITH gp AS (
        SELECT id AS product_id,
               CASE
                 WHEN LOWER(name) LIKE 'egg%' THEN 'M00001'
                 WHEN LOWER(name) LIKE 'paneer%' OR LOWER(name) LIKE 'panner%' THEN 'M00002'
                 ELSE NULL
               END AS part_code
        FROM products
      )
      SELECT gp.part_code AS material_code, COALESCE(SUM(si.quantity),0) AS qty
      FROM sale_items si
      JOIN gp ON gp.product_id = si.product_id
      WHERE ($1::int IS NULL OR si.location_id = $1)
      GROUP BY gp.part_code
    `, [locId]);
    const salesMap = new Map(salesRes.rows.map(r=>[r.material_code, Number(r.qty||0)]));
    const adjRes = await pool.query(`
      WITH gp AS (
        SELECT id AS product_id,
               CASE
                 WHEN LOWER(name) LIKE 'egg%' THEN 'M00001'
                 WHEN LOWER(name) LIKE 'paneer%' OR LOWER(name) LIKE 'panner%' THEN 'M00002'
                 ELSE NULL
               END AS part_code
        FROM products
      )
      SELECT gp.part_code AS material_code,
             COALESCE(SUM(CASE WHEN sa.adjustment_type IN ('Wastage','Breakage','Missing') THEN sa.quantity ELSE 0 END),0) AS neg_qty
      FROM stock_adjustments sa
      JOIN gp ON gp.product_id = sa.product_id
      GROUP BY gp.part_code
    `);
    const negMap = new Map(adjRes.rows.map(r=>[r.material_code, Number(r.neg_qty||0)]));
    const result = materials.map(m => {
      const code = m.material_code;
      const opening = openingMap.get(code) || 0;
      const purchased = purchaseMap.get(code) || 0;
      const sold = salesMap.get(code) || 0;
      const neg = negMap.get(code) || 0;
      const qty = opening + purchased - sold - neg;
      return { material_code: code, material_type: m.material_type, quantity: String(Math.max(0, Math.round(qty))) };
    });
    res.json(result);
  } catch (e) { res.status(500).send(e.message); }
});

// Product-level closing stocks (optional, derived)
router.get('/closing-stocks', async (req, res) => {
  try {
    const locHeader = req.headers['x-shop-id'];
    const locId = req.query.location_id ? Number(req.query.location_id) : (locHeader ? Number(locHeader) : null);
    const opening = await pool.query(`SELECT product_id, COALESCE(quantity,0) AS qty FROM opening_stocks`);
    const purchases = await pool.query(`SELECT product_id, COALESCE(SUM(quantity),0) AS qty FROM purchase_items GROUP BY product_id`);
    const sales = await pool.query(`SELECT product_id, COALESCE(SUM(quantity),0) AS qty FROM sale_items WHERE ($1::int IS NULL OR location_id=$1) GROUP BY product_id`, [locId]);
    const adjustments = await pool.query(`
      SELECT product_id, COALESCE(SUM(quantity),0) AS deducted
      FROM stock_adjustments
      WHERE adjustment_type IN ('Missing','Wastage','Breakage')
      GROUP BY product_id
    `);
    const openMap = new Map(opening.rows.map(r=>[Number(r.product_id), Number(r.qty||0)]));
    const purchaseMap = new Map(purchases.rows.map(r=>[Number(r.product_id), Number(r.qty||0)]));
    const salesMap = new Map(sales.rows.map(r=>[Number(r.product_id), Number(r.qty||0)]));
    const adjMap = new Map(adjustments.rows.map(r=>[Number(r.product_id), Number(r.deducted||0)]));
    const prodRes = await pool.query(`SELECT id, name FROM products ORDER BY id ASC`);
    const rows = prodRes.rows.map(p=>{
      const open = openMap.get(p.id) || 0;
      const purchased = purchaseMap.get(p.id) || 0;
      const sold = salesMap.get(p.id) || 0;
      const deducted = adjMap.get(p.id) || 0;
      const closing = Math.max(0, Math.round(open + purchased - sold - deducted));
      return { product_id: p.id, name: p.name, quantity: String(closing) };
    });
    res.json(rows);
  } catch (e) { res.status(500).send(e.message); }
});

// Accept closing stock entries for materials (no-op or future: create correction adjustments)
router.put('/closing-stocks/materials', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items array required' });
    // For now, acknowledge success. Future: compute delta vs derived and insert stock_adjustments.
    res.json({ message: 'Closing stocks accepted' });
  } catch (e) { res.status(500).send(e.message); }
});

// Detailed stock breakdown per product: opening, sold, adjustments, closing (purchases roll into opening)
router.get('/stock-breakdown', async (req, res) => {
  try {
    const locHeader = req.headers['x-shop-id'];
    const locId = req.query.location_id ? Number(req.query.location_id) : (locHeader ? Number(locHeader) : null);
    const locSI = locId ? 'WHERE si.location_id = $1' : '';
    const params = locId ? [locId] : [];
    const q = await pool.query(`
      WITH sales_qty AS (
        SELECT product_id, SUM(quantity) AS qty FROM sale_items si ${locSI} GROUP BY product_id
      ),
      purchase_qty AS (
        SELECT product_id, SUM(quantity) AS qty FROM purchase_items GROUP BY product_id
      ),
      adjustments AS (
        SELECT product_id,
               SUM(CASE WHEN adjustment_type IN ('Missing','Wastage','Breakage') THEN quantity ELSE 0 END) AS deducted
        FROM stock_adjustments GROUP BY product_id
      ),
      opening AS (
        SELECT product_id, quantity FROM opening_stocks
      ),
      all_ids AS (
        SELECT id AS product_id FROM products
        UNION SELECT product_id FROM sale_items
        UNION SELECT product_id FROM purchase_items
      )
      SELECT a.product_id,
             COALESCE(p.name, 'Product #' || a.product_id) AS name,
             COALESCE(op.quantity,0) AS opening,
             COALESCE(sq.qty,0) AS sold,
             COALESCE(adj.deducted,0) AS adjustments,
             COALESCE(op.quantity,0) + COALESCE(pq.qty,0) - COALESCE(sq.qty,0) - COALESCE(adj.deducted,0) AS closing
      FROM all_ids a
      LEFT JOIN products p ON p.id = a.product_id
      LEFT JOIN opening op ON op.product_id = a.product_id
      LEFT JOIN sales_qty sq ON sq.product_id = a.product_id
      LEFT JOIN purchase_qty pq ON pq.product_id = a.product_id
      LEFT JOIN adjustments adj ON adj.product_id = a.product_id
      ORDER BY name ASC
      `, params);
      res.json(q.rows.map(r => ({
        product_id: Number(r.product_id),
        name: r.name,
        opening: Number(r.opening||0),
        sold: Number(r.sold||0),
        adjustments: Number(r.adjustments||0),
        closing: Number(r.closing||0)
      })));
    } catch (e) { res.status(500).send(e.message); }
  });

module.exports = router;

