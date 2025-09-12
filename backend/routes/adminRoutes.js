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

// Purge and reseed data for a specific location (removed)
/* router.post('/seed/ratinam', async (_req, res) => {
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
}); */

// Clear all transactional data (sales/purchases) and related items/payments
router.post('/clear-transactions', async (_req, res) => {
  try {
    await pool.query('BEGIN');
    // Use TRUNCATE with RESTART IDENTITY to reset auto-increment IDs
    await pool.query('TRUNCATE payments, sale_items, sales, purchase_items, purchases RESTART IDENTITY CASCADE');
    // Force-reset sequences even if not owned by table
    try { await pool.query("SELECT setval(pg_get_serial_sequence('purchases','id'), 1, false)"); } catch(_) {}
    try { await pool.query("SELECT setval(pg_get_serial_sequence('purchase_items','id'), 1, false)"); } catch(_) {}
    try { await pool.query("SELECT setval(pg_get_serial_sequence('sales','id'), 1, false)"); } catch(_) {}
    try { await pool.query("SELECT setval(pg_get_serial_sequence('sale_items','id'), 1, false)"); } catch(_) {}
    try { await pool.query("SELECT setval(pg_get_serial_sequence('payments','id'), 1, false)"); } catch(_) {}
    await pool.query('COMMIT');
    res.json({ message: 'Transactions cleared (purchases, purchase_items, sales, sale_items, payments)' });
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch(_) {}
    res.status(500).json({ message: e.message });
  }
});

// Backfill legacy sales without items: create a single fallback 0%-GST item equal to sale.total
router.post('/migrate/backfill-sale-items', async (_req, res) => {
  try {
    await pool.query('BEGIN');
    const salesRes = await pool.query(`SELECT s.id, s.total FROM sales s WHERE NOT EXISTS (SELECT 1 FROM sale_items si WHERE si.sale_id = s.id) AND COALESCE(s.total,0) > 0`);
    let created = 0;
    for (const row of salesRes.rows) {
      const rate = Number(row.total||0);
      if (!(rate>0)) continue;
      await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1, NULL, 1, $2)`, [row.id, rate]);
      created++;
    }
    await pool.query('COMMIT');
    res.json({ message: `Backfilled ${created} sales with synthetic line items.` });
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch(_){}
    res.status(500).json({ message: e.message });
  }
});

// Danger: Clear ALL data (masters and transactions). Leaves empty DB with schema intact
router.post('/clear-all', async (_req, res) => {
  try {
    await pool.query('BEGIN');
    await pool.query(`TRUNCATE 
      payments,
      sale_items,
      sales,
      purchase_items,
      purchases,
      stock_adjustments,
      goods_receipts,
      opening_stocks_material,
      opening_stocks,
      stock_counts,
      pricing_master,
      metal_master,
      products,
      customers,
      suppliers,
      vendors,
      route_trips,
      routes,
      settings,
      locations
      RESTART IDENTITY CASCADE`);
    await pool.query('COMMIT');
    res.json({ message: 'All data cleared. Database is empty.' });
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch(_){}
    res.status(500).json({ message: e.message });
  }
});

// One-time: seed basic routes (compatible with older schemas)
router.post('/seed/routes-basic', async (_req, res) => {
  try {
    // Introspect existing columns to avoid schema mismatch
    const colsRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='routes'`);
    const presentCols = new Set(colsRes.rows.map(r => r.column_name));
    // Candidate rows
    const baseRows = [
      { route_number:'R001', route_name:'North Zone', vehicle_number:'TN-01-AB-1234', active:true, salesman_name:'Kumar', mobile:'9000000001', area_name:'Anna Nagar', pincode:'600040' },
      { route_number:'R002', route_name:'South Zone', vehicle_number:'TN-02-CD-5678', active:true, salesman_name:'Vijay', mobile:'9000000002', area_name:'Velachery', pincode:'600042' },
      { route_number:'R003', route_name:'East Belt', vehicle_number:'TN-03-EF-9012', active:true, salesman_name:'Arun', mobile:'9000000003', area_name:'Tambaram', pincode:'600059' },
      { route_number:'R004', route_name:'West Belt', vehicle_number:'TN-04-GH-3456', active:true, salesman_name:'Siva', mobile:'9000000004', area_name:'Porur', pincode:'600116' },
      { route_number:'R005', route_name:'City Express', vehicle_number:'TN-05-IJ-7890', active:false, salesman_name:'Mani', mobile:'9000000005', area_name:'Royapuram', pincode:'600013' }
    ];
    // Columns we try in order of priority
    const preferred = ['route_number','route_name','vehicle_number','active','salesman_name','mobile','area_name','pincode'];
    let inserted = 0;
    await pool.query('BEGIN');
    for (const row of baseRows) {
      const cols = preferred.filter(c => presentCols.has(c));
      const values = cols.map(c => row[c] ?? null);
      const placeholders = cols.map((_,i)=>`$${i+1}`).join(',');
      const sql = `INSERT INTO routes (${cols.join(',')}) VALUES (${placeholders})`;
      try { await pool.query(sql, values); inserted++; } catch(_) { /* skip if unique conflict or other */ }
    }
    await pool.query('COMMIT');
    res.json({ message: `Seeded routes (inserted ${inserted})` });
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch(_) {}
    res.status(500).json({ message: e.message });
  }
});

