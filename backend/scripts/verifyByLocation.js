/* Aggregate opening, purchased, sold by location (where available) */
const pool = require('../models/db');

async function main() {
  try {
    const locs = await pool.query(`SELECT id, name FROM locations ORDER BY id ASC`);
    const products = await pool.query(`SELECT id, name FROM products`);
    const eggIds = products.rows.filter(p => String(p.name||'').toLowerCase().startsWith('egg')).map(p => p.id);
    const paneerIds = products.rows.filter(p => { const n=String(p.name||'').toLowerCase(); return n.startsWith('paneer') || n.startsWith('panner'); }).map(p => p.id);

    const purch = await pool.query(`SELECT COALESCE(location_id,0) AS location_id, product_id, SUM(quantity) qty FROM purchase_items GROUP BY COALESCE(location_id,0), product_id`);
    const sales = await pool.query(`SELECT COALESCE(location_id,0) AS location_id, product_id, SUM(quantity) qty FROM sale_items GROUP BY COALESCE(location_id,0), product_id`);

    function sumFor(ids, rows, locId) {
      return rows.filter(r => Number(r.location_id) === locId && ids.includes(Number(r.product_id))).reduce((a,r)=>a+Number(r.qty||0),0);
    }

    const out = [];
    for (const loc of [{id:0,name:'(no location)'}].concat(locs.rows)) {
      out.push({
        location_id: Number(loc.id),
        location_name: loc.name,
        egg_purchased: sumFor(eggIds, purch.rows, Number(loc.id)),
        egg_sold: sumFor(eggIds, sales.rows, Number(loc.id)),
        paneer_purchased: sumFor(paneerIds, purch.rows, Number(loc.id)),
        paneer_sold: sumFor(paneerIds, sales.rows, Number(loc.id)),
      });
    }
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error('By-location verify failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

