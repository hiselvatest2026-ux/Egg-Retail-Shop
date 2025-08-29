const pool = require('../models/db');

exports.getVendors = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, vendor_code, name, phone, address, pincode, gstin, credit_terms FROM vendors ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createVendor = async (req, res) => {
  try {
    const { name, phone, address, pincode, gstin, credit_terms } = req.body;
    const result = await pool.query(
      `INSERT INTO vendors (name, phone, address, pincode, gstin, credit_terms)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, vendor_code, name, phone, address, pincode, gstin, credit_terms`,
      [name, phone || null, address || null, pincode || null, gstin || null, credit_terms || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, pincode, gstin, credit_terms } = req.body;
    const result = await pool.query(
      `UPDATE vendors SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         address = COALESCE($3, address),
         pincode = COALESCE($4, pincode),
         gstin = COALESCE($5, gstin),
         credit_terms = COALESCE($6, credit_terms)
       WHERE id = $7
       RETURNING id, vendor_code, name, phone, address, pincode, gstin, credit_terms`,
      [name ?? null, phone ?? null, address ?? null, pincode ?? null, gstin ?? null, credit_terms ?? null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM vendors WHERE id=$1', [id]);
    res.json({ message: 'Vendor deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

