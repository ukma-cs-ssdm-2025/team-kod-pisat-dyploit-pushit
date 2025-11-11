// src/api/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { swaggerSpec, swaggerUi, saveGeneratedSpec } = require('./swagger-config');
const yaml = require('js-yaml');
const db = require('./db');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const moviesRouter = require('./routes/movies');
const uploadRouter = require('./routes/upload');


const authenticateToken = require('./middleware/authMiddleware');

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.locals.db = db;

app.use('/api/v1/auth', authRouter);
app.use('/api/v1', authenticateToken, usersRouter);
app.use('/api/v1', authenticateToken, moviesRouter);
app.use('/api/v1', authenticateToken, uploadRouter);

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
