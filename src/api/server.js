// src/api/server.js
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const { swaggerSpec, swaggerUi, saveGeneratedSpec } = require('./swagger-config');
const yaml = require('js-yaml');

const usersRouter = require('./routes/users');
const moviesRouter = require('./routes/movies');

dotenv.config();

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL database');
    client.release();
  })
  .catch(err => console.error('PostgreSQL connection error:', err.stack));

app.locals.db = pool;

app.use('/api/v1', usersRouter);
app.use('/api/v1', moviesRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(yaml.dump(swaggerSpec));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  saveGeneratedSpec();
  console.log(`API Server running on http://localhost:${PORT}`);
  console.log(`Swagger Docs: http://localhost:${PORT}/api-docs`);
});
