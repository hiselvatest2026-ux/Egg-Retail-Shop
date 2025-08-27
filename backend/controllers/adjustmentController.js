const pool = require('../models/db');

exports.listAdjustments = async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT a.id, a.product_id, p.name AS product_name, a.adjustment_type, a.quantity, a.note, a.created_at
      FROM stock_adjustments a LEFT JOIN products p ON p.id = a.product_id
      ORDER BY a.id DESC`);
    res.json(r.rows);
  } catch (e) { res.status(500).send(e.message); }
};

exports.createAdjustment = async (req, res) => {
  try {
    const { product_id, adjustment_type, quantity, note } = req.body;
    const r = await pool.query(
      'INSERT INTO stock_adjustments (product_id, adjustment_type, quantity, note) VALUES ($1,$2,$3,$4) RETURNING *',
      [product_id, adjustment_type, quantity, note || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.deleteAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM stock_adjustments WHERE id=$1', [id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).send(e.message); }
};

