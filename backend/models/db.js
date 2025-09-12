const { Pool } = require('pg');

const shouldEnableSsl = (
  process.env.DB_SSL === 'true'
  || (process.env.DB_HOST || '').includes('render.com')
  || process.env.PGSSLMODE === 'require'
);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: shouldEnableSsl ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool;
