const { Pool } = require('pg');

// Prefer DATABASE_URL when available (e.g., Render), fall back to discrete vars for local
const databaseUrl = process.env.DATABASE_URL;
let pool;
if (databaseUrl) {
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
  });
} else {
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
}

module.exports = pool;
