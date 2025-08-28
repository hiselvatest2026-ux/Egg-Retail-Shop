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

