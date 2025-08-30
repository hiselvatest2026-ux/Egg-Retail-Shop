const pool = require('../models/db');

exports.listRoutes = async (_req, res) => {
  try { const r = await pool.query('SELECT * FROM routes ORDER BY active DESC, route_number ASC'); res.json(r.rows); }
  catch (e) { res.status(500).send(e.message); }
};

exports.createRoute = async (req, res) => {
  try {
    const { route_number, route_name, vehicle_number, active = true } = req.body;
    const r = await pool.query('INSERT INTO routes (route_number, route_name, vehicle_number, active) VALUES ($1,$2,$3,$4) RETURNING *', [route_number, route_name, vehicle_number || null, active]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { route_number, route_name, vehicle_number, active } = req.body;
    const r = await pool.query('UPDATE routes SET route_number=COALESCE($1,route_number), route_name=COALESCE($2,route_name), vehicle_number=COALESCE($3,vehicle_number), active=COALESCE($4,active) WHERE id=$5 RETURNING *', [route_number ?? null, route_name ?? null, vehicle_number ?? null, active ?? null, id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.deleteRoute = async (req, res) => {
  try { const { id } = req.params; await pool.query('DELETE FROM routes WHERE id=$1', [id]); res.json({ message: 'Route deleted' }); }
  catch (e) { res.status(500).send(e.message); }
};

