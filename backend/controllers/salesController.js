const pool = require('../models/db');

exports.getSales = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sales');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createSale = async (req, res) => {
  try {
    const { customer_id, total, egg_type, payment_method, status = 'Completed', discount = 0 } = req.body;
    const result = await pool.query(
      'INSERT INTO sales (customer_id, total, egg_type, payment_method, status, discount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [customer_id, total, egg_type || null, payment_method || null, status, discount]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id, total, egg_type, payment_method, status, discount } = req.body;
    const result = await pool.query(
      'UPDATE sales SET customer_id=COALESCE($1, customer_id), total=COALESCE($2, total), egg_type=COALESCE($3, egg_type), payment_method=COALESCE($4,payment_method), status=COALESCE($5,status), discount=COALESCE($6,discount) WHERE id=$7 RETURNING *',
      [customer_id ?? null, total ?? null, egg_type ?? null, payment_method ?? null, status ?? null, discount ?? null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    // Remove dependent payments first to avoid FK constraint failures
    await pool.query('DELETE FROM payments WHERE invoice_id=$1', [id]);
    await pool.query('DELETE FROM sales WHERE id=$1', [id]);
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getSaleInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const saleResult = await pool.query(
      `SELECT s.*, c.name AS customer_name
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.id=$1`,
      [id]
    );
    if (saleResult.rows.length === 0) return res.status(404).json({ message: 'Sale not found' });
    const sale = saleResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT si.id,
              si.product_id,
              COALESCE(p.name, 'Product #' || si.product_id) AS product_name,
              si.quantity,
              si.price,
              (si.quantity * si.price) AS line_total
       FROM sale_items si
       LEFT JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = $1
       ORDER BY si.id ASC`,
      [id]
    );

    const totalResult = await pool.query(
      'SELECT COALESCE(SUM(quantity * price), 0) AS total FROM sale_items WHERE sale_id=$1',
      [id]
    );
    const computedTotal = totalResult.rows[0]?.total ?? 0;
    const items = itemsResult.rows;
    const total = (items && items.length > 0) ? computedTotal : (sale.total ?? 0);

    res.json({ sale, items, total });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

