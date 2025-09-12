const pool = require('../models/db');

async function getMaterialClosing() {
  const matsRes = await pool.query(`SELECT part_code AS material_code, metal_type AS material_type FROM metal_master ORDER BY part_code ASC`);
  const materials = matsRes.rows;
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
  const openingMap = new Map(openingRes.rows.map(r => [r.material_code, Number(r.qty || 0)]));
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
    GROUP BY gp.part_code
  `);
  const purchMap = new Map(purchRes.rows.map(r => [r.material_code, Number(r.qty || 0)]));
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
    GROUP BY gp.part_code
  `);
  const salesMap = new Map(salesRes.rows.map(r => [r.material_code, Number(r.qty || 0)]));
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
  const negMap = new Map(adjRes.rows.map(r => [r.material_code, Number(r.neg_qty || 0)]));
  const posMap = new Map(adjRes.rows.map(r => [r.material_code, Number(r.pos_qty || 0)]));
  const result = materials.map(m => {
    const code = m.material_code;
    const opening = openingMap.get(code) || 0;
    const purch = purchMap.get(code) || 0;
    const sold = salesMap.get(code) || 0;
    const neg = negMap.get(code) || 0;
    const pos = posMap.get(code) || 0;
    const qty = opening + purch - sold - neg + pos;
    return { material_code: code, material_type: m.material_type, quantity: Math.max(0, Math.round(qty)) };
  });
  return result;
}

(async () => {
  try {
    const rows = await getMaterialClosing();
    const egg = rows.find(r => r.material_type && r.material_type.toLowerCase().includes('egg'));
    const paneer = rows.find(r => r.material_type && (r.material_type.toLowerCase().includes('paneer') || r.material_type.toLowerCase().includes('panner')));
    console.log(JSON.stringify({ egg: egg ? egg.quantity : null, paneer: paneer ? paneer.quantity : null, rows }, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Failed to compute closing stocks:', e.message || e);
    process.exit(1);
  }
})();

