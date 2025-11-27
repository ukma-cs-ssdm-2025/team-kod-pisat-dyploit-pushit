const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

const app = express();
app.use(express.json());

app.post('/api/v1/reviews', authMiddleware, (req, res) => {
  res.status(201).json({ message: 'Рецензію створено', review: { user_id: req.user.id } });
});

describe('Security API - JWT', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

  test('REQ-SECURITY: request without token returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .send({ title: 'Test', body: 'Body', rating: 5, movie_id: 1 });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Немає токена');
  });

  test('REQ-SECURITY: request with invalid token returns 403', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', 'Bearer faketoken123')
      .send({ title: 'Test', body: 'Body', rating: 5, movie_id: 1 });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Недійсний токен');
  });

  test('REQ-SECURITY: request with expired token returns 403', async () => {
    const expiredToken = jwt.sign(
      { id: 1, username: '@alice', role: 'user' },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );

    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({ title: 'Test', body: 'Body', rating: 5, movie_id: 1 });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Недійсний токен');
  });

  test('REQ-SECURITY: request with valid token returns 201', async () => {
    const validToken = jwt.sign(
      { id: 1, username: '@alice', role: 'user' },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Test', body: 'Body', rating: 5, movie_id: 1 });

    expect(res.statusCode).toBe(201);
    expect(res.body.review.user_id).toBe(1);
    expect(res.body.message).toBe('Рецензію створено');
  });
});
