const pool = require('../models/db');

exports.getSuppliers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, contact_info FROM suppliers ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { name, contact_info } = req.body;
    const result = await pool.query(
      'INSERT INTO suppliers (name, contact_info) VALUES ($1, $2) RETURNING id, name, contact_info',
      [name, contact_info || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_info } = req.body;
    const result = await pool.query(
      'UPDATE suppliers SET name = COALESCE($1, name), contact_info = COALESCE($2, contact_info) WHERE id=$3 RETURNING id, name, contact_info',
      [name ?? null, contact_info ?? null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM suppliers WHERE id=$1', [id]);
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

