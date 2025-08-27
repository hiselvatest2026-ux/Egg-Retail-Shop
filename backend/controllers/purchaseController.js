const pool = require('../models/db');
exports.getPurchases = async (req, res) => {
    try { const result = await pool.query('SELECT * FROM purchases'); res.json(result.rows); }
    catch (err) { res.status(500).send(err.message); }
};
exports.createPurchase = async (req, res) => {
    try {
        const { supplier_id, total } = req.body;
        const result = await pool.query('INSERT INTO purchases (supplier_id, total) VALUES ($1,$2) RETURNING *', [supplier_id, total]);
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).send(err.message); }
};
exports.updatePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const { total } = req.body;
        const result = await pool.query('UPDATE purchases SET total=$1 WHERE id=$2 RETURNING *', [total, id]);
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