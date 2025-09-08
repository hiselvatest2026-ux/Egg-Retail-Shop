const pool = require('../models/db');

exports.listRoutes = async (_req, res) => {
  try { const r = await pool.query('SELECT * FROM routes ORDER BY active DESC, route_number ASC'); res.json(r.rows); }
  catch (e) { res.status(500).send(e.message); }
};

exports.createRoute = async (req, res) => {
  try {
    let { route_number, route_name, vehicle_number, active = true, salesman_name, mobile, area_name, pincode } = req.body;
    // Auto-generate route_number if missing (e.g., R001, R002 ...)
    if (!route_number) {
      try {
        const nx = await pool.query(`SELECT COALESCE(MAX(NULLIF(regexp_replace(route_number, '\\D', '', 'g'), '')::INT), 0) + 1 AS nxt FROM routes`);
        const n = String(nx.rows[0]?.nxt || 1);
        route_number = 'R' + n.padStart(3, '0');
      } catch (_) {
        route_number = 'R001';
      }
    }
    // Backward-compatible insert: include only columns that exist
    const colsRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='routes'`);
    const present = new Set((colsRes.rows||[]).map(r=>r.column_name));
    const allCols = ['route_number','route_name','vehicle_number','active','salesman_name','mobile','area_name','pincode'];
    const valuesByCol = {
      route_number,
      route_name,
      vehicle_number: vehicle_number || null,
      active,
      salesman_name: salesman_name || null,
      mobile: mobile || null,
      area_name: area_name || null,
      pincode: pincode || null
    };
    const cols = allCols.filter(c => present.has(c));
    const placeholders = cols.map((_,i)=>`$${i+1}`).join(',');
    const values = cols.map(c => valuesByCol[c]);
    const sql = `INSERT INTO routes (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`;
    const r = await pool.query(sql, values);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { route_number, route_name, vehicle_number, active, salesman_name, mobile, area_name, pincode } = req.body;
    // Backward-compatible update: only update columns that exist
    const colsRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='routes'`);
    const present = new Set((colsRes.rows||[]).map(r=>r.column_name));
    const candidates = [
      ['route_number', route_number],
      ['route_name', route_name],
      ['vehicle_number', vehicle_number],
      ['active', active],
      ['salesman_name', salesman_name],
      ['mobile', mobile],
      ['area_name', area_name],
      ['pincode', pincode]
    ];
    const updatable = candidates.filter(([c,v]) => present.has(c) && v !== undefined);
    if (updatable.length === 0) {
      const r0 = await pool.query('SELECT * FROM routes WHERE id=$1', [id]);
      return res.json(r0.rows[0] || null);
    }
    const setSql = updatable.map(([c],i)=>`${c}=COALESCE($${i+1}, ${c})`).join(', ');
    const params = updatable.map(([,v])=>v);
    params.push(id);
    const r = await pool.query(`UPDATE routes SET ${setSql} WHERE id=$${params.length} RETURNING *`, params);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.deleteRoute = async (req, res) => {
  try { const { id } = req.params; await pool.query('DELETE FROM routes WHERE id=$1', [id]); res.json({ message: 'Route deleted' }); }
  catch (e) { res.status(500).send(e.message); }
};

