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
    const { customer_id, total, egg_type, product_name, payment_method, status = 'Completed', discount = 0, sale_type = 'Cash' } = req.body;
    const pn = product_name || egg_type || null;
    const result = await pool.query(
      'INSERT INTO sales (customer_id, total, egg_type, product_name, payment_method, status, discount, sale_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [customer_id, total, egg_type || null, pn, payment_method || null, status, discount, sale_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id, total, egg_type, product_name, payment_method, status, discount, sale_type } = req.body;
    const pn = product_name || egg_type || null;
    const result = await pool.query(
      'UPDATE sales SET customer_id=COALESCE($1, customer_id), total=COALESCE($2, total), egg_type=COALESCE($3, egg_type), product_name=COALESCE($4, product_name), payment_method=COALESCE($5,payment_method), status=COALESCE($6,status), discount=COALESCE($7,discount), sale_type=COALESCE($8, sale_type) WHERE id=$9 RETURNING *',
      [customer_id ?? null, total ?? null, egg_type ?? null, pn ?? null, payment_method ?? null, status ?? null, discount ?? null, sale_type ?? null, id]
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
      `SELECT s.*, c.name AS customer_name, c.tax_applicability
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

