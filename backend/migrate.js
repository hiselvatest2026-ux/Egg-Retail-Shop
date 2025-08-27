const fs = require('fs');
const pool = require('./models/db');

(async () => {
  try {
    // Read SQL from init.sql
    const sql = fs.readFileSync('./db/init.sql').toString();
    
    // Execute SQL
    await pool.query(sql);
    
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
})();
