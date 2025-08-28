const pool = require('../models/db');

exports.listMetals = async (_req, res) => {
  try { const r = await pool.query('SELECT * FROM metal_master ORDER BY id DESC'); res.json(r.rows); }
  catch (e) { res.status(500).send(e.message); }
};

exports.createMetal = async (req, res) => {
  try {
    const { part_code, metal_type, gst_percent, description } = req.body;
    if (gst_percent == null) return res.status(400).json({ message: 'GST % is required' });
    const r = await pool.query('INSERT INTO metal_master (part_code, metal_type, gst_percent, description) VALUES ($1,$2,$3,$4) RETURNING *', [part_code, metal_type, gst_percent, description || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.updateMetal = async (req, res) => {
  try {
    const { id } = req.params;
    const { metal_type, description } = req.body;
    // gst_percent is not updatable per requirement; part_code fixed
    const r = await pool.query('UPDATE metal_master SET metal_type=COALESCE($1, metal_type), description=COALESCE($2, description) WHERE id=$3 RETURNING *', [metal_type ?? null, description ?? null, id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.deleteMetal = async (req, res) => {
  try { const { id } = req.params; await pool.query('DELETE FROM metal_master WHERE id=$1', [id]); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).send(e.message); }
};

