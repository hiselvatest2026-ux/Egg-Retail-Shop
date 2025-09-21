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
    const { customer_id, total, egg_type, product_name, payment_method, status = 'Completed', discount = 0, sale_type = 'Cash', route_trip_id, tray_qty } = req.body;
    // Credit limit validation
    if (sale_type === 'Credit' && customer_id) {
      const limRes = await pool.query('SELECT COALESCE(credit_limit,0) AS credit_limit FROM customers WHERE id=$1', [customer_id]);
      const creditLimit = Number(limRes.rows[0]?.credit_limit || 0);
      if (creditLimit > 0) {
        const dueRes = await pool.query(`
          WITH pay AS (
            SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id
          )
          SELECT COALESCE(SUM(COALESCE(s.total,0) - COALESCE(p.paid,0)),0) AS outstanding
          FROM sales s LEFT JOIN pay p ON p.invoice_id = s.id
          WHERE s.customer_id=$1
        `, [customer_id]);
        const currentOutstanding = Number(dueRes.rows[0]?.outstanding || 0);
        const newOutstanding = currentOutstanding + Number(total || 0);
        if (newOutstanding > creditLimit) {
          return res.status(400).json({ message: 'Credit limit exceeded' });
        }
      }
    }
    const pn = product_name || egg_type || null;
    const result = await pool.query(
      'INSERT INTO sales (customer_id, total, egg_type, product_name, payment_method, status, discount, sale_type, route_trip_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [customer_id, total, egg_type || null, pn, payment_method || null, status, discount, sale_type, route_trip_id || null]
    );
    const sale = result.rows[0];
    // Record tray movement (customer out) if provided; qty-only
    const tqty = Number(tray_qty || 0);
    if (tqty > 0 && customer_id) {
      try { await pool.query('INSERT INTO tray_ledger (customer_id, direction, reference_type, reference_id, qty) VALUES ($1,$2,$3,$4,$5)', [customer_id, 'out', 'sale', sale.id, tqty]); } catch(_) {}
    }
    res.status(201).json(sale);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id, total, egg_type, product_name, payment_method, status, discount, sale_type, route_trip_id } = req.body;
    const pn = product_name || egg_type || null;
    const result = await pool.query(
      'UPDATE sales SET customer_id=COALESCE($1, customer_id), total=COALESCE($2, total), egg_type=COALESCE($3, egg_type), product_name=COALESCE($4, product_name), payment_method=COALESCE($5,payment_method), status=COALESCE($6,status), discount=COALESCE($7,discount), sale_type=COALESCE($8, sale_type), route_trip_id=COALESCE($9, route_trip_id) WHERE id=$10 RETURNING *',
      [customer_id ?? null, total ?? null, egg_type ?? null, pn ?? null, payment_method ?? null, status ?? null, discount ?? null, sale_type ?? null, route_trip_id ?? null, id]
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
    // Also remove any tray ledger entries associated with this sale
    try { await pool.query("DELETE FROM tray_ledger WHERE reference_type='sale' AND reference_id=$1", [id]); } catch(_) {}
    await pool.query('DELETE FROM sales WHERE id=$1', [id]);
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// New function to get pricing information for sales
exports.getPricingForSale = async (req, res) => {
  try {
    const { customer_id, material_code } = req.query;
    let { category } = req.query;
    // Normalize Walk-in to Retail pricing unless explicitly defined
    if (category && /walk-?in/i.test(category)) {
      category = 'Retail';
    }
    
    // Get customer tax applicability (optional)
    let isTaxable = true;
    // Customer tax applicability removed; default to taxable
    isTaxable = true;
    
    // Get pricing information
    let pricingQuery = `
      SELECT pm.base_price, pm.gst_percent, mm.description as material_description
      FROM pricing_master pm
      LEFT JOIN metal_master mm ON pm.material_code = mm.part_code
      WHERE pm.material_code = $1 AND pm.category = $2
    `;
    let pricingParams = [material_code, category];
    
    // If customer_id is provided, look for customer-specific pricing first
    if (customer_id) {
      pricingQuery += ' AND (pm.customer_id = $3 OR pm.customer_id IS NULL)';
      pricingParams.push(customer_id);
    }
    
    pricingQuery += ' ORDER BY pm.customer_id DESC LIMIT 1'; // Customer-specific first, then general
    
    const pricingResult = await pool.query(pricingQuery, pricingParams);
    
    if (pricingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pricing not found for this material and category' });
    }
    
    const pricing = pricingResult.rows[0];
    const basePrice = parseFloat(pricing.base_price);
    const gstPercent = parseFloat(pricing.gst_percent);
    
    // Calculate final price based on tax applicability
    const gstAmount = isTaxable ? (basePrice * gstPercent / 100) : 0;
    const finalPrice = basePrice + gstAmount;
    
    res.json({
      base_price: basePrice,
      gst_percent: gstPercent,
      gst_amount: gstAmount,
      final_price: finalPrice,
      is_taxable: isTaxable,
      material_description: pricing.material_description
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getSaleInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const saleResult = await pool.query(
      `SELECT s.*, c.name AS customer_name, c.phone AS customer_phone, c.gstin AS customer_gstin,
              COALESCE(c.customer_code, 'C' || LPAD(CAST(c.id AS TEXT), 6, '0')) AS customer_code,
              COALESCE(c.contact_info, '') AS customer_address,
              rt.route_name AS route_name, rt.vehicle_number AS route_vehicle
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       LEFT JOIN route_trips rt ON rt.id = s.route_trip_id
       WHERE s.id=$1`,
      [id]
    );
    if (saleResult.rows.length === 0) return res.status(404).json({ message: 'Sale not found' });
    const sale = saleResult.rows[0];

    const itemsResult = await pool.query(
      `WITH mm_guess AS (
         SELECT p.id AS product_id,
                CASE
                  WHEN LOWER(p.name) LIKE 'egg%' THEN 'M00001'
                  WHEN LOWER(p.name) LIKE 'panner%' OR LOWER(p.name) LIKE 'paneer%' THEN 'M00002'
                  ELSE NULL
                END AS part_code
         FROM products p
       )
       SELECT si.id,
              si.product_id,
              COALESCE(mm.metal_type, p.name, 'Product #' || si.product_id) AS product_name,
              si.quantity,
              si.price,
              (si.quantity * si.price) AS line_total,
              mm.hsn_sac,
              mm.gst_percent
       FROM sale_items si
       LEFT JOIN products p ON p.id = si.product_id
       LEFT JOIN mm_guess g ON g.product_id = si.product_id
       LEFT JOIN metal_master mm ON mm.part_code = g.part_code
       WHERE si.sale_id = $1
       ORDER BY si.id ASC`,
      [id]
    );

    // Item rows (may be empty for some older/legacy sales)
    const items = itemsResult.rows || [];

    // Company settings
    const settingsRes = await pool.query('SELECT * FROM settings ORDER BY id DESC LIMIT 1');
    let company = settingsRes.rows[0] || {};

    // Tax breakdown per item (assume intra-state split when taxable)
    const isTaxable = true;
    let workingItems = items;
    // Fallback: if there are no sale_items, synthesize a single item so invoice renders
    if (!workingItems || workingItems.length === 0) {
      const amount = Number(sale.total || 0);
      // If total is 0, try to use paid amount as the displayed item amount
      let paidAmount = 0;
      try {
        const pr = await pool.query('SELECT COALESCE(SUM(amount),0) AS paid FROM payments WHERE invoice_id=$1', [id]);
        paidAmount = Number(pr.rows[0]?.paid || 0);
      } catch(_) {}
      const fallback = amount > 0 ? amount : paidAmount;
      workingItems = [{ id: 0, product_id: null, product_name: sale.product_name || 'Item', quantity: 1, price: Number(fallback||0), line_total: Number(fallback||0), hsn_sac: null, gst_percent: 0 }];
    }

    // Compute taxes assuming stored prices are exclusive of tax
    let subtotal = 0, cgst_total = 0, sgst_total = 0, igst_total = 0;
    let enrichedItems = workingItems.map(it => {
      const qty = Number(it.quantity || 0);
      const rate = Number(it.price || 0);
      const lineTotalEx = Number((qty * rate).toFixed(2));
      const gstPercent = isTaxable ? Number(it.gst_percent || 0) : 0;
      let cgst = 0, sgst = 0, igst = 0;
      if (isTaxable && gstPercent > 0) {
        cgst = Number(((lineTotalEx * (gstPercent/2)) / 100).toFixed(2));
        sgst = Number(((lineTotalEx * (gstPercent/2)) / 100).toFixed(2));
      }
      subtotal += lineTotalEx;
      cgst_total += cgst;
      sgst_total += sgst;
      igst_total += igst;
      const hsn = it.hsn_sac || (String(it.product_name||'').toLowerCase().includes('egg') ? '0407' : (String(it.product_name||'').toLowerCase().includes('paneer') || String(it.product_name||'').toLowerCase().includes('panner') ? '0406' : null));
      return { ...it, line_total: lineTotalEx + cgst + sgst + igst, taxable_value: lineTotalEx, cgst, sgst, igst, hsn_sac: hsn };
    });

    let grand_total = Number((subtotal + cgst_total + sgst_total + igst_total).toFixed(2));
    let total = isFinite(grand_total) ? grand_total : 0; // use computed grand total for invoice display
    const round_off = 0;

    // Payments summary
    const payRes = await pool.query('SELECT COALESCE(SUM(amount),0) AS paid FROM payments WHERE invoice_id=$1', [id]);
    const paid = Number(payRes.rows[0]?.paid || 0);

    // Fallback: if no items and total is 0 but payments exist, synthesize a payment-only item to avoid negative balance displays
    if ((!enrichedItems || enrichedItems.length === 0) && total === 0 && paid > 0) {
      enrichedItems = [{ id: 0, product_id: null, product_name: 'Payment', quantity: 1, price: paid, line_total: paid, hsn_sac: null, gst_percent: 0, taxable_value: paid, cgst: 0, sgst: 0, igst: 0 }];
      subtotal = paid; cgst_total = 0; sgst_total = 0; igst_total = 0;
      grand_total = paid; total = paid;
    }

    const balance = Number((total - paid).toFixed(2));

    // Tray balance for this customer (qty only)
    let tray_balance = 0;
    if (sale.customer_id) {
      try {
        const t = await pool.query(`
          WITH agg AS (
            SELECT customer_id,
                   SUM(CASE WHEN direction='in' THEN qty ELSE 0 END) AS q_in,
                   SUM(CASE WHEN direction='out' THEN qty ELSE 0 END) AS q_out
            FROM tray_ledger
            WHERE customer_id = $1
            GROUP BY customer_id
          )
          SELECT COALESCE(q_in,0) - COALESCE(q_out,0) AS bal FROM agg`, [sale.customer_id]);
        tray_balance = Number(t.rows[0]?.bal || 0);
      } catch(_) { tray_balance = 0; }
    }

    res.json({ company, sale, items: enrichedItems, total, totals: { subtotal, cgst_total, sgst_total, igst_total, round_off, grand_total, paid, balance }, tray_balance });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Get latest purchase unit price for a given material_code
exports.getLastPurchasePrice = async (req, res) => {
  try {
    const { material_code } = req.query;
    if (!material_code) return res.status(400).json({ message: 'material_code is required' });
    const mmRes = await pool.query('SELECT metal_type FROM metal_master WHERE part_code=$1', [material_code]);
    if (mmRes.rows.length === 0) return res.status(404).json({ message: 'Material not found' });
    const metalType = String(mmRes.rows[0].metal_type || '').trim();
    // Try exact match first
    let prodRes = await pool.query('SELECT id FROM products WHERE LOWER(name)=LOWER($1) ORDER BY id ASC LIMIT 1', [metalType]);
    if (prodRes.rows.length === 0) {
      // Fallback to contains match
      prodRes = await pool.query('SELECT id FROM products WHERE LOWER(name) LIKE LOWER($1) ORDER BY id ASC LIMIT 1', [`%${metalType}%`]);
    }
    if (prodRes.rows.length === 0) return res.status(404).json({ message: 'Product not found for material' });
    const productId = Number(prodRes.rows[0].id);
    const priceRes = await pool.query(`
      SELECT pi.price, pi.mfg_date
      FROM purchase_items pi
      JOIN purchases p ON p.id = pi.purchase_id
      WHERE pi.product_id=$1
      ORDER BY p.id DESC, pi.id DESC
      LIMIT 1
    `, [productId]);
    if (priceRes.rows.length === 0) return res.status(404).json({ message: 'No purchase price found' });
    const row = priceRes.rows[0];
    return res.json({ price: Number(row.price), dom: row.mfg_date });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

