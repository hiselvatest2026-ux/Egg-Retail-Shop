const { Pool } = require('pg');

// Prefer DATABASE_URL when available (e.g., Render/Neon), fall back to discrete vars for local
const databaseUrl = process.env.DATABASE_URL;

// Autosuspend-friendly pool tuning for serverless/Neon
const commonPoolOptions = {
  // Avoid keeping too many idle connections on serverless
  max: Number(process.env.PG_MAX_CLIENTS || 5),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 10000), // 10s
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 10000),
  keepAlive: true,
};

let pool;
if (databaseUrl) {
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    ...commonPoolOptions,
  });
} else {
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ...commonPoolOptions,
  });
}

module.exports = pool;
