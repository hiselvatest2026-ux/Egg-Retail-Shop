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
    const { customer_id, total, egg_type, product_name, payment_method, status = 'Completed', discount = 0, sale_type = 'Cash', route_trip_id } = req.body;
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
    res.status(201).json(result.rows[0]);
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
    await pool.query('DELETE FROM sales WHERE id=$1', [id]);
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// New function to get pricing information for sales
exports.getPricingForSale = async (req, res) => {
  try {
    const { customer_id, material_code, category = 'Retail' } = req.query;
    
    // Get customer tax applicability
    const customerResult = await pool.query(
      'SELECT tax_applicability FROM customers WHERE id = $1',
      [customer_id]
    );
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const customer = customerResult.rows[0];
    const isTaxable = customer.tax_applicability === 'Taxable';
    
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
      `SELECT s.*, c.name AS customer_name, c.tax_applicability, c.phone AS customer_phone, c.gstin AS customer_gstin,
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
              COALESCE(p.name, 'Product #' || si.product_id) AS product_name,
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

    const totalResult = await pool.query(
      'SELECT COALESCE(SUM(quantity * price), 0) AS total FROM sale_items WHERE sale_id=$1',
      [id]
    );
    const computedTotal = totalResult.rows[0]?.total ?? 0;
    const items = itemsResult.rows;
    const total = (items && items.length > 0) ? computedTotal : (sale.total ?? 0);

    // Company settings
    const settingsRes = await pool.query('SELECT * FROM settings ORDER BY id ASC LIMIT 1');
    const company = settingsRes.rows[0] || { company_name: 'TRY ZEROEGG POS' };

    // Payments summary
    const payRes = await pool.query('SELECT COALESCE(SUM(amount),0) AS paid FROM payments WHERE invoice_id=$1', [id]);
    const paid = Number(payRes.rows[0]?.paid || 0);
    const balance = Number(total) - paid;

    // Tax breakdown per item (assume intra-state split when taxable)
    const isTaxable = sale.tax_applicability === 'Taxable';
    let subtotal = 0, cgst_total = 0, sgst_total = 0, igst_total = 0;
    const enrichedItems = items.map(it => {
      const lineTotal = Number(it.line_total || 0);
      const gstPercent = isTaxable ? Number(it.gst_percent || 0) : 0;
      let taxableValue = lineTotal;
      let taxAmt = 0, cgst = 0, sgst = 0, igst = 0;
      if (isTaxable && gstPercent > 0) {
        taxableValue = Number((lineTotal / (1 + (gstPercent/100))).toFixed(2));
        taxAmt = Number((lineTotal - taxableValue).toFixed(2));
        cgst = Number((taxAmt / 2).toFixed(2));
        sgst = Number((taxAmt / 2).toFixed(2));
      }
      subtotal += taxableValue;
      cgst_total += cgst;
      sgst_total += sgst;
      igst_total += igst;
      return { ...it, taxable_value: taxableValue, cgst, sgst, igst };
    });

    const grand_total = subtotal + cgst_total + sgst_total + igst_total;
    const round_off = Number((total - grand_total).toFixed(2));

    res.json({ company, sale, items: enrichedItems, total, totals: { subtotal, cgst_total, sgst_total, igst_total, round_off, grand_total, paid, balance } });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

