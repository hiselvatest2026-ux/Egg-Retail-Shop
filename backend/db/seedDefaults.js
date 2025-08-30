const pool = require('../models/db');

async function seedDefaults() {
  try {
    const sup = await pool.query('SELECT id FROM suppliers LIMIT 1');
    if (sup.rows.length === 0) {
      await pool.query(`INSERT INTO suppliers (name, contact_info) VALUES 
        ('FarmFresh Eggs','farmfresh@example.com'),
        ('Happy Hens Co','hens@example.com'),
        ('Organic Yolk Ltd','organic@example.com')`);
      console.log('Seeded suppliers');
    }
  } catch (e) {
    console.error('Seeding suppliers failed:', e.message);
  }

  try {
    const cust = await pool.query('SELECT id FROM customers LIMIT 1');
    if (cust.rows.length === 0) {
      await pool.query(`INSERT INTO customers (name, contact_info) VALUES 
        ('Alice Retail','alice@example.com'),
        ('Bob Cafe','bob@example.com'),
        ('City Mart','citymart@example.com')`);
      console.log('Seeded customers');
    }
  } catch (e) {
    console.error('Seeding customers failed:', e.message);
  }

  try {
    const ven = await pool.query('SELECT id FROM vendors LIMIT 1');
    if (ven.rows.length === 0) {
      await pool.query(`INSERT INTO vendors (name, phone, address, pincode, gstin, credit_terms) VALUES 
        ('Agri Supplies Co', '9876543210', 'No.12, Market Street', '600001', '33AAAAA0000A1Z5', 'Net 30'),
        ('Fresh Farm Traders', '9876501234', 'Plot 8, Farm Road', '600045', '33BBBBB1111B2Z6', 'Immediate'),
        ('Daily Dairy Hub', '9988776655', '#24, Dairy Lane', '600078', '33CCCCC2222C3Z7', 'Net 15')`);
      console.log('Seeded vendors');
    }
  } catch (e) {
    console.error('Seeding vendors failed:', e.message);
  }

  try {
    const mm = await pool.query('SELECT id FROM metal_master LIMIT 1');
    if (mm.rows.length === 0) {
      await pool.query(`INSERT INTO metal_master (part_code, metal_type, gst_percent, description) VALUES 
        ('M00001','Egg',0,'Egg products'),
        ('M00002','Panner',5,'Panner products')`);
      console.log('Seeded material (metal) master');
    }
  } catch (e) {
    console.error('Seeding material master failed:', e.message);
  }

  try {
    const pm = await pool.query('SELECT id FROM pricing_master LIMIT 1');
    if (pm.rows.length === 0) {
      await pool.query(`INSERT INTO pricing_master (customer_id, category, material_code, base_price, gst_percent) VALUES 
        (1, 'Retail', 'M00001', 6.00, 0),
        (1, 'Retail', 'M00002', 200.00, 5),
        (2, 'Retail', 'M00001', 5.75, 0),
        (2, 'Retail', 'M00002', 195.00, 5)`);
      console.log('Seeded pricing master');
    }
  } catch (e) {
    console.error('Seeding pricing master failed:', e.message);
  }

  try {
    const prod = await pool.query('SELECT id FROM products LIMIT 1');
    if (prod.rows.length === 0) {
      await pool.query(`INSERT INTO products (name, price, batch_number, expiry_date) VALUES 
        ('Chicken Eggs - Large', 6.00, 'BATCH-CHK-L-001', NOW() + INTERVAL '20 days'),
        ('Chicken Eggs - Medium', 5.50, 'BATCH-CHK-M-002', NOW() + INTERVAL '15 days'),
        ('Duck Eggs', 8.00, 'BATCH-DUCK-003', NOW() + INTERVAL '10 days'),
        ('Quail Eggs', 10.00, 'BATCH-QUAIL-004', NOW() + INTERVAL '7 days'),
        ('Country Eggs', 9.00, 'BATCH-CTRY-005', NOW() + INTERVAL '5 days')`);
      console.log('Seeded products');
    }
  } catch (e) {
    console.error('Seeding products failed:', e.message);
  }

  try {
    const loc = await pool.query('SELECT id FROM locations LIMIT 1');
    if (loc.rows.length === 0) {
      await pool.query(`INSERT INTO locations (name) VALUES ('Main Outlet'),('Warehouse'),('Outlet 2')`);
      console.log('Seeded locations');
    }
  } catch (e) {
    console.error('Seeding locations failed:', e.message);
  }

  // Seed purchases and items if empty
  try {
    const pc = await pool.query('SELECT id FROM purchases LIMIT 1');
    if (pc.rows.length === 0) {
      // Create two purchases linked to vendors with product_name fields
      const p1 = await pool.query(`INSERT INTO purchases (vendor_id, product_name, price_per_unit, quantity, gst_percent, total) VALUES (1, 'Egg', 6.00, 100, 0, 600.00) RETURNING id`);
      const p2 = await pool.query(`INSERT INTO purchases (vendor_id, product_name, price_per_unit, quantity, gst_percent, total) VALUES (2, 'Panner', 200.00, 10, 5, ROUND(200.00*10*1.05,2)) RETURNING id`);
      await pool.query(`INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES 
        ($1, 1, 100, 6.00),
        ($1, 2, 80, 5.50),
        ($2, 3, 50, 8.00),
        ($2, 5, 30, 9.00)`, [p1.rows[0].id]);
      await pool.query(`INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES 
        ($1, 4, 40, 10.00)`, [p2.rows[0].id]);
      console.log('Seeded purchases and items');
    }
  } catch (e) {
    console.error('Seeding purchases failed:', e.message);
  }

  // Seed sales and items
  try {
    const sc = await pool.query('SELECT id FROM sales LIMIT 1');
    if (sc.rows.length === 0) {
      const s1 = await pool.query(`INSERT INTO sales (customer_id, total, product_name, payment_method, status, discount) VALUES (1, 600.00, 'Egg', 'Cash', 'Completed', 0) RETURNING id`);
      const s2 = await pool.query(`INSERT INTO sales (customer_id, total, product_name, payment_method, status, discount) VALUES (2, 1027.50, 'Panner', 'UPI', 'Completed', 0) RETURNING id`);
      await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES 
        ($1, 1, 30, 6.00),
        ($1, 2, 20, 5.50)`, [s1.rows[0].id]);
      await pool.query(`INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES 
        ($1, 3, 20, 8.00)`, [s2.rows[0].id]);
      console.log('Seeded sales and items');
    }
  } catch (e) {
    console.error('Seeding sales failed:', e.message);
  }

  // Seed payments
  try {
    const pay = await pool.query('SELECT id FROM payments LIMIT 1');
    if (pay.rows.length === 0) {
      await pool.query(`INSERT INTO payments (customer_id, invoice_id, amount, payment_mode) VALUES 
        (1, 1, 300.00, 'Cash'),
        (2, 2, 150.00, 'UPI')`);
      console.log('Seeded payments');
    }
  } catch (e) {
    console.error('Seeding payments failed:', e.message);
  }

  // Seed adjustments
  try {
    const adj = await pool.query('SELECT id FROM stock_adjustments LIMIT 1');
    if (adj.rows.length === 0) {
      await pool.query(`INSERT INTO stock_adjustments (product_id, adjustment_type, quantity, note) VALUES 
        (1, 'Breakage', 3, 'Damaged in transit'),
        (5, 'Wastage', 2, 'Expired')`);
      console.log('Seeded adjustments');
    }
  } catch (e) {
    console.error('Seeding adjustments failed:', e.message);
  }

  // Seed a purchase order with items
  try {
    const po = await pool.query('SELECT id FROM purchase_orders LIMIT 1');
    if (po.rows.length === 0) {
      const poIns = await pool.query(`INSERT INTO purchase_orders (supplier_id, status, expected_date, notes) VALUES (1, 'Draft', NOW() + INTERVAL '3 days', 'Initial restock') RETURNING id`);
      await pool.query(`INSERT INTO purchase_order_items (po_id, product_id, quantity, price) VALUES 
        ($1, 1, 50, 5.80),
        ($1, 2, 40, 5.30)`, [poIns.rows[0].id]);
      console.log('Seeded purchase order');
    }
  } catch (e) {
    console.error('Seeding purchase orders failed:', e.message);
  }
}

module.exports = seedDefaults;

