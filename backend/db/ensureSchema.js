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
    ,"ALTER TABLE IF EXISTS purchase_items ADD COLUMN IF NOT EXISTS mfg_date DATE;"
    ,"ALTER TABLE IF EXISTS sale_items ADD COLUMN IF NOT EXISTS location_id INT REFERENCES locations(id);"
    ,"ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);"
    ,"ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Completed';"
    ,"ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0;"
    ,"ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);"
    ,"ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS category VARCHAR(20);"
    ,"ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS gstin VARCHAR(20);"
    
    ,"CREATE SEQUENCE IF NOT EXISTS customer_code_seq START 1;"
    ,"ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS customer_code VARCHAR(20);"
    ,"ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(10,2) DEFAULT 0;"
    ,"UPDATE customers SET customer_code = COALESCE(customer_code, 'C' || LPAD(CAST(id AS TEXT), 6, '0')) WHERE customer_code IS NULL;"
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
    ,`CREATE TABLE IF NOT EXISTS pricing_master (
      id SERIAL PRIMARY KEY,
      customer_id INT REFERENCES customers(id),
      category VARCHAR(20) NOT NULL,
      material_code VARCHAR(50) NOT NULL,
      base_price NUMERIC(10,2) NOT NULL,
      gst_percent NUMERIC(5,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(customer_id, category, material_code)
    );`
    ,`CREATE SEQUENCE IF NOT EXISTS vendor_code_seq START 1;`
    ,`CREATE TABLE IF NOT EXISTS vendors (
      id SERIAL PRIMARY KEY,
      vendor_code VARCHAR(20) UNIQUE NOT NULL DEFAULT ('V' || LPAD(nextval('vendor_code_seq')::text, 6, '0')),
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      address VARCHAR(255),
      pincode VARCHAR(10),
      gstin VARCHAR(20),
      credit_terms VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    );`
    ,"ALTER TABLE IF EXISTS purchases ADD COLUMN IF NOT EXISTS vendor_id INT REFERENCES vendors(id);"
    ,"ALTER TABLE IF EXISTS purchases ADD COLUMN IF NOT EXISTS product_name VARCHAR(100);"
    ,"ALTER TABLE IF EXISTS purchases ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(10,2);"
    ,"ALTER TABLE IF EXISTS purchases ADD COLUMN IF NOT EXISTS quantity INT;"
    ,"ALTER TABLE IF EXISTS purchases ADD COLUMN IF NOT EXISTS gst_percent NUMERIC(5,2);"
    ,"ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS product_name VARCHAR(100);"
    ,"ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) DEFAULT 'Cash';"
    ,"ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS category VARCHAR(20);"
    ,"UPDATE metal_master SET part_code = 'M' || RIGHT(part_code, 5) WHERE part_code LIKE 'MCode%';"
    ,"UPDATE pricing_master SET material_code = 'M' || RIGHT(material_code, 5) WHERE material_code LIKE 'MCode%';"
    ,`CREATE TABLE IF NOT EXISTS opening_stocks (
      id SERIAL PRIMARY KEY,
      product_id INT REFERENCES products(id) UNIQUE,
      quantity INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    );`
    ,`CREATE TABLE IF NOT EXISTS opening_stocks_material (
      material_code VARCHAR(50) PRIMARY KEY REFERENCES metal_master(part_code),
      quantity INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    );`
    ,`CREATE TABLE IF NOT EXISTS routes (
      id SERIAL PRIMARY KEY,
      route_number VARCHAR(50) UNIQUE NOT NULL,
      route_name VARCHAR(100) NOT NULL,
      vehicle_number VARCHAR(50),
      salesman_name VARCHAR(100),
      mobile VARCHAR(20),
      area_name VARCHAR(100),
      pincode VARCHAR(10),
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );`
    ,`CREATE TABLE IF NOT EXISTS route_trips (
      id SERIAL PRIMARY KEY,
      route_id INT REFERENCES routes(id),
      service_date DATE NOT NULL,
      route_name VARCHAR(100),
      vehicle_number VARCHAR(50),
      driver VARCHAR(100),
      status VARCHAR(20) DEFAULT 'Planned',
      created_at TIMESTAMP DEFAULT NOW()
    );`
    ,"ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS route_trip_id INT REFERENCES route_trips(id);"
    ,`CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(150),
      gstin VARCHAR(20),
      address TEXT,
      phone VARCHAR(20),
      email VARCHAR(100),
      logo_url TEXT
    );`
    ,"ALTER TABLE IF EXISTS metal_master ADD COLUMN IF NOT EXISTS hsn_sac VARCHAR(10);"
    // Performance indexes for faster invoice loads
    ,"CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);"
    ,"CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);"
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

