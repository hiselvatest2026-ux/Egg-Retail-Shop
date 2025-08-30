const express = require('express');
const router = express.Router();
const { getInsights } = require('../controllers/inventoryInsightsController');
const pool = require('../models/db');

router.get('/insights', getInsights);

// Opening stocks endpoints
router.get('/opening-stocks', async (_req, res) => {
  try {
    const r = await pool.query(`SELECT p.id AS product_id, p.name, COALESCE(op.quantity,0) AS quantity
                                FROM products p LEFT JOIN opening_stocks op ON op.product_id = p.id
                                ORDER BY p.name ASC`);
    res.json(r.rows);
  } catch (e) { res.status(500).send(e.message); }
});

router.put('/opening-stocks', async (req, res) => {
  try {
    const { items } = req.body; // [{product_id, quantity}]
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items array required' });
    await pool.query('BEGIN');
    for (const it of items) {
      await pool.query(`INSERT INTO opening_stocks (product_id, quantity) VALUES ($1,$2)
                        ON CONFLICT (product_id) DO UPDATE SET quantity=EXCLUDED.quantity, updated_at=NOW()`, [it.product_id, it.quantity]);
    }
    await pool.query('COMMIT');
    res.json({ message: 'Opening stocks saved' });
  } catch (e) { try { await pool.query('ROLLBACK'); } catch(_){} res.status(500).send(e.message); }
});

module.exports = router;

