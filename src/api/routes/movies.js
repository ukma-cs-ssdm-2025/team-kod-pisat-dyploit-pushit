// src/api/routes/movies.js
const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/v1/movies:
 *   get:
 *     summary: Отримати список фільмів
 *     responses:
 *       200:
 *         description: Список фільмів
 */
router.get('/movies', (req, res) => {
  res.json([
    { id: 1, title: 'Inception', year: 2010 },
    { id: 2, title: 'Interstellar', year: 2014 }
  ]);
});

/**
 * @openapi
 * /api/v1/movies:
 *   post:
 *     summary: Додати новий фільм
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, year]
 *             properties:
 *               title:
 *                 type: string
 *               year:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Фільм додано
 */
router.post('/movies', (req, res) => {
  const movie = req.body;
  res.status(201).json({ message: 'Фільм додано', movie });
});

/**
 * @openapi
 * /api/v1/movies/{id}:
 *   get:
 *     summary: Отримати фільм за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Дані про фільм
 *       404:
 *         description: Фільм не знайдено
 */
router.get('/movies/:id', (req, res) => {
  const { id } = req.params;
  res.json({ id, title: 'Mock Movie', year: 2025 });
});

module.exports = router;
