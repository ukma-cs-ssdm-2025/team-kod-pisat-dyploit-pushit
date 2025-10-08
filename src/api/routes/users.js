// src/api/routes/users.js
const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: Отримати список користувачів
 *     responses:
 *       200:
 *         description: Список користувачів
 */
router.get('/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ]);
});

/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     summary: Створити нового користувача
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Користувач створений
 */
router.post('/users', (req, res) => {
  const user = req.body;
  res.status(201).json({ message: 'Користувач створений', user });
});

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     summary: Отримати користувача за ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Інформація про користувача
 *       404:
 *         description: Користувача не знайдено
 */
router.get('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ id, name: 'Test User', email: 'test@example.com' });
});

module.exports = router;
