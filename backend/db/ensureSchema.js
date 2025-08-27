const pool = require('../models/db');

async function ensureSchema() {
  const alters = [
    "ALTER TABLE IF EXISTS purchases ADD COLUMN IF NOT EXISTS egg_type VARCHAR(50);",
    "ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS egg_type VARCHAR(50);"
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

