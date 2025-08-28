const pool = require('../models/db');

exports.getPricing = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pm.*, c.name as customer_name, mm.description as material_description 
      FROM pricing_master pm 
      LEFT JOIN customers c ON pm.customer_id = c.id 
      LEFT JOIN metal_master mm ON pm.material_code = mm.part_code 
      ORDER BY pm.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createPricing = async (req, res) => {
  try {
    const { customer_id, category, material_code, base_price } = req.body;
    
    // Get GST % from material master
    const materialResult = await pool.query('SELECT gst_percent FROM metal_master WHERE part_code = $1', [material_code]);
    if (materialResult.rows.length === 0) {
      return res.status(400).json({ message: 'Material not found' });
    }
    const gst_percent = materialResult.rows[0].gst_percent;
    
    const result = await pool.query(
      'INSERT INTO pricing_master (customer_id, category, material_code, base_price, gst_percent) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [customer_id || null, category, material_code, base_price, gst_percent]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      res.status(400).json({ message: 'Pricing already exists for this customer, category, and material combination' });
    } else {
      res.status(500).send(err.message);
    }
  }
};

exports.updatePricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id, category, material_code, base_price } = req.body;
    
    // Get GST % from material master
    const materialResult = await pool.query('SELECT gst_percent FROM metal_master WHERE part_code = $1', [material_code]);
    if (materialResult.rows.length === 0) {
      return res.status(400).json({ message: 'Material not found' });
    }
    const gst_percent = materialResult.rows[0].gst_percent;
    
    const result = await pool.query(
      'UPDATE pricing_master SET customer_id=COALESCE($1, customer_id), category=COALESCE($2, category), material_code=COALESCE($3, material_code), base_price=COALESCE($4, base_price), gst_percent=$5 WHERE id=$6 RETURNING *',
      [customer_id ?? null, category ?? null, material_code ?? null, base_price ?? null, gst_percent, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      res.status(400).json({ message: 'Pricing already exists for this customer, category, and material combination' });
    } else {
      res.status(500).send(err.message);
    }
  }
};

exports.deletePricing = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM pricing_master WHERE id=$1', [id]);
    res.json({ message: 'Pricing deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};