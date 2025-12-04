const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const { validateEmail } = require('../utils/validateEmail');
const { isValidPassword } = require('../utils/password-validator');
const { deleteFileFromR2 } = require('../utils/r2');

const SALT_ROUNDS = 10;

/**
 * @openapi
 * /api/v1/users/stats:
 *   get:
 *     summary: Отримати статистику по користувачах
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Успішне отримання статистики
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 users:
 *                   type: integer
 *                 moderators:
 *                   type: integer
 *                 admins:
 *                   type: integer
 */
router.get('/users/stats', async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const [totalResult, usersResult, moderatorsResult, adminsResult] = await Promise.all([
      db.query('SELECT COUNT(*) AS count FROM users'),
      db.query('SELECT COUNT(*) AS count FROM users WHERE role = $1', ['user']),
      db.query('SELECT COUNT(*) AS count FROM users WHERE role = $1', ['moderator']),
      db.query('SELECT COUNT(*) AS count FROM users WHERE role = $1', ['admin'])
    ]);

    res.json({
      total: parseInt(totalResult.rows[0].count, 10),
      users: parseInt(usersResult.rows[0].count, 10),
      moderators: parseInt(moderatorsResult.rows[0].count, 10),
      admins: parseInt(adminsResult.rows[0].count, 10)
    });
  } catch (err) {
    console.error('DB error (GET /users/stats):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: Отримати список усіх користувачів з пошуком
 *     tags:
 *       - Users
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         description: Номер сторінки
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Кількість записів на сторінку
 *         schema:
 *           type: integer
 *           default: 50
 *       - name: search
 *         in: query
 *         required: false
 *         description: Пошук по username, nickname або email
 *         schema:
 *           type: string
 *       - name: role
 *         in: query
 *         required: false
 *         description: Фільтр по ролі
 *         schema:
 *           type: string
 *           enum: [user, moderator, admin]
 *     responses:
 *       200:
 *         description: Список користувачів
 */
router.get('/users', async (req, res) => {
  const db = req.app.locals.db;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const role = req.query.role || '';

  try {
    let query = `
      SELECT id, username, role, nickname, email, avatar_url, liked_movies
      FROM users
    `;
    
    let countQuery = 'SELECT COUNT(*) AS total FROM users';
    const params = [];
    const whereConditions = [];

    if (search) {
      whereConditions.push(
        `(username ILIKE $${params.length + 1} OR nickname ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`
      );
      params.push(`%${search}%`);
    }

    if (role) {
      whereConditions.push(`role = $${params.length + 1}`);
      params.push(role);
    }

    if (whereConditions.length > 0) {
      const whereClause = 'WHERE ' + whereConditions.join(' AND ');
      query += ' ' + whereClause;
      countQuery += ' ' + whereClause;
    }

    query += ' ORDER BY id';

    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total, 10);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      users: result.rows
    });
  } catch (err) {
    console.error('DB error (GET /users):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/users/roles:
 *   get:
 *     summary: Отримати список унікальних ролей
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Успішне отримання списку ролей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/users/roles', async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const result = await db.query(
      'SELECT DISTINCT role FROM users ORDER BY role'
    );
    
    const roles = result.rows.map(row => row.role);
    res.json(roles);
  } catch (err) {
    console.error('DB error (GET /users/roles):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/users/{param}:
 *   get:
 *     summary: Отримати користувача за ID або username
 *     tags:
 *       - Users
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

  let target;
  if (/^\d+$/.test(param)) {
    target = { column: 'id', value: param };
  } else {
    const username = param.startsWith('@') ? param : `@${param}`;
    target = { column: 'username', value: username };
  }

  try {
    const userQuery = target.column === 'id'
      ? `SELECT id, username, role, nickname, email, avatar_url, liked_movies 
         FROM users 
         WHERE id = $1`
      : `SELECT id, username, role, nickname, email, avatar_url, liked_movies 
         FROM users 
         WHERE username = $1`;

    const { rows } = await db.query(userQuery, [target.value]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const user = rows[0];

    const friendsQuery = `
      SELECT u.id, u.username, u.nickname, u.avatar_url
      FROM friendships f
      JOIN users u 
        ON (u.id = f.requester_id AND f.receiver_id = $1)
        OR (u.id = f.receiver_id AND f.requester_id = $1)
      WHERE f.status='accepted'
    `;

    const friendsResult = await db.query(friendsQuery, [user.id]);

    res.json({
      ...user,
      friends: friendsResult.rows
    });
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
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, nickname, password, email]
 *             properties:
 *               username:
 *                 type: string
 *                 example: "@newuser"
 *               nickname:
 *                 type: string
 *                 example: "MovieFan"
 *               password:
 *                 type: string
 *                 example: "Qwerty!123"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       201:
 *         description: Користувача створено
 *       400:
 *         description: Некоректні вхідні дані
 */
router.post('/users', async (req, res) => {
  const db = req.app.locals.db;
  const { username, nickname, password, email } = req.body;

  if (!username || !nickname || !password || !email) {
    return res.status(400).json({ message: 'Вкажіть усі необхідні поля' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Некоректний формат email' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      message: 'Пароль не відповідає вимогам безпеки (мінімум 8 символів, 1 цифра, 1 спецсимвол: !@#$%^&*)'
    });
  }

  const formattedUsername = username.startsWith('@') ? username : `@${username}`;

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await db.query(
      `INSERT INTO users (username, nickname, password, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [formattedUsername, nickname, hashedPassword, email]
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
 *     tags:
 *       - Users
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
 *       400:
 *         description: Некоректні вхідні дані
 *       404:
 *         description: Користувача не знайдено
 */
router.put('/users/:param', async (req, res) => {
  const db = req.app.locals.db;
  const { param } = req.params;
  let { username, role, nickname, password, email } = req.body;

  if (email && !validateEmail(email)) {
    return res.status(400).json({ message: 'Некоректний формат email' });
  }

  if (password && !isValidPassword(password)) {
    return res.status(400).json({ 
      message: 'Пароль не відповідає вимогам безпеки (мінімум 8 символів, 1 цифра, 1 спецсимвол: !@#$%^&*)' 
    });
  }

  let target;
  if (/^\d+$/.test(param)) {
    target = { column: 'id', value: param };
  } else {
    const uname = param.startsWith('@') ? param : `@${param}`;
    target = { column: 'username', value: uname };
  }

  if (req.user.role === 'user') {
    if ((target.column === 'id' && Number.parseInt(target.value) !== req.user.id) ||
        (target.column === 'username' && target.value !== req.user.username)) {
      return res.status(403).json({ message: 'Недостатньо прав для редагування іншого користувача' });
    }
    if (role && role !== 'user') {
      return res.status(403).json({ message: 'Недостатньо прав для зміни ролі' });
    }
  }

  if (username && !username.startsWith('@')) {
    username = `@${username}`;
  }

  try {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const result = await db.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           role = COALESCE($2, role),
           nickname = COALESCE($3, nickname),
           password = COALESCE($4, password),
           email = COALESCE($5, email)
       WHERE ${target.column} = $6
       RETURNING *`,
      [username, role, nickname, hashedPassword, email, target.value]
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
 *     tags:
 *       - Users
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

  let target;
  if (/^\d+$/.test(param)) {
    target = { column: 'id', value: param };
  } else {
    const uname = param.startsWith('@') ? param : `@${param}`;
    target = { column: 'username', value: uname };
  }

  if (req.user.role === 'user') {
    if ((target.column === 'id' && Number.parseInt(target.value) !== req.user.id) ||
        (target.column === 'username' && target.value !== req.user.username)) {
      return res.status(403).json({ message: 'Недостатньо прав для видалення іншого користувача' });
    }
  }

  try {
    const query = target.column === 'id'
      ? 'SELECT * FROM users WHERE id = $1'
      : 'SELECT * FROM users WHERE username = $1';
    const { rows } = await db.query(query, [target.value]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const user = rows[0];

    if (user.avatar_url) {
      try {
        const oldFileKey = user.avatar_url.split(/\.r2\.(?:cloudflarestorage|dev)\//)[1];
        await deleteFileFromR2(oldFileKey);
      } catch (err) {
        console.warn('Не вдалося видалити аватарку користувача:', err.message);
      }
    }

    const deleteQuery = target.column === 'id'
      ? 'DELETE FROM users WHERE id = $1 RETURNING *'
      : 'DELETE FROM users WHERE username = $1 RETURNING *';
    const deleteResult = await db.query(deleteQuery, [target.value]);

    res.json({ message: 'Користувача видалено', user: deleteResult.rows[0] });
  } catch (err) {
    console.error('DB error (DELETE /users/:param):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/users/friends/request/{param}:
 *   post:
 *     summary: Надіслати запит на дружбу
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: param
 *         required: true
 *         schema:
 *           type: string
 *         description: ID або username користувача
 *     responses:
 *       201:
 *         description: Запит надіслано
 *       400:
 *         description: Некоректний запит
 *       404:
 *         description: Користувача не знайдено
 */
router.post('/users/friends/request/:param', async (req, res) => {
  const db = req.app.locals.db;
  const { param } = req.params;

  const requesterId = req.user.id;

  let target;
  if (/^\d+$/.test(param)) {
    target = { column: 'id', value: param };
  } else {
    const uname = param.startsWith('@') ? param : `@${param}`;
    target = { column: 'username', value: uname };
  }

  try {
    const query = target.column === 'id'
      ? 'SELECT * FROM users WHERE id = $1'
      : 'SELECT * FROM users WHERE username = $1';

    const { rows } = await db.query(query, [target.value]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const receiver = rows[0];

    if (receiver.id === requesterId) {
      return res.status(400).json({ message: 'Не можна надіслати запит самому собі' });
    }
    const existing = await db.query(
      `SELECT * FROM friendships
       WHERE (requester_id = $1 AND receiver_id = $2)
          OR (requester_id = $2 AND receiver_id = $1)`,
      [requesterId, receiver.id]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];

      if (row.status === 'pending') {
        return res.status(400).json({ message: 'Запит уже очікує підтвердження' });
      }

      if (row.status === 'accepted') {
        return res.status(400).json({ message: 'Ви вже друзі' });
      }

      if (row.status === 'rejected') {
        return res.status(400).json({ message: 'Ваш попередній запит відхилено' });
      }
    }

    const result = await db.query(
      `INSERT INTO friendships (requester_id, receiver_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [requesterId, receiver.id]
    );

    res.status(201).json({
      message: 'Запит на дружбу надіслано',
      request: result.rows[0]
    });

  } catch (err) {
    console.error('DB error (POST /users/friends/request/:param):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/users/friends/accept/{param}:
 *   post:
 *     summary: Прийняти запит дружби
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: param
 *         required: true
 *         schema:
 *           type: string
 *         description: ID або username користувача, який надіслав запит
 *     responses:
 *       200:
 *         description: Запит прийнято
 *       404:
 *         description: Запит не знайдено
 */
router.post('/users/friends/accept/:param', async (req, res) => {
  const db = req.app.locals.db;
  const receiverId = req.user.id;
  const { param } = req.params;

  let target;
  if (/^\d+$/.test(param)) {
    target = { column: 'id', value: param };
  } else {
    const uname = param.startsWith('@') ? param : `@${param}`;
    target = { column: 'username', value: uname };
  }

  try {
    const query = target.column === 'id'
      ? 'SELECT * FROM users WHERE id = $1'
      : 'SELECT * FROM users WHERE username = $1';

    const { rows } = await db.query(query, [target.value]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const requester = rows[0];

    if (requester.id === receiverId) {
      return res.status(400).json({ message: 'Не можна прийняти запит від самого себе' });
    }

    const check = await db.query(
      `SELECT * FROM friendships
       WHERE requester_id = $1 AND receiver_id = $2`,
      [requester.id, receiverId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Запит на дружбу не знайдено' });
    }

    const requestRow = check.rows[0];

    if (requestRow.status === 'accepted') {
      return res.status(400).json({ message: 'Ви вже друзі' });
    }

    if (requestRow.status === 'rejected') {
      return res.status(400).json({ message: 'Цей запит вже було відхилено' });
    }

    if (requestRow.status !== 'pending') {
      return res.status(400).json({ message: 'Цей запит неможливо прийняти' });
    }

    const result = await db.query(
      `UPDATE friendships
       SET status='accepted'
       WHERE requester_id=$1 AND receiver_id=$2
       RETURNING *`,
      [requester.id, receiverId]
    );

    res.json({
      message: 'Запит на дружбу прийнято',
      friendship: result.rows[0]
    });

  } catch (err) {
    console.error('DB error (POST /users/friends/accept/:param):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/users/friends/{param}:
 *   delete:
 *     summary: Видалити друга або скасувати запит
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: param
 *         required: true
 *         schema:
 *           type: string
 *         description: ID або username друга
 *     responses:
 *       200:
 *         description: Видалено
 *       404:
 *         description: Не знайдено
 */
router.delete('/users/friends/:param', async (req, res) => {
  const db = req.app.locals.db;
  const { param } = req.params;
  const userId = req.user.id;

  let target;
  if (/^\d+$/.test(param)) {
    target = { column: 'id', value: param };
  } else {
    const uname = param.startsWith('@') ? param : `@${param}`;
    target = { column: 'username', value: uname };
  }

  try {
    const query = target.column === 'id'
      ? 'SELECT * FROM users WHERE id = $1'
      : 'SELECT * FROM users WHERE username = $1';

    const { rows } = await db.query(query, [target.value]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const other = rows[0];

    if (other.id === userId) {
      return res.status(400).json({ message: 'Неможливо видалити дружбу з самим собою' });
    }

    const result = await db.query(
      `DELETE FROM friendships
       WHERE (requester_id=$1 AND receiver_id=$2)
          OR (requester_id=$2 AND receiver_id=$1)
       RETURNING *`,
      [userId, other.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Дружбу не знайдено' });
    }

    res.json({
      message: 'Дружбу видалено',
      removed: result.rows[0]
    });

  } catch (err) {
    console.error('DB error (DELETE /users/friends/:param):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/users/friends/requests/incoming/{param}:
 *   get:
 *     summary: Отримати список вхідних запитів
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: param
 *         required: true
 *         schema:
 *           type: string
 *         description: ID або username користувача
 *     responses:
 *       200:
 *         description: Список вхідних запитів
 */
router.get('/users/friends/requests/incoming/:param', async (req, res) => {
  const db = req.app.locals.db;
  const { param } = req.params;

  let target;
  if (/^\d+$/.test(param)) {
    target = { column: 'id', value: param };
  } else {
    const uname = param.startsWith('@') ? param : `@${param}`;
    target = { column: 'username', value: uname };
  }

  if (req.user.role === 'user') {
    if ((target.column === 'id' && Number.parseInt(target.value) !== req.user.id) ||
        (target.column === 'username' && target.value !== req.user.username)) {
      return res.status(403).json({ message: 'Недостатньо прав для перегляду запитів іншого користувача' });
    }
  }

  try {
    const query = target.column === 'id'
      ? 'SELECT * FROM users WHERE id = $1'
      : 'SELECT * FROM users WHERE username = $1';

    const { rows } = await db.query(query, [target.value]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const user = rows[0];

    const requestsResult = await db.query(
      `SELECT f.id, f.requester_id, u.username, u.nickname, f.created_at
       FROM friendships f
       JOIN users u ON f.requester_id = u.id
       WHERE f.receiver_id=$1 AND f.status='pending'
       ORDER BY f.created_at DESC`,
      [user.id]
    );

    res.json({ incoming: requestsResult.rows });
  } catch (err) {
    console.error('DB error (GET /users/friends/requests/incoming/:param):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;