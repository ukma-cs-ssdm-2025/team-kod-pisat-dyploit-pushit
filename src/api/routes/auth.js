const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

const { validateEmail } = require('../utils/validateEmail');
const { isValidPassword } = require('../utils/password-validator');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, email, nickname, role]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               nickname:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Користувача зареєстровано
 *       400:
 *         description: Некоректні вхідні дані
 *       409:
 *         description: Користувач вже існує
 * 
 */
router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
  const { username, password, email, nickname, role } = req.body;

  if (!username || !password || !email || !nickname || !role) {
    return res.status(400).json({ message: 'Будь ласка, заповніть усі поля' });
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
    const exists = await db.query('SELECT * FROM users WHERE username = $1 OR email = $2', [formattedUsername, email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'Користувач з таким username або email вже існує' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await db.query(
      `INSERT INTO users (username, password, email, nickname, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, nickname, role`,
      [formattedUsername, hashedPassword, email, nickname, role]
    );

    res.status(201).json({
      message: 'Реєстрація успішна',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('DB error (POST /register):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Авторизація користувача (отримання JWT токена)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Авторизація успішна
 *       401:
 *         description: Невірний логін або пароль
 */
router.post('/login', async (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Вкажіть username і пароль' });
  }

  const formattedUsername = username.startsWith('@') ? username : `@${username}`;

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [formattedUsername]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Невірний логін або пароль' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Невірний логін або пароль' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Авторизація успішна',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nickname: user.nickname,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('DB error (POST /login):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
