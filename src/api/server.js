// src/api/server.js
const express = require('express');
const { swaggerSpec, swaggerUi, saveGeneratedSpec } = require('./swagger-config');
const yaml = require('js-yaml');

const usersRouter = require('./routes/users');
const moviesRouter = require('./routes/movies');

const app = express();
app.use(express.json());

// Підключення маршрутів
app.use('/api/v1', usersRouter);
app.use('/api/v1', moviesRouter);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// YAML-документація
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
