const pool = require('../models/db');

exports.getCustomers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, contact_info, phone, category, gstin, tax_applicability, credit_limit } = req.body;
    const result = await pool.query(
      'INSERT INTO customers (name, contact_info, phone, category, gstin, tax_applicability, credit_limit) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, contact_info || null, phone || null, category || null, gstin || null, tax_applicability || null, credit_limit ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_info, phone, category, gstin, tax_applicability, credit_limit } = req.body;
    const result = await pool.query(
      'UPDATE customers SET name=COALESCE($1, name), contact_info=COALESCE($2, contact_info), phone=COALESCE($3, phone), category=COALESCE($4, category), gstin=COALESCE($5, gstin), tax_applicability=COALESCE($6, tax_applicability), credit_limit=COALESCE($7, credit_limit) WHERE id=$8 RETURNING *',
      [name ?? null, contact_info ?? null, phone ?? null, category ?? null, gstin ?? null, tax_applicability ?? null, credit_limit ?? null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM customers WHERE id=$1', [id]);
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

