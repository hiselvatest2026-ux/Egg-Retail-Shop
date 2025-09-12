const pool = require('../models/db');

(async () => {
  try {
    await pool.query('BEGIN');
    await pool.query('TRUNCATE payments, sale_items, sales, purchase_items, purchases RESTART IDENTITY CASCADE');
    // Extra safety: reset sequences even if not owned
    const seqs = [
      { table: 'purchases', column: 'id' },
      { table: 'purchase_items', column: 'id' },
      { table: 'sales', column: 'id' },
      { table: 'sale_items', column: 'id' },
      { table: 'payments', column: 'id' }
    ];
    for (const s of seqs) {
      try {
        await pool.query(`SELECT setval(pg_get_serial_sequence('${s.table}','${s.column}'), 1, false)`);
      } catch (_) { /* ignore */ }
    }
    await pool.query('COMMIT');
    console.log('OK: Transactions cleared (purchases, purchase_items, sales, sale_items, payments).');
    process.exit(0);
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch (_) {}
    console.error('Failed to clear transactions:', e.message || e);
    process.exit(1);
  }
})();

