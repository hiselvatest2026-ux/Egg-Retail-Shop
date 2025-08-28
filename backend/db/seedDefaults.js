const pool = require('../models/db');

async function seedDefaults() {
  try {
    const sup = await pool.query('SELECT id FROM suppliers LIMIT 1');
    if (sup.rows.length === 0) {
      await pool.query('INSERT INTO suppliers (name, contact_info) VALUES ($1,$2)', [
        'Default Supplier',
        'contact@example.com'
      ]);
      console.log('Seeded default supplier');
    }
  } catch (e) {
    console.error('Seeding suppliers failed:', e.message);
  }

  try {
    const cust = await pool.query('SELECT id FROM customers LIMIT 1');
    if (cust.rows.length === 0) {
      await pool.query('INSERT INTO customers (name, contact_info) VALUES ($1,$2)', [
        'Default Customer',
        'customer@example.com'
      ]);
      console.log('Seeded default customer');
    }
  } catch (e) {
    console.error('Seeding customers failed:', e.message);
  }

  try {
    const prod = await pool.query('SELECT id FROM products LIMIT 1');
    if (prod.rows.length === 0) {
      await pool.query('INSERT INTO products (name, price, batch_number, expiry_date) VALUES ($1,$2,$3,$4)', [
        'Default Egg',
        5.00,
        null,
        null
      ]);
      console.log('Seeded default product');
    }
  } catch (e) {
    console.error('Seeding products failed:', e.message);
  }

  try {
    const loc = await pool.query('SELECT id FROM locations LIMIT 1');
    if (loc.rows.length === 0) {
      await pool.query('INSERT INTO locations (name) VALUES ($1)', ['Main Outlet']);
      console.log('Seeded default location');
    }
  } catch (e) {
    console.error('Seeding locations failed:', e.message);
  }
}

module.exports = seedDefaults;

