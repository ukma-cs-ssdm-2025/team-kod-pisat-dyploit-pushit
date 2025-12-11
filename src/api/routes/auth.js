const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

const { validateEmail } = require('../utils/validateEmail');
const { isValidPassword } = require('../utils/password-validator');

// ---- CONFIG & GUARDS ----
const SALT_ROUNDS = 10;

// FIX 1: забороняємо слабкий / відсутній секрет
const rawJwtSecret = process.env.JWT_SECRET;
if (!rawJwtSecret || rawJwtSecret.length < 16) {
  // fail-fast при старті застосунку
  throw new Error('JWT_SECRET env var must be set and at least 16 characters long');
}
const JWT_SECRET = rawJwtSecret;

// FIX 2–4: ліміти на довжину полів
const MAX_USERNAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 254;
const MAX_NICKNAME_LENGTH = 50;
const MAX_PASSWORD_LENGTH = 128;

// FIX 7: дуже простий rate-limit для /login (по IP)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 хв

function isBlocked(ip) {
  const info = loginAttempts.get(ip);
  if (!info) return false;
  const { count, firstAttemptAt } = info;
  const now = Date.now();

  if (now - firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return count >= MAX_LOGIN_ATTEMPTS;
}

function registerAttempt(ip) {
  const now = Date.now();
  const info = loginAttempts.get(ip);
  if (!info) {
    loginAttempts.set(ip, { count: 1, firstAttemptAt: now });
    return;
  }
  loginAttempts.set(ip, {
    count: info.count + 1,
    firstAttemptAt: info.firstAttemptAt,
  });
}

// ---------------- REGISTER ----------------

router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
  let { username, password, email, nickname } = req.body;

  // базова присутність полів
  if (!username || !password || !email || !nickname) {
    return res.status(400).json({ message: 'Будь ласка, заповніть усі поля' });
  }

  // FIX 2: trim + нормалізація
  username = String(username).trim();
  email = String(email).trim().toLowerCase();
  nickname = String(nickname).trim();

  // FIX 2–4: граничні значення
  if (username.length === 0 || username.length > MAX_USERNAME_LENGTH) {
    return res.status(400).json({ message: 'Некоректна довжина username' });
  }
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) {
    return res.status(400).json({ message: 'Некоректна довжина email' });
  }
  if (nickname.length === 0 || nickname.length > MAX_NICKNAME_LENGTH) {
    return res.status(400).json({ message: 'Некоректна довжина nickname' });
  }
  if (password.length < 8 || password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({
      message: `Пароль має бути від 8 до ${MAX_PASSWORD_LENGTH} символів`,
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Некоректний формат email' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      message:
        'Пароль не відповідає вимогам безпеки (мінімум 8 символів, 1 цифра, 1 спецсимвол: !@#$%^&*)',
    });
  }

  const formattedUsername = username.startsWith('@') ? username : `@${username}`;

  try {
    // попередня перевірка — ок, але не покладаємось лише на неї
    const exists = await db.query(
      'SELECT 1 FROM users WHERE username = $1 OR email = $2',
      [formattedUsername, email]
    );
    if (exists.rows.length > 0) {
      return res
        .status(409)
        .json({ message: 'Користувач з таким username або email вже існує' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await db.query(
      `INSERT INTO users (username, password, email, nickname)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, nickname, role`,
      [formattedUsername, hashedPassword, email, nickname]
    );

    return res.status(201).json({
      message: 'Реєстрація успішна',
      user: result.rows[0],
    });
  } catch (err) {
    // FIX 3 + 5: окрема обробка unique_violation + уніфікований message
    if (err && err.code === '23505') {
      return res.status(409).json({
        message: 'Користувач з таким username або email вже існує',
      });
    }

    console.error('DB error (POST /register):', err);
    return res.status(500).json({ message: 'Помилка бази даних' });
  }
});

// ---------------- LOGIN ----------------

router.post('/login', async (req, res) => {
  const db = req.app.locals.db;
  let { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Вкажіть username і пароль' });
  }

  // FIX 7: rate limit по IP
  const clientIp = req.ip || req.connection.remoteAddress;
  if (isBlocked(clientIp)) {
    return res
      .status(429)
      .json({ message: 'Забагато спроб входу, спробуйте пізніше' });
  }

  username = String(username).trim();
  password = String(password);

  if (username.length === 0 || username.length > MAX_USERNAME_LENGTH) {
    registerAttempt(clientIp);
    return res.status(400).json({ message: 'Некоректна довжина username' });
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    registerAttempt(clientIp);
    return res.status(400).json({ message: 'Пароль занадто довгий' });
  }

  const formattedUsername = username.startsWith('@') ? username : `@${username}`;

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [
      formattedUsername,
    ]);

    if (result.rows.length === 0) {
      registerAttempt(clientIp);
      return res.status(401).json({ message: 'Невірний логін або пароль' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      registerAttempt(clientIp);
      return res.status(401).json({ message: 'Невірний логін або пароль' });
    }

    // успішний логін — скидаємо лічильник
    loginAttempts.delete(clientIp);

    let token;
    try {
      // FIX 6: окрема обробка можливих проблем з JWT
      token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '2h' }
      );
    } catch (jwtErr) {
      console.error('JWT sign error:', jwtErr);
      return res
        .status(500)
        .json({ message: 'Помилка генерації токена авторизації' });
    }

    return res.json({
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
    return res.status(500).json({ message: 'Помилка бази даних' });
  }
});

module.exports = router;
