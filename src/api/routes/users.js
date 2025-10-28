const express = require('express');
const router = express.Router();

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: Отримати список усіх користувачів
 *     responses:
 *       200:
 *         description: Список користувачів
 */
router.get('/users', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query('SELECT * FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('DB error (GET /users):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/users/{param}:
 *   get:
 *     summary: Отримати користувача за ID або username
 *     parameters:
 *       - name: param
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID (число) або username (рядок)
 *     responses:
 *       200:
 *         description: Інформація про користувача
 *       404:
 *         description: Користувача не знайдено
 */
router.get('/users/:param', async (req, res) => {
  const db = req.app.locals.db;
  const { param } = req.params;

  let query, values;

  if (/^\d+$/.test(param)) {
    query = 'SELECT * FROM users WHERE id = $1';
    values = [param];
  } else {
    const username = param.startsWith('@') ? param : `@${param}`;
    query = 'SELECT * FROM users WHERE username = $1';
    values = [username];
  }

  try {
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB error (GET /users/:param):', err);
    res.status(500).json({ error: 'Database error' });
  }
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
 *             required: [username, role, nickname, password, email]
 *             properties:
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *               nickname:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Користувача створено
 */
router.post('/users', async (req, res) => {
  const db = req.app.locals.db;
  const { username, role, nickname, password, email } = req.body;

  if (!username || !role || !nickname || !password || !email) {
    return res.status(400).json({ message: 'Вкажіть усі необхідні поля' });
  }

  const formattedUsername = username.startsWith('@') ? username : `@${username}`;

  try {
    const result = await db.query(
      `INSERT INTO users (username, role, nickname, password, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [formattedUsername, role, nickname, password, email]
    );
    res.status(201).json({ message: 'Користувача створено', user: result.rows[0] });
  } catch (err) {
    console.error('DB error (POST /users):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/users/{param}:
 *   put:
 *     summary: Оновити дані користувача за ID або username
 *     parameters:
 *       - name: param
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID (число) або username (рядок)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *               nickname:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Користувача оновлено
 *       404:
 *         description: Користувача не знайдено
 */
router.put('/users/:param', async (req, res) => {
  const db = req.app.locals.db;
  const { param } = req.params;
  let { username, role, nickname, password, email } = req.body;

  let target;
  if (/^\d+$/.test(param)) {
    target = { column: 'id', value: param };
  } else {
    const uname = param.startsWith('@') ? param : `@${param}`;
    target = { column: 'username', value: uname };
  }

  if (username && !username.startsWith('@')) {
    username = `@${username}`;
  }

  try {
    const result = await db.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           role = COALESCE($2, role),
           nickname = COALESCE($3, nickname),
           password = COALESCE($4, password),
           email = COALESCE($5, email)
       WHERE ${target.column} = $6
       RETURNING *`,
      [username, role, nickname, password, email, target.value]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    res.json({ message: 'Користувача оновлено', user: result.rows[0] });
  } catch (err) {
    console.error('DB error (PUT /users/:param):', err);
    res.status(500).json({ error: 'Database error' });
  }
});


/**
 * @openapi
 * /api/v1/users/{param}:
 *   delete:
 *     summary: Видалити користувача за ID або username
 *     parameters:
 *       - name: param
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID (число) або username (рядок)
 *     responses:
 *       200:
 *         description: Користувача видалено
 *       404:
 *         description: Користувача не знайдено
 */
router.delete('/users/:param', async (req, res) => {
  const db = req.app.locals.db;
  const { param } = req.params;

  let query, values;
  if (/^\d+$/.test(param)) {
    query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    values = [param];
  } else {
    const uname = param.startsWith('@') ? param : `@${param}`;
    query = 'DELETE FROM users WHERE username = $1 RETURNING *';
    values = [uname];
  }

  try {
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }
    res.json({ message: 'Користувача видалено', user: result.rows[0] });
  } catch (err) {
    console.error('DB error (DELETE /users/:param):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
