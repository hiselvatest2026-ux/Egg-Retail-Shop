/*
  Verify closing stock derivation directly from DB.
  Computes per-material opening, purchased, sold, adjustments (neg/pos), closing.
  Mirrors logic from inventoryRoutes.js (/inventory/closing-stocks/materials).
*/
const pool = require('../models/db');

async function queryMap(sql, params = [], key = 'material_code', val = 'qty') {
  const { rows } = await pool.query(sql, params);
  return new Map(rows.map(r => [r[key], Number(r[val] || 0)]));
}

async function main() {
  try {
    // Materials
    const matsRes = await pool.query(`SELECT part_code AS material_code, metal_type AS material_type FROM metal_master ORDER BY part_code ASC`);
    const materials = matsRes.rows;

    // Opening derived from product openings mapped to materials
    const openingMap = await queryMap(`
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

    // Purchases by material
    const purchMap = await queryMap(`
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

    // Sales by material
    const salesMap = await queryMap(`
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

    // Adjustments by material (neg and pos)
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

    const summary = materials.map(m => {
      const code = m.material_code;
      const opening = openingMap.get(code) || 0;
      const purchased = purchMap.get(code) || 0;
      const sold = salesMap.get(code) || 0;
      const neg = negMap.get(code) || 0;
      const pos = posMap.get(code) || 0;
      const closing = Math.max(0, Math.round(opening + purchased - sold - neg + pos));
      return { material_code: code, material_type: m.material_type, opening, purchased, sold, neg_adjustments: neg, pos_adjustments: pos, closing };
    });

    console.log(JSON.stringify(summary, null, 2));
  } catch (e) {
    console.error('Verification failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

