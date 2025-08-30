const pool = require('../models/db');

async function seedDefaults() {
  try {
    await pool.query('BEGIN');
    await pool.query('TRUNCATE payments, sale_items, sales, purchase_items, purchases, stock_adjustments, goods_receipts, opening_stocks_material, opening_stocks, stock_counts, pricing_master, metal_master, products, customers, suppliers, vendors, locations RESTART IDENTITY CASCADE');
    await pool.query('COMMIT');
  } catch (e) { try { await pool.query('ROLLBACK'); } catch(_){} }

  try { await pool.query(`INSERT INTO locations (name) VALUES ('Main Outlet'), ('Warehouse')`); } catch (e) {}
  try { await pool.query(`INSERT INTO vendors (name, phone, address, pincode, gstin, credit_terms) VALUES ('Agri Supplies Co','9876543210','12 Market St','600001','33AAAAA0000A1Z5','Net 30'), ('Fresh Farm Traders','9876501234','8 Farm Rd','600045','33BBBBB1111B2Z6','Immediate')`); } catch (e) {}
  try { await pool.query(`INSERT INTO suppliers (name, contact_info) VALUES ('Legacy Supplier A','legacyA@example.com'),('Legacy Supplier B','legacyB@example.com')`); } catch (e) {}
  try { await pool.query(`INSERT INTO customers (name, contact_info, phone, category, gstin, tax_applicability) VALUES ('Alice Retail','alice@example.com','9000000001','Retail','33ZZZAA1111Z5','Taxable'),('Bob Cafe','bob@example.com','9000000002','Retail','', 'Non-Taxable'),('City Mart','city@example.com','9000000003','Wholesale','33YYYBB2222Y6','Taxable')`); } catch (e) {}
  try { await pool.query(`INSERT INTO metal_master (part_code, metal_type, gst_percent, description) VALUES ('M00001','Egg',0,'Egg products'),('M00002','Panner',5,'Panner products')`); } catch (e) {}
  try { await pool.query(`INSERT INTO products (name, price, batch_number, expiry_date) VALUES ('Egg Large 12pc',6.00,'BATCH-EGG-001', NOW() + INTERVAL '20 days'),('Panner 200g',200.00,'BATCH-PAN-001', NOW() + INTERVAL '15 days')`); } catch (e) {}
  try { await pool.query(`INSERT INTO opening_stocks (product_id, quantity) VALUES (1, 50), (2, 20)`); await pool.query(`INSERT INTO opening_stocks_material (material_code, quantity) VALUES ('M00001',30),('M00002',10)`); } catch (e) {}
  try { await pool.query(`INSERT INTO pricing_master (customer_id, category, material_code, base_price, gst_percent) VALUES (1,'Retail','M00001',6.00,0),(1,'Retail','M00002',200.00,5),(3,'Wholesale','M00001',5.50,0),(3,'Wholesale','M00002',190.00,5)`); } catch (e) {}
  try { const p1 = await pool.query(`INSERT INTO purchases (vendor_id, product_name, price_per_unit, quantity, gst_percent, total) VALUES (1,'Egg',6.00,100,0,600.00) RETURNING id`); await pool.query(`INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES ($1,1,100,6.00)`, [p1.rows[0].id]); const p2 = await pool.query(`INSERT INTO purchases (vendor_id, product_name, price_per_unit, quantity, gst_percent, total) VALUES (2,'Panner',200.00,10,5, ROUND(200.00*10*1.05,2)) RETURNING id`); await pool.query(`INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES ($1,2,10,200.00)`, [p2.rows[0].id]); } catch (e) {}
  try { const s1 = await pool.query(`INSERT INTO sales (customer_id, total, product_name, payment_method, status, discount, sale_type) VALUES (1,120.00,'Egg','Cash','Completed',0,'Cash') RETURNING id`); await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1,1,20,6.00)`, [s1.rows[0].id]); const s2 = await pool.query(`INSERT INTO sales (customer_id, total, product_name, payment_method, status, discount, sale_type) VALUES (3,399.00,'Panner','Gpay','Completed',0,'Credit') RETURNING id`); await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1,2,2,199.50)`, [s2.rows[0].id]); } catch (e) {}
  try { await pool.query(`INSERT INTO payments (customer_id, invoice_id, amount, payment_mode) VALUES (1,1,60.00,'Cash')`); } catch (e) {}
  try { await pool.query(`INSERT INTO stock_adjustments (product_id, adjustment_type, quantity, note) VALUES (1,'Breakage',2,'Damaged crate')`); } catch (e) {}
}

module.exports = seedDefaults;

