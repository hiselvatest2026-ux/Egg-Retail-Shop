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

// Bulk update sale item price for a list of sale IDs
router.post('/sales/bulk-update-price', async (req, res) => {
  try {
    const { sale_ids, price } = req.body || {};
    if (!Array.isArray(sale_ids) || !(Number(price) > 0)) {
      return res.status(400).json({ message: 'sale_ids array and positive price required' });
    }
    const ids = sale_ids.map(Number).filter(n => Number.isFinite(n));
    if (ids.length === 0) return res.json({ updated_items: 0, affected_sales: 0, sale_ids: [] });
    await pool.query('BEGIN');
    const placeholders = ids.map((_,i)=>`$${i+1}`).join(',');
    const params = [...ids, Number(price)];
    const upd = await pool.query(`UPDATE sale_items SET price = $${ids.length+1} WHERE sale_id IN (${placeholders}) RETURNING sale_id, id`, params);
    const uniqSales = Array.from(new Set(upd.rows.map(r=>r.sale_id)));
    for (const sid of uniqSales) {
      await pool.query('UPDATE sales SET total = (SELECT COALESCE(SUM(quantity*price),0) FROM sale_items WHERE sale_id=$1) WHERE id=$1', [sid]);
    }
    await pool.query('COMMIT');
    res.json({ updated_items: upd.rowCount, affected_sales: uniqSales.length, sale_ids: uniqSales });
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch(_) {}
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

// Bulk reassign sales to a different customer_id
router.post('/sales/bulk-reassign-customer', async (req, res) => {
  try {
    const { sale_ids, customer_id } = req.body || {};
    if (!Array.isArray(sale_ids) || !Number.isFinite(Number(customer_id))) {
      return res.status(400).json({ message: 'sale_ids array and customer_id required' });
    }
    const ids = sale_ids.map(Number).filter(n => Number.isFinite(n));
    if (ids.length === 0) return res.json({ updated: 0 });
    await pool.query('BEGIN');
    const placeholders = ids.map((_,i)=>`$${i+1}`).join(',');
    const params = [...ids, Number(customer_id)];
    const upd = await pool.query(`UPDATE sales SET customer_id=$${ids.length+1} WHERE id IN (${placeholders}) RETURNING id`, params);
    await pool.query('COMMIT');
    return res.json({ updated: upd.rowCount, sale_ids: upd.rows.map(r=>r.id) });
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch(_) {}
    return res.status(500).json({ message: e.message });
  }
});

// --- Tray adjustments for existing records (qty-only, no value) ---

// Adjust a customer's tray balance by a delta (positive=in, negative=out)
router.post('/trays/adjust-customer', async (req, res) => {
  try {
    const { customer_id, delta, reference_id, note } = req.body || {};
    const cid = Number(customer_id);
    const d = Number(delta);
    if (!Number.isFinite(cid) || !Number.isFinite(d) || d === 0) {
      return res.status(400).json({ message: 'customer_id and non-zero delta required' });
    }
    const direction = d > 0 ? 'in' : 'out';
    const qty = Math.abs(Math.trunc(d));
    await pool.query(
      'INSERT INTO tray_ledger (customer_id, direction, reference_type, reference_id, qty) VALUES ($1,$2,$3,$4,$5)',
      [cid, direction, 'adjustment', reference_id ?? null, qty]
    );
    res.json({ message: 'Customer tray adjusted', customer_id: cid, delta: d });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Adjust a vendor's tray stock by a delta (positive=in to shop, negative=out from shop)
router.post('/trays/adjust-vendor', async (req, res) => {
  try {
    const { vendor_id, delta, reference_id, note } = req.body || {};
    const vid = Number(vendor_id);
    const d = Number(delta);
    if (!Number.isFinite(vid) || !Number.isFinite(d) || d === 0) {
      return res.status(400).json({ message: 'vendor_id and non-zero delta required' });
    }
    const direction = d > 0 ? 'in' : 'out';
    const qty = Math.abs(Math.trunc(d));
    await pool.query(
      'INSERT INTO tray_ledger (vendor_id, direction, reference_type, reference_id, qty) VALUES ($1,$2,$3,$4,$5)',
      [vid, direction, 'adjustment', reference_id ?? null, qty]
    );
    res.json({ message: 'Vendor tray adjusted', vendor_id: vid, delta: d });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Attach tray qty to an existing sale (customer out)
router.post('/trays/attach-sale', async (req, res) => {
  try {
    const { sale_id, tray_qty } = req.body || {};
    const sid = Number(sale_id);
    const qty = Math.abs(Math.trunc(Number(tray_qty||0)));
    if (!Number.isFinite(sid) || !(qty>0)) return res.status(400).json({ message: 'sale_id and positive tray_qty required' });
    const saleRes = await pool.query('SELECT customer_id FROM sales WHERE id=$1', [sid]);
    if (saleRes.rowCount === 0) return res.status(404).json({ message: 'Sale not found' });
    const cid = saleRes.rows[0].customer_id;
    if (!cid) return res.status(400).json({ message: 'Sale has no customer_id' });
    await pool.query('INSERT INTO tray_ledger (customer_id, direction, reference_type, reference_id, qty) VALUES ($1,$2,$3,$4,$5)', [cid, 'out', 'sale', sid, qty]);
    res.json({ message: 'Tray attached to sale', sale_id: sid, customer_id: cid, tray_qty: qty });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Attach tray qty to an existing purchase (vendor in/out)
router.post('/trays/attach-purchase', async (req, res) => {
  try {
    const { purchase_id, in_qty, out_qty } = req.body || {};
    const pid = Number(purchase_id);
    if (!Number.isFinite(pid)) return res.status(400).json({ message: 'purchase_id required' });
    const purRes = await pool.query('SELECT vendor_id FROM purchases WHERE id=$1', [pid]);
    if (purRes.rowCount === 0) return res.status(404).json({ message: 'Purchase not found' });
    const vid = purRes.rows[0].vendor_id || null;
    const tasks = [];
    const inq = Math.abs(Math.trunc(Number(in_qty||0)));
    const outq = Math.abs(Math.trunc(Number(out_qty||0)));
    if (vid && inq>0) tasks.push(pool.query('INSERT INTO tray_ledger (vendor_id, direction, reference_type, reference_id, qty) VALUES ($1,$2,$3,$4,$5)', [vid, 'in', 'purchase', pid, inq]));
    if (vid && outq>0) tasks.push(pool.query('INSERT INTO tray_ledger (vendor_id, direction, reference_type, reference_id, qty) VALUES ($1,$2,$3,$4,$5)', [vid, 'out', 'purchase', pid, outq]));
    if (!tasks.length) return res.status(400).json({ message: 'No vendor_id on purchase or no positive in/out qty provided' });
    await Promise.all(tasks);
    res.json({ message: 'Tray attached to purchase', purchase_id: pid, vendor_id: vid, in_qty: inq, out_qty: outq });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Export JSON backup of all public tables
router.get('/backup', async (_req, res) => {
  try {
    const tablesRes = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    const tableNames = (tablesRes.rows || [])
      .map(r => String(r.tablename))
      .filter(name => /^[a-z_][a-z0-9_]*$/.test(name))
      .filter(name => !name.startsWith('pg_') && !name.startsWith('sql_'));
    const data = {};
    for (const name of tableNames) {
      try {
        // Note: identifiers are validated above; avoid injection by not interpolating arbitrary input
        const r = await pool.query(`SELECT * FROM ${name}`);
        data[name] = r.rows || [];
      } catch (e) {
        data[name] = { error: e.message };
      }
    }
    const payload = { dumped_at: new Date().toISOString(), tables: tableNames, data };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="db_backup_${new Date().toISOString().replace(/[:.]/g,'-')}.json"`);
    res.status(200).send(JSON.stringify(payload));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Export JSON backup including schema (tables, columns, constraints, indexes) and data
router.get('/backup/full', async (_req, res) => {
  try {
    // Fetch table names in public schema
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
    const tableNames = (tablesRes.rows || []).map(r => String(r.table_name));

    const schema = { tables: {}, sequences: [] };
    const data = {};

    // Sequences and their last values
    try {
      const seqRes = await pool.query("SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema='public' ORDER BY sequence_name");
      for (const row of (seqRes.rows || [])) {
        const name = String(row.sequence_name);
        try {
          const last = await pool.query(`SELECT last_value FROM ${name}`);
          schema.sequences.push({ name, last_value: Number(last.rows?.[0]?.last_value ?? 0) });
        } catch (e) {
          schema.sequences.push({ name, error: e.message });
        }
      }
    } catch (_) { /* ignore */ }

    for (const name of tableNames) {
      // Columns
      const colsRes = await pool.query(
        "SELECT column_name, data_type, is_nullable, column_default, is_identity, character_maximum_length, numeric_precision, numeric_scale FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
        [name]
      );
      const columns = (colsRes.rows || []).map(r => ({
        name: r.column_name,
        data_type: r.data_type,
        is_nullable: r.is_nullable === 'YES',
        default: r.column_default ?? null,
        is_identity: (String(r.is_identity||'').toUpperCase() === 'YES'),
        char_max_length: r.character_maximum_length != null ? Number(r.character_maximum_length) : null,
        numeric_precision: r.numeric_precision != null ? Number(r.numeric_precision) : null,
        numeric_scale: r.numeric_scale != null ? Number(r.numeric_scale) : null,
      }));

      // Primary key
      const pkRes = await pool.query(
        `SELECT kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema='public' AND tc.table_name=$1
         ORDER BY kcu.ordinal_position`,
        [name]
      );
      const primary_key = (pkRes.rows || []).map(r => r.column_name);

      // Unique constraints
      const uniqCons = [];
      const uRes = await pool.query(
        `SELECT tc.constraint_name, kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema='public' AND tc.table_name=$1
         ORDER BY tc.constraint_name, kcu.ordinal_position`,
        [name]
      );
      for (const row of (uRes.rows || [])) {
        let entry = uniqCons.find(x => x.name === row.constraint_name);
        if (!entry) { entry = { name: row.constraint_name, columns: [] }; uniqCons.push(entry); }
        entry.columns.push(row.column_name);
      }

      // Foreign keys
      const fkRes = await pool.query(
        `SELECT c.conname AS constraint_name,
                tgt.relname AS referenced_table,
                src_col.attname AS column_name,
                tgt_col.attname AS referenced_column
         FROM pg_constraint c
         JOIN pg_class src ON src.oid = c.conrelid
         JOIN pg_namespace nsp ON nsp.oid = src.relnamespace AND nsp.nspname='public'
         JOIN pg_class tgt ON tgt.oid = c.confrelid
         JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS s(attnum, ord) ON TRUE
         JOIN LATERAL unnest(c.confkey) WITH ORDINALITY AS t(attnum, ord) ON TRUE
         JOIN pg_attribute src_col ON src_col.attrelid = src.oid AND src_col.attnum = s.attnum
         JOIN pg_attribute tgt_col ON tgt_col.attrelid = tgt.oid AND tgt_col.attnum = t.attnum
         WHERE c.contype='f' AND src.relname = $1
         ORDER BY c.conname, s.ord`,
        [name]
      );
      const foreign_keys = [];
      for (const row of (fkRes.rows || [])) {
        let entry = foreign_keys.find(x => x.name === row.constraint_name);
        if (!entry) { entry = { name: row.constraint_name, referenced_table: row.referenced_table, columns: [] }; foreign_keys.push(entry); }
        entry.columns.push({ column: row.column_name, references: row.referenced_column });
      }

      // Indexes
      const idxRes = await pool.query(
        `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename=$1 ORDER BY indexname`,
        [name]
      );
      const indexes = (idxRes.rows || []).map(r => ({ name: r.indexname, definition: r.indexdef }));

      // Row count
      let row_count = null;
      try {
        const cnt = await pool.query(`SELECT COUNT(*) AS c FROM ${name}`);
        row_count = Number(cnt.rows?.[0]?.c ?? 0);
      } catch (_) {}

      schema.tables[name] = { columns, primary_key, unique_constraints: uniqCons, foreign_keys, indexes, row_count };

      // Data
      try {
        const r = await pool.query(`SELECT * FROM ${name}`);
        data[name] = r.rows || [];
      } catch (e) {
        data[name] = { error: e.message };
      }
    }

    const payload = { dumped_at: new Date().toISOString(), schema, data };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="db_full_backup_${new Date().toISOString().replace(/[:.]/g,'-')}.json"`);
    res.status(200).send(JSON.stringify(payload));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Export JSON backup for a range of sale IDs (includes sales, sale_items, payments, customers)
router.get('/backup/sales-range', async (req, res) => {
  try {
    const fromId = Number(req.query.from);
    const toId = Number(req.query.to);
    if (!Number.isFinite(fromId) || !Number.isFinite(toId) || fromId > toId) {
      return res.status(400).json({ message: 'Valid query params from and to are required (from <= to)' });
    }
    // Sales in range
    const salesRes = await pool.query('SELECT * FROM sales WHERE id BETWEEN $1 AND $2 ORDER BY id', [fromId, toId]);
    const sales = salesRes.rows || [];
    const saleIds = sales.map(s => Number(s.id)).filter(n => Number.isFinite(n));
    // Related items
    let sale_items = [];
    if (saleIds.length > 0) {
      const placeholders = saleIds.map((_, i) => `$${i+1}`).join(',');
      const siRes = await pool.query(`SELECT * FROM sale_items WHERE sale_id IN (${placeholders}) ORDER BY sale_id, id`, saleIds);
      sale_items = siRes.rows || [];
    }
    // Payments by invoice id
    let payments = [];
    if (saleIds.length > 0) {
      const placeholders = saleIds.map((_, i) => `$${i+1}`).join(',');
      const payRes = await pool.query(`SELECT * FROM payments WHERE invoice_id IN (${placeholders}) ORDER BY id`, saleIds);
      payments = payRes.rows || [];
    }
    // Customers linked to these sales
    let customers = [];
    if (sales.length > 0) {
      const customerIds = Array.from(new Set(sales.map(s => Number(s.customer_id)).filter(n => Number.isFinite(n))));
      if (customerIds.length > 0) {
        const placeholders = customerIds.map((_, i) => `$${i+1}`).join(',');
        const custRes = await pool.query(`SELECT * FROM customers WHERE id IN (${placeholders}) ORDER BY id`, customerIds);
        customers = custRes.rows || [];
      }
    }
    const payload = {
      dumped_at: new Date().toISOString(),
      range: { from: fromId, to: toId },
      counts: { sales: sales.length, sale_items: sale_items.length, payments: payments.length, customers: customers.length },
      data: { sales, sale_items, payments, customers }
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="sales_backup_${fromId}-${toId}_${new Date().toISOString().replace(/[:.]/g,'-')}.json"`);
    res.status(200).send(JSON.stringify(payload));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

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

