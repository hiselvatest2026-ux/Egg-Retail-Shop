const pool = require('../models/db');

exports.getSuppliers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, contact_info FROM suppliers ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

