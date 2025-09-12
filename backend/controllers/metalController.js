const pool = require('../models/db');

exports.listMetals = async (_req, res) => {
  try { const r = await pool.query('SELECT * FROM metal_master ORDER BY id DESC'); res.json(r.rows); }
  catch (e) { res.status(500).send(e.message); }
};

exports.createMetal = async (req, res) => {
  try {
    const { metal_type, gst_percent, description, shelf_life } = req.body;
    if (gst_percent == null) return res.status(400).json({ message: 'GST % is required' });
    // Generate Material Code like MCode00001 based on next id
    const nextRes = await pool.query('SELECT COALESCE(MAX(id),0)+1 AS next_id FROM metal_master');
    const nextId = Number(nextRes.rows[0]?.next_id || 1);
    const part_code = `M${String(nextId).padStart(5, '0')}`;
    const r = await pool.query('INSERT INTO metal_master (part_code, metal_type, gst_percent, description, shelf_life) VALUES ($1,$2,$3,$4,$5) RETURNING *', [part_code, metal_type, gst_percent, description || null, shelf_life || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.updateMetal = async (req, res) => {
  try {
    const { id } = req.params;
    const { metal_type, description, shelf_life } = req.body;
    // gst_percent is not updatable per requirement; part_code fixed
    const r = await pool.query('UPDATE metal_master SET metal_type=COALESCE($1, metal_type), description=COALESCE($2, description), shelf_life=COALESCE($3, shelf_life) WHERE id=$4 RETURNING *', [metal_type ?? null, description ?? null, shelf_life ?? null, id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.deleteMetal = async (req, res) => {
  try { const { id } = req.params; await pool.query('DELETE FROM metal_master WHERE id=$1', [id]); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).send(e.message); }
};

