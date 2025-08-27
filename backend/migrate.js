const fs = require('fs');
const path = require('path');
const pool = require('./models/db');

(async () => {
  try {
    // Use absolute path relative to this file
    const sqlPath = path.join(__dirname, 'db', 'init.sql');
    const sql = fs.readFileSync(sqlPath).toString();

    await pool.query(sql);
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
})();
