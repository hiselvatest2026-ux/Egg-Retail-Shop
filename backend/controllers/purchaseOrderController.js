const pool = require('../models/db');

exports.listPOs = async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT po.id, po.supplier_id, po.status, po.created_at, po.expected_date, po.notes,
             COALESCE(SUM(poi.quantity*poi.price),0) AS po_value
      FROM purchase_orders po
      LEFT JOIN purchase_order_items poi ON poi.po_id = po.id
      GROUP BY po.id
      ORDER BY po.id DESC`);
    res.json(r.rows);
  } catch (e) { res.status(500).send(e.message); }
};

exports.createPO = async (req, res) => {
  try {
    const { supplier_id, expected_date, notes, items } = req.body; // items: [{product_id, quantity, price}]
    const poRes = await pool.query(
      'INSERT INTO purchase_orders (supplier_id, expected_date, notes) VALUES ($1,$2,$3) RETURNING *',
      [supplier_id, expected_date || null, notes || null]
    );
    const po = poRes.rows[0];
    if (Array.isArray(items) && items.length) {
      for (const it of items) {
        await pool.query('INSERT INTO purchase_order_items (po_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)', [po.id, it.product_id, it.quantity, it.price]);
      }
    }
    res.status(201).json(po);
  } catch (e) { res.status(500).send(e.message); }
};

exports.addItem = async (req, res) => {
  try {
    const { id } = req.params; // po id
    const { product_id, quantity, price } = req.body;
    const r = await pool.query('INSERT INTO purchase_order_items (po_id, product_id, quantity, price) VALUES ($1,$2,$3,$4) RETURNING *', [id, product_id, quantity, price]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.updatePO = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, expected_date, notes } = req.body;
    const r = await pool.query('UPDATE purchase_orders SET status=COALESCE($1,status), expected_date=COALESCE($2,expected_date), notes=COALESCE($3,notes) WHERE id=$4 RETURNING *', [status ?? null, expected_date ?? null, notes ?? null, id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).send(e.message); }
};

exports.deletePO = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM purchase_order_items WHERE po_id=$1', [id]);
    await pool.query('DELETE FROM purchase_orders WHERE id=$1', [id]);
    res.json({ message: 'PO deleted' });
  } catch (e) { res.status(500).send(e.message); }
};

exports.receivePO = async (req, res) => {
  try {
    const { id } = req.params; // po id
    // fetch items
    const itemsRes = await pool.query('SELECT product_id, quantity, price FROM purchase_order_items WHERE po_id=$1', [id]);
    if (itemsRes.rows.length === 0) return res.status(400).json({ message: 'No items to receive' });
    const poRes = await pool.query('SELECT supplier_id FROM purchase_orders WHERE id=$1', [id]);
    if (poRes.rows.length === 0) return res.status(404).json({ message: 'PO not found' });
    const supplierId = poRes.rows[0].supplier_id;
    const total = itemsRes.rows.reduce((s,it)=> s + Number(it.quantity)*Number(it.price), 0);
    const purchaseRes = await pool.query('INSERT INTO purchases (supplier_id, total) VALUES ($1,$2) RETURNING *', [supplierId, total]);
    const purchase = purchaseRes.rows[0];
    for (const it of itemsRes.rows) {
      await pool.query('INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)', [purchase.id, it.product_id, it.quantity, it.price]);
      await pool.query('INSERT INTO goods_receipts (po_id, product_id, received_qty) VALUES ($1,$2,$3)', [id, it.product_id, it.quantity]);
    }
    await pool.query('UPDATE purchase_orders SET status=$1 WHERE id=$2', ['Received', id]);
    res.json({ purchase_id: purchase.id, total });
  } catch (e) { res.status(500).send(e.message); }
};

exports.reorderSuggestions = async (_req, res) => {
  try {
    const r = await pool.query(`
      WITH purchase_qty AS (
        SELECT product_id, SUM(quantity) AS qty FROM purchase_items GROUP BY product_id
      ),
      sales_qty AS (
        SELECT product_id, SUM(quantity) AS qty FROM sale_items GROUP BY product_id
      )
      SELECT p.id AS product_id, p.name,
             COALESCE(pq.qty,0) - COALESCE(sq.qty,0) AS stock
      FROM products p
      LEFT JOIN purchase_qty pq ON pq.product_id=p.id
      LEFT JOIN sales_qty sq ON sq.product_id=p.id
      WHERE (COALESCE(pq.qty,0) - COALESCE(sq.qty,0)) <= 5
      ORDER BY stock ASC`);
    res.json(r.rows);
  } catch (e) { res.status(500).send(e.message); }
};

exports.supplierPerformance = async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT pr.supplier_id, s.name AS supplier_name,
             COUNT(DISTINCT pr.id) AS orders,
             COALESCE(SUM(pi.quantity*pi.price),0) AS total_value
      FROM purchase_items pi JOIN purchases pr ON pr.id=pi.purchase_id
      LEFT JOIN suppliers s ON s.id = pr.supplier_id
      GROUP BY pr.supplier_id, s.name
      ORDER BY total_value DESC`);
    res.json(r.rows);
  } catch (e) { res.status(500).send(e.message); }
};

