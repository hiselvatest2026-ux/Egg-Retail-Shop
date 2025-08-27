const pool = require('../models/db');
exports.getPurchases = async (req, res) => {
    try { const result = await pool.query('SELECT * FROM purchases'); res.json(result.rows); }
    catch (err) { res.status(500).send(err.message); }
};
exports.createPurchase = async (req, res) => {
    try {
        const { supplier_id, total, egg_type } = req.body;
        const result = await pool.query('INSERT INTO purchases (supplier_id, total, egg_type) VALUES ($1,$2,$3) RETURNING *', [supplier_id, total, egg_type || null]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).send(err.message); }
};
exports.updatePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const { total, egg_type } = req.body;
        const result = await pool.query('UPDATE purchases SET total=COALESCE($1,total), egg_type=COALESCE($2, egg_type) WHERE id=$3 RETURNING *', [total ?? null, egg_type ?? null, id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).send(err.message); }
};
exports.deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM purchases WHERE id=$1', [id]);
        res.json({ message: 'Purchase deleted' });
    } catch (err) { res.status(500).send(err.message); }
};