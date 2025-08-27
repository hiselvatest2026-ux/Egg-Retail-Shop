const pool = require('../models/db');

async function recalcSaleTotal(saleId) {
  const totalResult = await pool.query(
    'SELECT COALESCE(SUM(quantity * price), 0) AS total FROM sale_items WHERE sale_id=$1',
    [saleId]
  );
  const total = totalResult.rows[0]?.total ?? 0;
  await pool.query('UPDATE sales SET total=$1 WHERE id=$2', [total, saleId]);
}

exports.listItems = async (req, res) => {
  try {
    const { id } = req.params; // sale id
    const result = await pool.query(
      `SELECT si.id, si.product_id, p.name AS product_name, si.quantity, si.price, (si.quantity*si.price) AS line_total
       FROM sale_items si JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = $1 ORDER BY si.id ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createItem = async (req, res) => {
  try {
    const { id } = req.params; // sale id
    const { product_id, quantity, price } = req.body;
    const result = await pool.query(
      'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, product_id, quantity, price]
    );
    await recalcSaleTotal(id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { saleId, itemId } = req.params;
    const { product_id, quantity, price } = req.body;
    const result = await pool.query(
      'UPDATE sale_items SET product_id=COALESCE($1, product_id), quantity=COALESCE($2, quantity), price=COALESCE($3, price) WHERE id=$4 AND sale_id=$5 RETURNING *',
      [product_id ?? null, quantity ?? null, price ?? null, itemId, saleId]
    );
    await recalcSaleTotal(saleId);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { saleId, itemId } = req.params;
    await pool.query('DELETE FROM sale_items WHERE id=$1 AND sale_id=$2', [itemId, saleId]);
    await recalcSaleTotal(saleId);
    res.json({ message: 'Sale item deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

