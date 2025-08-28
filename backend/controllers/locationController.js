const pool = require('../models/db');

exports.listLocations = async (_req, res) => {
  try {
    const r = await pool.query('SELECT id, name FROM locations ORDER BY id ASC');
    res.json(r.rows);
  } catch (e) { res.status(500).send(e.message); }
};

