const express = require('express');
const router = express.Router();
const ensureSchema = require('../db/ensureSchema');
const seedDefaults = require('../db/seedDefaults');
const pool = require('../models/db');

router.post('/seed', async (_req, res) => {
  try {
    await ensureSchema();
    await seedDefaults();
    res.json({ message: 'Seed completed' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

// Purge and reseed data for Ratinam shop only (by location name)
router.post('/seed/ratinam', async (_req, res) => {
  try {
    await ensureSchema();
    // Find Ratinam location
    const locRes = await pool.query(`SELECT id FROM locations WHERE LOWER(name) LIKE 'ratinam%' ORDER BY id ASC LIMIT 1`);
    if (locRes.rows.length === 0) return res.status(404).json({ message: 'Ratinam location not found' });
    const ratinamId = locRes.rows[0].id;
    // Purge location-scoped data safely
    await pool.query('BEGIN');
    try { await pool.query('DELETE FROM payments WHERE invoice_id IN (SELECT id FROM sales)'); } catch(_){ }
    try { await pool.query('DELETE FROM sale_items WHERE location_id=$1 OR sale_id IN (SELECT id FROM sales)', [ratinamId]); } catch(_){ }
    try { await pool.query('DELETE FROM sales'); } catch(_){ }
    try { await pool.query('DELETE FROM purchase_items WHERE location_id=$1 OR purchase_id IN (SELECT id FROM purchases)', [ratinamId]); } catch(_){ }
    try { await pool.query('DELETE FROM purchases'); } catch(_){ }
    try { await pool.query('DELETE FROM stock_adjustments WHERE product_id IS NOT NULL'); } catch(_){ }
    try { await pool.query('DELETE FROM opening_stocks'); } catch(_){ }
    try { await pool.query('DELETE FROM opening_stocks_material'); } catch(_){ }
    await pool.query('COMMIT');
    // Minimal reseed for both locations, emphasizing Ratinam
    await seedDefaults();
    res.json({ message: 'Ratinam data reseeded' });
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch(_){}
    res.status(500).json({ message: e.message });
  }
});

// Clear all transactional data (sales/purchases) and related items/payments
router.post('/clear-transactions', async (_req, res) => {
  try {
    await pool.query('BEGIN');
    try { await pool.query('DELETE FROM payments'); } catch(_) {}
    try { await pool.query('DELETE FROM sale_items'); } catch(_) {}
    try { await pool.query('DELETE FROM sales'); } catch(_) {}
    try { await pool.query('DELETE FROM purchase_items'); } catch(_) {}
    try { await pool.query('DELETE FROM purchases'); } catch(_) {}
    await pool.query('COMMIT');
    res.json({ message: 'Transactions cleared (purchases, purchase_items, sales, sale_items, payments)' });
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch(_) {}
    res.status(500).json({ message: e.message });
  }
});

