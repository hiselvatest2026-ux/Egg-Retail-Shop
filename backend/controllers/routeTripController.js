const pool = require('../models/db');

exports.listTrips = async (req, res) => {
  try {
    const { date } = req.query;
    const params = [];
    let where = '';
    if (date) { params.push(date); where = 'WHERE service_date = $1'; }
    const r = await pool.query(`SELECT rt.*, r.route_number, r.route_name AS master_route_name FROM route_trips rt LEFT JOIN routes r ON r.id=rt.route_id ${where} ORDER BY service_date DESC, id DESC`, params);
    res.json(r.rows);
  } catch (e) { res.status(500).send(e.message); }
};

exports.createTrip = async (req, res) => {
  try {
    const { route_id, service_date, route_name, vehicle_number, driver, status } = req.body;
    const r = await pool.query('INSERT INTO route_trips (route_id, service_date, route_name, vehicle_number, driver, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [route_id || null, service_date, route_name || null, vehicle_number || null, driver || null, status || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { route_id, service_date, route_name, vehicle_number, driver, status } = req.body;
    const r = await pool.query('UPDATE route_trips SET route_id=COALESCE($1,route_id), service_date=COALESCE($2,service_date), route_name=COALESCE($3,route_name), vehicle_number=COALESCE($4,vehicle_number), driver=COALESCE($5,driver), status=COALESCE($6,status) WHERE id=$7 RETURNING *', [route_id ?? null, service_date ?? null, route_name ?? null, vehicle_number ?? null, driver ?? null, status ?? null, id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.deleteTrip = async (req, res) => {
  try { const { id } = req.params; await pool.query('DELETE FROM route_trips WHERE id=$1', [id]); res.json({ message: 'Route trip deleted' }); }
  catch (e) { res.status(500).send(e.message); }
};

