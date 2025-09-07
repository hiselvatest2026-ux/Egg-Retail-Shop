const pool = require('../models/db');

exports.listRoutes = async (_req, res) => {
  try { const r = await pool.query('SELECT * FROM routes ORDER BY active DESC, route_number ASC'); res.json(r.rows); }
  catch (e) { res.status(500).send(e.message); }
};

exports.createRoute = async (req, res) => {
  try {
    const { route_number, route_name, vehicle_number, active = true, salesman_name, mobile, area_name, pincode } = req.body;
    const r = await pool.query('INSERT INTO routes (route_number, route_name, vehicle_number, active, salesman_name, mobile, area_name, pincode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [route_number, route_name, vehicle_number || null, active, salesman_name || null, mobile || null, area_name || null, pincode || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { route_number, route_name, vehicle_number, active, salesman_name, mobile, area_name, pincode } = req.body;
    const r = await pool.query('UPDATE routes SET route_number=COALESCE($1,route_number), route_name=COALESCE($2,route_name), vehicle_number=COALESCE($3,vehicle_number), active=COALESCE($4,active), salesman_name=COALESCE($5,salesman_name), mobile=COALESCE($6,mobile), area_name=COALESCE($7,area_name), pincode=COALESCE($8,pincode) WHERE id=$9 RETURNING *', [route_number ?? null, route_name ?? null, vehicle_number ?? null, active ?? null, salesman_name ?? null, mobile ?? null, area_name ?? null, pincode ?? null, id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.deleteRoute = async (req, res) => {
  try { const { id } = req.params; await pool.query('DELETE FROM routes WHERE id=$1', [id]); res.json({ message: 'Route deleted' }); }
  catch (e) { res.status(500).send(e.message); }
};

