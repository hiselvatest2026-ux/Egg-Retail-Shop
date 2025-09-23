const pool = require('../models/db');

exports.listAdjustments = async (_req, res) => {
  try {
    const r = await pool.query(`
      WITH mm_guess AS (
        SELECT p.id AS product_id,
               CASE
                 WHEN LOWER(p.name) LIKE 'egg%' THEN 'M00001'
                 ELSE NULL
               END AS part_code
        FROM products p
      )
      SELECT a.id,
             a.product_id,
             p.name AS product_name,
             mm.part_code AS material_code,
             mm.metal_type AS material_type,
             a.adjustment_type,
             a.quantity,
             a.note,
             a.created_at
      FROM stock_adjustments a
      LEFT JOIN products p ON p.id = a.product_id
      LEFT JOIN mm_guess g ON g.product_id = a.product_id
      LEFT JOIN metal_master mm ON mm.part_code = g.part_code
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

