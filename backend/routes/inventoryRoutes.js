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
    const locId = req.query.location_id ? Number(req.query.location_id) : null;
    // Materials
    const matsRes = await pool.query(`SELECT part_code AS material_code, metal_type AS material_type FROM metal_master ORDER BY part_code ASC`);
    const materials = matsRes.rows;
    // Opening (no location column at material level currently)
    const openingRes = await pool.query(`SELECT material_code, COALESCE(quantity,0) AS quantity FROM opening_stocks_material`);
    const openingMap = new Map(openingRes.rows.map(r=>[r.material_code, Number(r.quantity||0)]));
    // Guess mapping from product to material_code
    const purchRes = await pool.query(`
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
      WHERE ($1::int IS NULL OR pi.location_id = $1)
      GROUP BY gp.part_code
    `, [locId]);
    const purchMap = new Map(purchRes.rows.map(r=>[r.material_code, Number(r.qty||0)]));
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
             COALESCE(SUM(CASE WHEN sa.adjustment_type IN ('Wastage','Breakage','Missing') THEN sa.quantity ELSE 0 END),0) AS neg_qty,
             COALESCE(SUM(CASE WHEN sa.adjustment_type NOT IN ('Wastage','Breakage','Missing') THEN sa.quantity ELSE 0 END),0) AS pos_qty
      FROM stock_adjustments sa
      JOIN gp ON gp.product_id = sa.product_id
      GROUP BY gp.part_code
    `);
    const negMap = new Map(adjRes.rows.map(r=>[r.material_code, Number(r.neg_qty||0)]));
    const posMap = new Map(adjRes.rows.map(r=>[r.material_code, Number(r.pos_qty||0)]));
    const result = materials.map(m => {
      const code = m.material_code;
      const opening = openingMap.get(code) || 0;
      const purch = purchMap.get(code) || 0;
      const sold = salesMap.get(code) || 0;
      const neg = negMap.get(code) || 0;
      const pos = posMap.get(code) || 0;
      const qty = opening + purch - sold - neg + pos;
      return { material_code: code, material_type: m.material_type, quantity: String(Math.max(0, Math.round(qty))) };
    });
    res.json(result);
  } catch (e) { res.status(500).send(e.message); }
});

// Product-level closing stocks (optional, derived)
router.get('/closing-stocks', async (req, res) => {
  try {
    const locId = req.query.location_id ? Number(req.query.location_id) : null;
    const purch = await pool.query(`SELECT product_id, COALESCE(SUM(quantity),0) qty FROM purchase_items WHERE ($1::int IS NULL OR location_id=$1) GROUP BY product_id`, [locId]);
    const sales = await pool.query(`SELECT product_id, COALESCE(SUM(quantity),0) qty FROM sale_items WHERE ($1::int IS NULL OR location_id=$1) GROUP BY product_id`, [locId]);
    const purchMap = new Map(purch.rows.map(r=>[Number(r.product_id), Number(r.qty||0)]));
    const salesMap = new Map(sales.rows.map(r=>[Number(r.product_id), Number(r.qty||0)]));
    const prodRes = await pool.query(`SELECT id, name FROM products ORDER BY id ASC`);
    const rows = prodRes.rows.map(p=>{
      const closing = (purchMap.get(p.id)||0) - (salesMap.get(p.id)||0);
      return { product_id: p.id, name: p.name, quantity: String(Math.max(0, Math.round(closing))) };
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

module.exports = router;

