const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres_user',
    host: 'localhost',
    database: 'egg_retail',
    password: 'postgres_password',
    port: 5432,
});
module.exports = pool;