const pool = require('../models/db');

async function seedDefaults() {
  try {
    await pool.query('BEGIN');
    await pool.query('TRUNCATE payments, sale_items, sales, purchase_items, purchases, stock_adjustments, goods_receipts, opening_stocks_material, opening_stocks, stock_counts, pricing_master, metal_master, products, customers, suppliers, vendors, route_trips, routes, settings, locations RESTART IDENTITY CASCADE');
    await pool.query('COMMIT');
  } catch (e) { try { await pool.query('ROLLBACK'); } catch(_){} }

  try { await pool.query(`INSERT INTO locations (name) VALUES ('Ratinam')`); } catch (e) {}
  // Fetch locations for multi-shop seeding
  let locs = [];
  try { const r = await pool.query(`SELECT id, name FROM locations ORDER BY id ASC`); locs = r.rows; } catch (e) {}
  const ratinamId = locs.find(l=>/ratinam/i.test(l.name))?.id || locs[0]?.id || 1;
  const mainOutletId = ratinamId;
  const warehouseId = ratinamId;
  try { await pool.query(`INSERT INTO vendors (name, phone, address, pincode, gstin, credit_terms) VALUES ('Agri Supplies Co','9876543210','12 Market St','600001','33AAAAA0000A1Z5','Net 30'), ('Fresh Farm Traders','9876501234','8 Farm Rd','600045','33BBBBB1111B2Z6','Immediate')`); } catch (e) {}
  try { await pool.query(`INSERT INTO suppliers (name, contact_info) VALUES ('Legacy Supplier A','legacyA@example.com'),('Legacy Supplier B','legacyB@example.com')`); } catch (e) {}
  try { await pool.query(`INSERT INTO customers (name, contact_info, phone, category, gstin, credit_limit) VALUES 
    ('Alice Retail','alice@example.com','9000000001','Retail','33ZZZAA1111Z5', 0),
    ('Bob Cafe','bob@example.com','9000000002','Retail','', 0),
    ('City Mart','city@example.com','9000000003','Wholesale','33YYYBB2222Y6', 5000),
    ('Walk-in Customer','-', '9000000004','Walk-in','', 0)
  `); } catch (e) {}
  try { await pool.query(`INSERT INTO metal_master (part_code, metal_type, gst_percent, description, shelf_life) VALUES ('M00001','Egg',0,'Egg products','12 days')`); } catch (e) {}
  try { await pool.query(`INSERT INTO products (name, price, batch_number, expiry_date) VALUES ('Egg Large 12pc',6.00,'BATCH-EGG-001', NOW() + INTERVAL '20 days')`); } catch (e) {}
  try { await pool.query(`INSERT INTO opening_stocks (product_id, quantity) VALUES (1, 100)`); await pool.query(`INSERT INTO opening_stocks_material (material_code, quantity) VALUES ('M00001',60)`); } catch (e) {}
  try {
    await pool.query(`
      INSERT INTO pricing_master (customer_id, category, material_code, base_price, gst_percent) VALUES 
      (1,'Retail','M00001',6.00,0),
      (3,'Wholesale','M00001',5.50,0),
      (NULL,'Retail','M00001',6.00,0),
      (NULL,'Wholesale','M00001',5.50,0),
      (NULL,'Walk-in','M00001',6.00,0)
    `);
  } catch (e) {}
  // Purchases and Sales per location (if location_id columns exist)
  try {
    const p1 = await pool.query(`INSERT INTO purchases (vendor_id, product_name, price_per_unit, quantity, gst_percent, total) VALUES (1,'Egg',6.00,150,0,900.00) RETURNING id`);
    try { await pool.query(`INSERT INTO purchase_items (purchase_id, product_id, quantity, price, location_id) VALUES ($1,1,150,6.00,$2)`, [p1.rows[0].id, mainOutletId]); } catch (_) { await pool.query(`INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES ($1,1,150,6.00)`, [p1.rows[0].id]); }
  } catch (e) {}

  // Seed Sales with diverse scenarios for better demos and invoices
  try {
    // A) Retail Cash sale, full payment, multiple items (Egg 0% GST)
    // Total = (24*6) = 144.00
    const sA = await pool.query(`INSERT INTO sales (customer_id, total, product_name, payment_method, status, discount, sale_type) VALUES (1,144.00,NULL,'Cash','Completed',0,'Cash') RETURNING id`);
    try { await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price, location_id) VALUES ($1,1,24,6.00,$2)`, [sA.rows[0].id, mainOutletId]); } catch (_) { await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1,1,24,6.00)`, [sA.rows[0].id]); }

    // B) Wholesale Credit sale, partial payment, trays + pieces mix (Egg only)
    // Eggs: 60 @ 5.50 = 330.00; Grand = 330.00; Paid 0 => Balance 330.00
    const sB = await pool.query(`INSERT INTO sales (customer_id, total, product_name, payment_method, status, discount, sale_type) VALUES (3,330.00,NULL,'Credit','Completed',0,'Credit') RETURNING id`);
    try { await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price, location_id) VALUES ($1,1,60,5.50,$2)`, [sB.rows[0].id, warehouseId]); } catch (_) { await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1,1,60,5.50)`, [sB.rows[0].id]); }

    // C) Retail Walk-in (use Retail category), Gpay full payment, single item
    // Eggs: 12 @ 6 = 72.00
    const sC = await pool.query(`INSERT INTO sales (customer_id, total, product_name, payment_method, status, discount, sale_type) VALUES (4,72.00,NULL,'Cash','Completed',0,'Cash') RETURNING id`);
    try { await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price, location_id) VALUES ($1,1,12,6.00,$2)`, [sC.rows[0].id, mainOutletId]); } catch (_) { await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1,1,12,6.00)`, [sC.rows[0].id]); }
  } catch (e) {}
  try { await pool.query(`INSERT INTO stock_adjustments (product_id, adjustment_type, quantity, note) VALUES (1,'Breakage',2,'Damaged crate')`); } catch (e) {}

  // Routes and today's trip
  try {
    await pool.query(`INSERT INTO routes (route_number, route_name, vehicle_number, active, salesman_name, mobile, area_name, pincode) VALUES 
      ('R001','North Zone','TN-01-AB-1234', true, 'Kumar','9000000001','Anna Nagar','600040'),
      ('R002','South Zone','TN-02-CD-5678', true, 'Vijay','9000000002','Velachery','600042'),
      ('R003','Central','TN-03-EF-9012', false, 'Raj','9000000003','T. Nagar','600017'),
      ('R004','East Belt','TN-04-GH-3456', true, 'Arun','9000000004','Tambaram','600059'),
      ('R005','West Belt','TN-05-IJ-7890', true, 'Siva','9000000005','Porur','600116')`);
  } catch (e) {}
  try {
    await pool.query(`INSERT INTO route_trips (route_id, service_date, route_name, vehicle_number, status) VALUES (1, CURRENT_DATE, 'North Zone', 'TN-01-AB-1234', 'Planned')`);
  } catch (e) {}

  // Settings and HSN/SAC
  try { await pool.query(`INSERT INTO settings (company_name, gstin, address, phone, email, logo_url) VALUES ('TRY ZEROEGG POS','33ABCDE1234F1Z5','123 Market Road, Chennai-600001','+91-90000 00000','info@eggretail.test','https://raw.githubusercontent.com/hiselvatest2026-ux/Egg-Retail-Shop/main/ZeroEgg.jpeg')`); } catch (e) {}
  try { await pool.query(`UPDATE metal_master SET hsn_sac = CASE WHEN metal_type='Egg' THEN '0407' ELSE hsn_sac END`); } catch (e) {}
}

module.exports = seedDefaults;

