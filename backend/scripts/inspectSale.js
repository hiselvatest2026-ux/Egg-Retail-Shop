/* Inspect a sale and its items, plus list Egg products */
const pool = require('../models/db');

async function main() {
  const saleId = Number(process.argv[2] || process.env.SALE_ID || 2);
  try {
    const sale = await pool.query('SELECT id, customer_id, total, status FROM sales WHERE id=$1', [saleId]);
    const items = await pool.query(`
      SELECT si.id, si.product_id, p.name AS product_name, si.quantity, si.price,
             CASE WHEN to_regclass('sale_items') IS NOT NULL AND to_regclass('sale_items') IS NOT NULL THEN NULL ELSE NULL END AS _
      FROM sale_items si
      LEFT JOIN products p ON p.id = si.product_id
      WHERE si.sale_id = $1
      ORDER BY si.id ASC
    `, [saleId]);
    const products = await pool.query(`SELECT id, name, price FROM products ORDER BY id ASC`);
    const eggCandidates = products.rows.filter(p => String(p.name||'').toLowerCase().startsWith('egg'));
    console.log(JSON.stringify({ sale: sale.rows, items: items.rows, eggProducts: eggCandidates }, null, 2));
  } catch (e) {
    console.error('Inspect failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

