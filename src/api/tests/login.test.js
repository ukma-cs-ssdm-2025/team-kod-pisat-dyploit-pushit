const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

jest.mock('bcrypt');

const mockDb = {
  query: jest.fn()
};

const expressRouterMock = () => {
  const router = require('express').Router();
  const JWT_SECRET = process.env.JWT_SECRET || 'secret';

  router.post('/login', async (req, res) => {
    const db = { query: mockDb.query };
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Вкажіть username і пароль' });
    }
    const formattedUsername = username.startsWith('@') ? username : `@${username}`;

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
  });

  return router;
};

const app = express();
app.use(express.json());
app.use('/api/v1/auth', expressRouterMock());

describe('Auth API', () => {

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test('REQ-LOGIN: POST /login returns 200 and token for valid credentials', async () => {
    const mockUser = {
      id: 1,
      username: '@alice',
      role: 'user',
      nickname: 'Alice',
      email: 'alice@test.com',
      password: '$2b$10$hashed'
    };
    mockDb.query.mockResolvedValue({ rows: [mockUser] });

    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: '@alice', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.message).toBe('Авторизація успішна');
    expect(res.body.user.username).toBe('@alice');

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET || 'secret');
    expect(payload.id).toBe(mockUser.id);
    expect(payload.username).toBe(mockUser.username);
  });

  test('REQ-LOGIN-NEG: POST /login returns 401 for invalid password', async () => {
    const mockUser = { id: 1, username: '@alice', password: '$2b$10$hashed' };
    mockDb.query.mockResolvedValue({ rows: [mockUser] });

    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: '@alice', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Невірний логін або пароль');
  });

  test('REQ-LOGIN-NEG: POST /login returns 401 if user not found', async () => {
    mockDb.query.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: '@bob', password: 'password123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Невірний логін або пароль');
  });

  test('REQ-LOGIN-NEG: POST /login returns 400 if missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: '@alice' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Вкажіть username і пароль');
  });

});
