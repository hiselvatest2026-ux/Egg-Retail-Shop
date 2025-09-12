/*
  Reset transactional data and seed controlled opening stocks for inventory tests.
  - Clears purchases, purchase_items, sales, sale_items, payments, stock_adjustments
  - Keeps products and metal_master
  - Sets opening_stocks (product-level) to Egg=60, Paneer=20
  - Sets opening_stocks_material (material-level) to M00001=60, M00002=20
*/
const pool = require('../models/db');

async function main() {
  try {
    await pool.query('BEGIN');
    // Clear transactional tables
    await pool.query('TRUNCATE payments, sale_items, sales, purchase_items, purchases, stock_adjustments RESTART IDENTITY CASCADE');

    // Ensure products exist and identify their IDs by name prefix
    const { rows: products } = await pool.query(`SELECT id, name FROM products ORDER BY id ASC`);
    const egg = products.find(p => String(p.name||'').toLowerCase().startsWith('egg'));
    const paneer = products.find(p => {
      const n = String(p.name||'').toLowerCase();
      return n.startsWith('paneer') || n.startsWith('panner');
    });
    if (!egg || !paneer) {
      throw new Error('Expected Egg* and Paneer/Panner* products to exist. Seed products first.');
    }

    // Reset openings
    await pool.query('TRUNCATE opening_stocks RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE opening_stocks_material RESTART IDENTITY CASCADE');
    await pool.query(`INSERT INTO opening_stocks (product_id, quantity) VALUES ($1,$2), ($3,$4)`, [egg.id, 60, paneer.id, 20]);
    await pool.query(`INSERT INTO opening_stocks_material (material_code, quantity) VALUES ('M00001',60), ('M00002',20)`);

    await pool.query('COMMIT');
    console.log('Reset complete. Opening set: Egg=60, Paneer=20.');
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch(_){}
    console.error('Reset failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

