/* Add a sale item to a sale */
const pool = require('../models/db');

async function main() {
  const saleId = Number(process.argv[2] || process.env.SALE_ID || 2);
  const productId = Number(process.argv[3] || process.env.PRODUCT_ID || 1);
  const quantity = Number(process.argv[4] || process.env.QTY || 12);
  const price = Number(process.argv[5] || process.env.PRICE || 6.00);
  try {
    await pool.query('BEGIN');
    await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)`, [saleId, productId, quantity, price]);
    await pool.query('COMMIT');
    console.log(`Inserted sale item: sale_id=${saleId}, product_id=${productId}, qty=${quantity}, price=${price}`);
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch(_){}
    console.error('Insert failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

