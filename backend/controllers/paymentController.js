const pool = require('../models/db');

exports.getPayments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payments');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { customer_id, invoice_id, amount, payment_mode } = req.body;
    const result = await pool.query(
      'INSERT INTO payments (customer_id, invoice_id, amount, payment_mode) VALUES ($1, $2, $3, $4) RETURNING *',
      [customer_id, invoice_id, amount, payment_mode]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_mode } = req.body;
    const result = await pool.query(
      'UPDATE payments SET amount=$1, payment_mode=$2 WHERE id=$3 RETURNING *',
      [amount, payment_mode, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM payments WHERE id=$1', [id]);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

