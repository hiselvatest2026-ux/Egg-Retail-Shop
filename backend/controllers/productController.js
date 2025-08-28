const pool = require('../models/db');

exports.getProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, batch_number, expiry_date } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, price, batch_number, expiry_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, batch_number || null, expiry_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, batch_number, expiry_date } = req.body;
    const result = await pool.query(
      'UPDATE products SET name=COALESCE($1, name), price=COALESCE($2, price), batch_number=COALESCE($3, batch_number), expiry_date=COALESCE($4, expiry_date) WHERE id=$5 RETURNING *',
      [name ?? null, price ?? null, batch_number ?? null, expiry_date ?? null, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id=$1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getStock = async (req, res) => {
  try {
    const { location_id } = req.query;
    const locPI = location_id ? 'WHERE pi.location_id = $1' : '';
    const locSI = location_id ? 'WHERE si.location_id = $1' : '';
    const params = location_id ? [location_id] : [];
    const result = await pool.query(`
      WITH purchase_qty AS (
        SELECT product_id, SUM(quantity) AS qty FROM purchase_items pi ${locPI} GROUP BY product_id
      ),
      sales_qty AS (
        SELECT product_id, SUM(quantity) AS qty FROM sale_items si ${locSI} GROUP BY product_id
      ),
      adjustments AS (
        SELECT product_id,
               SUM(CASE WHEN adjustment_type IN ('Missing','Wastage','Breakage') THEN quantity ELSE 0 END) AS deducted
        FROM stock_adjustments
        GROUP BY product_id
      ),
      all_ids AS (
        SELECT id AS product_id FROM products
        UNION
        SELECT product_id FROM purchase_items
        UNION
        SELECT product_id FROM sale_items
      )
      SELECT a.product_id,
             COALESCE(p.name, 'Product #' || a.product_id) AS name,
             COALESCE(pq.qty, 0) AS purchased_qty,
             COALESCE(sq.qty, 0) AS sold_qty,
             COALESCE(pq.qty, 0) - COALESCE(sq.qty, 0) - COALESCE(adj.deducted,0) AS stock
      FROM all_ids a
      LEFT JOIN products p ON p.id = a.product_id
      LEFT JOIN purchase_qty pq ON pq.product_id = a.product_id
      LEFT JOIN sales_qty sq ON sq.product_id = a.product_id
      LEFT JOIN adjustments adj ON adj.product_id = a.product_id
      ORDER BY name ASC
    `, params);
    res.json(result.rows.map(r => ({
      product_id: r.product_id,
      name: r.name,
      purchased_qty: Number(r.purchased_qty || 0),
      sold_qty: Number(r.sold_qty || 0),
      stock: Number(r.stock || 0)
    })));
  } catch (err) { res.status(500).send(err.message); }
};

