const pool = require('../models/db');

exports.getSales = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sales');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createSale = async (req, res) => {
  try {
    const { customer_id, total } = req.body;
    const result = await pool.query(
      'INSERT INTO sales (customer_id, total) VALUES ($1, $2) RETURNING *',
      [customer_id, total]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { total } = req.body;
    const result = await pool.query(
      'UPDATE sales SET total=$1 WHERE id=$2 RETURNING *',
      [total, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sales WHERE id=$1', [id]);
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

