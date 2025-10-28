const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

pool.connect()
  .then(client => {
    if (client) {
      console.log('Connected to PostgreSQL database');
      client.release();
    }
  })
  .catch(err => {
    console.warn('PostgreSQL test connection skipped:', err.message);
  });

module.exports = pool;
