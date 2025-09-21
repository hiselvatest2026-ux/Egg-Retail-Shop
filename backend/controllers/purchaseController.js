const pool = require('../models/db');
exports.getPurchases = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM purchases ORDER BY id DESC');
        res.json(result.rows);
    }
    catch (err) { res.status(500).send(err.message); }
};
exports.createPurchase = async (req, res) => {
    try {
        const { vendor_id, product_name, price_per_unit, quantity, gst_percent, tray_in_qty, tray_out_qty, type, ref_purchase_id } = req.body;
        const unit = Number(price_per_unit || 0);
        const qty = Number(quantity || 0);
        const gst = Number(gst_percent || 0);
        const total = Number((unit * qty * (1 + (gst/100))).toFixed(2));
        const kind = (String(type||'Purchase').toLowerCase()==='return') ? 'Return' : 'Purchase';
        const refId = Number(ref_purchase_id) || null;
        const result = await pool.query(
            'INSERT INTO purchases (vendor_id, product_name, price_per_unit, quantity, gst_percent, total, type, ref_purchase_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
            [vendor_id || null, product_name || null, unit || null, qty || null, gst || null, total, kind, refId]
        );
        const purchase = result.rows[0];
        // Record tray movements (qty-only, no value)
        const inQty = Number(tray_in_qty || 0);
        const outQty = Number(tray_out_qty || 0);
        const tasks = [];
        if (inQty > 0) {
          tasks.push(pool.query('INSERT INTO tray_ledger (vendor_id, direction, reference_type, reference_id, qty) VALUES ($1,$2,$3,$4,$5)', [vendor_id || null, 'in', 'purchase', purchase.id, inQty]));
        }
        if (outQty > 0) {
          tasks.push(pool.query('INSERT INTO tray_ledger (vendor_id, direction, reference_type, reference_id, qty) VALUES ($1,$2,$3,$4,$5)', [vendor_id || null, 'out', 'purchase', purchase.id, outQty]));
        }
        if (tasks.length) { try { await Promise.all(tasks); } catch(_) {} }
        res.status(201).json(purchase);
    } catch (err) { res.status(500).send(err.message); }
};
exports.updatePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const { vendor_id, product_name, price_per_unit, quantity, gst_percent, type, ref_purchase_id } = req.body;
        // Fetch current to recompute total if needed
        const curr = await pool.query('SELECT price_per_unit, quantity, gst_percent FROM purchases WHERE id=$1', [id]);
        const current = curr.rows[0] || {};
        const unit = price_per_unit != null ? Number(price_per_unit) : current.price_per_unit;
        const qty = quantity != null ? Number(quantity) : current.quantity;
        const gst = gst_percent != null ? Number(gst_percent) : current.gst_percent;
        const total = (unit != null && qty != null && gst != null) ? Number((unit * qty * (1 + (gst/100))).toFixed(2)) : undefined;
        const kind = type != null ? ((String(type).toLowerCase()==='return') ? 'Return' : 'Purchase') : null;
        const refId = (ref_purchase_id != null) ? Number(ref_purchase_id) : null;
        const result = await pool.query(
            'UPDATE purchases SET vendor_id=COALESCE($1, vendor_id), product_name=COALESCE($2, product_name), price_per_unit=COALESCE($3, price_per_unit), quantity=COALESCE($4, quantity), gst_percent=COALESCE($5, gst_percent), total=COALESCE($6, total), type=COALESCE($7, type), ref_purchase_id=COALESCE($8, ref_purchase_id) WHERE id=$9 RETURNING *',
            [vendor_id ?? null, product_name ?? null, price_per_unit ?? null, quantity ?? null, gst_percent ?? null, total ?? null, kind, refId, id]
        );
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