const pool = require('../models/db');

async function recalcPurchaseTotal(purchaseId) {
  const totalResult = await pool.query(
    'SELECT COALESCE(SUM(quantity * price), 0) AS total FROM purchase_items WHERE purchase_id=$1',
    [purchaseId]
  );
  const total = totalResult.rows[0]?.total ?? 0;
  await pool.query('UPDATE purchases SET total=$1 WHERE id=$2', [total, purchaseId]);
}

exports.listItems = async (req, res) => {
  try {
    const { id } = req.params; // purchase id
    const result = await pool.query(
      `SELECT pi.id, pi.product_id, p.name AS product_name, pi.quantity, pi.price, (pi.quantity*pi.price) AS line_total
       FROM purchase_items pi JOIN products p ON p.id = pi.product_id
       WHERE pi.purchase_id = $1 ORDER BY pi.id ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createItem = async (req, res) => {
  try {
    const { id } = req.params; // purchase id
    const { product_id, quantity, price } = req.body;
    const result = await pool.query(
      'INSERT INTO purchase_items (purchase_id, product_id, quantity, price, mfg_date) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [id, product_id, quantity, price, req.body.mfg_date || null]
    );
    await recalcPurchaseTotal(id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { purchaseId, itemId } = req.params;
    const { product_id, quantity, price } = req.body;
    const result = await pool.query(
      'UPDATE purchase_items SET product_id=COALESCE($1, product_id), quantity=COALESCE($2, quantity), price=COALESCE($3, price) WHERE id=$4 AND purchase_id=$5 RETURNING *',
      [product_id ?? null, quantity ?? null, price ?? null, itemId, purchaseId]
    );
    await recalcPurchaseTotal(purchaseId);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { purchaseId, itemId } = req.params;
    await pool.query('DELETE FROM purchase_items WHERE id=$1 AND purchase_id=$2', [itemId, purchaseId]);
    await recalcPurchaseTotal(purchaseId);
    res.json({ message: 'Purchase item deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

