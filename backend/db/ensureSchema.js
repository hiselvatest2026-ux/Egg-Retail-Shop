const pool = require('../models/db');

async function ensureSchema() {
  const alters = [
    "ALTER TABLE IF EXISTS purchases ADD COLUMN IF NOT EXISTS egg_type VARCHAR(50);",
    "ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS egg_type VARCHAR(50);",
    `CREATE TABLE IF NOT EXISTS stock_adjustments (
      id SERIAL PRIMARY KEY,
      product_id INT REFERENCES products(id),
      adjustment_type VARCHAR(20) NOT NULL,
      quantity INT NOT NULL,
      note VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );`
    ,`CREATE TABLE IF NOT EXISTS stock_counts (
      id SERIAL PRIMARY KEY,
      product_id INT REFERENCES products(id),
      counted_qty INT NOT NULL,
      note VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );`
    ,`CREATE TABLE IF NOT EXISTS locations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL
    );`
    ,"ALTER TABLE IF EXISTS purchase_items ADD COLUMN IF NOT EXISTS location_id INT REFERENCES locations(id);"
    ,"ALTER TABLE IF EXISTS sale_items ADD COLUMN IF NOT EXISTS location_id INT REFERENCES locations(id);"
    ,"ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);"
    ,"ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Completed';"
    ,"ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0;"
    ,"ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);"
    ,"ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS category VARCHAR(20);"
    ,"ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS gstin VARCHAR(20);"
    ,"ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS tax_applicability VARCHAR(20);"
    ,`CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      supplier_id INT REFERENCES suppliers(id),
      status VARCHAR(20) DEFAULT 'Draft',
      created_at TIMESTAMP DEFAULT NOW(),
      expected_date DATE,
      notes VARCHAR(255)
    );`
    ,`CREATE TABLE IF NOT EXISTS purchase_order_items (
      id SERIAL PRIMARY KEY,
      po_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
      product_id INT REFERENCES products(id),
      quantity INT NOT NULL,
      price NUMERIC(10,2) NOT NULL
    );`
    ,`CREATE TABLE IF NOT EXISTS goods_receipts (
      id SERIAL PRIMARY KEY,
      po_id INT REFERENCES purchase_orders(id),
      product_id INT REFERENCES products(id),
      received_qty INT NOT NULL,
      quality_note VARCHAR(255),
      received_at TIMESTAMP DEFAULT NOW()
    );`
    ,`CREATE TABLE IF NOT EXISTS metal_master (
      id SERIAL PRIMARY KEY,
      part_code VARCHAR(50) UNIQUE NOT NULL,
      metal_type VARCHAR(100) NOT NULL,
      gst_percent NUMERIC(5,2) NOT NULL,
      description VARCHAR(255)
    );`
  ];
  for (const sql of alters) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.error('Schema ensure failed for SQL:', sql, err);
    }
  }
}

module.exports = ensureSchema;

