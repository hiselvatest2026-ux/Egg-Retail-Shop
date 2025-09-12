const pool = require('../models/db');

async function recalcPurchaseTotal(purchaseId) {
  const totalResult = await pool.query(
    'SELECT COALESCE(SUM(quantity * price), 0) AS total FROM purchase_items WHERE purchase_id=$1',
    [purchaseId]
  );
  const total = totalResult.rows[0]?.total ?? 0;
  await pool.query('UPDATE purchases SET total=$1 WHERE id=$2', [total, purchaseId]);
}

async function incrementOpeningStock(productId, deltaQty) {
  if (!productId || !Number.isFinite(Number(deltaQty)) || Number(deltaQty) === 0) return;
  const qty = Number(deltaQty);
  if (qty > 0) {
    await pool.query(
      `INSERT INTO opening_stocks (product_id, quantity)
       VALUES ($1, $2)
       ON CONFLICT (product_id)
       DO UPDATE SET quantity = opening_stocks.quantity + EXCLUDED.quantity`,
      [productId, qty]
    );
  } else {
    // Decrement, clamp to 0
    await pool.query(
      `UPDATE opening_stocks
       SET quantity = GREATEST(0, quantity + $2)
       WHERE product_id = $1`,
      [productId, qty]
    );
  }
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
    const locHeader = req.headers['x-shop-id'];
    const locationId = locHeader ? Number(locHeader) : null;
    const result = await pool.query(
      'INSERT INTO purchase_items (purchase_id, product_id, quantity, price, mfg_date, location_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, product_id, quantity, price, req.body.mfg_date || null, locationId]
    );
    await recalcPurchaseTotal(id);
    // Opening stocks increment by purchased quantity
    await incrementOpeningStock(Number(product_id), Number(quantity));
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { purchaseId, itemId } = req.params;
    const { product_id, quantity, price } = req.body;
    // Load existing to compute deltas for opening stock
    const existingRes = await pool.query('SELECT product_id, quantity FROM purchase_items WHERE id=$1 AND purchase_id=$2', [itemId, purchaseId]);
    const existing = existingRes.rows[0];
    const result = await pool.query(
      'UPDATE purchase_items SET product_id=COALESCE($1, product_id), quantity=COALESCE($2, quantity), price=COALESCE($3, price) WHERE id=$4 AND purchase_id=$5 RETURNING *',
      [product_id ?? null, quantity ?? null, price ?? null, itemId, purchaseId]
    );
    await recalcPurchaseTotal(purchaseId);
    // Adjust opening stock for delta
    if (existing) {
      const newProdId = result.rows[0]?.product_id ?? existing.product_id;
      const newQty = result.rows[0]?.quantity ?? existing.quantity;
      if (newProdId === existing.product_id) {
        const delta = Number(newQty) - Number(existing.quantity);
        if (delta !== 0) await incrementOpeningStock(Number(newProdId), delta);
      } else {
        // Move quantity from old product to new product
        await incrementOpeningStock(Number(existing.product_id), -Number(existing.quantity));
        await incrementOpeningStock(Number(newProdId), Number(newQty));
      }
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { purchaseId, itemId } = req.params;
    // Load existing to decrement opening
    const existingRes = await pool.query('SELECT product_id, quantity FROM purchase_items WHERE id=$1 AND purchase_id=$2', [itemId, purchaseId]);
    await pool.query('DELETE FROM purchase_items WHERE id=$1 AND purchase_id=$2', [itemId, purchaseId]);
    await recalcPurchaseTotal(purchaseId);
    const existing = existingRes.rows[0];
    if (existing) {
      await incrementOpeningStock(Number(existing.product_id), -Number(existing.quantity));
    }
    res.json({ message: 'Purchase item deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

