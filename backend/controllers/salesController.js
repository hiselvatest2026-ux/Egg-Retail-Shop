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

exports.getSaleInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const saleResult = await pool.query('SELECT * FROM sales WHERE id=$1', [id]);
    if (saleResult.rows.length === 0) return res.status(404).json({ message: 'Sale not found' });
    const sale = saleResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT si.id, si.product_id, p.name AS product_name, si.quantity, si.price, (si.quantity * si.price) AS line_total
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = $1
       ORDER BY si.id ASC`,
      [id]
    );

    const totalResult = await pool.query(
      'SELECT COALESCE(SUM(quantity * price), 0) AS total FROM sale_items WHERE sale_id=$1',
      [id]
    );
    const computedTotal = totalResult.rows[0]?.total ?? 0;

    res.json({ sale, items: itemsResult.rows, total: computedTotal });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

