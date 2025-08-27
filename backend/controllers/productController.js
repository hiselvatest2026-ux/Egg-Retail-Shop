const pool = require('../models/db');

exports.getProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, batch_number, expiry_date } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, price, batch_number, expiry_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, batch_number || null, expiry_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, batch_number, expiry_date } = req.body;
    const result = await pool.query(
      'UPDATE products SET name=COALESCE($1, name), price=COALESCE($2, price), batch_number=COALESCE($3, batch_number), expiry_date=COALESCE($4, expiry_date) WHERE id=$5 RETURNING *',
      [name ?? null, price ?? null, batch_number ?? null, expiry_date ?? null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id=$1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

