const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};
const mockDb = {
  connect: jest.fn(() => mockClient)
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ message: 'Треба авторизація' });

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch {
    return res.status(403).json({ message: 'Невірний токен' });
  }
};

const reviewsRouter = express.Router();
reviewsRouter.post('/reviews', authMiddleware, async (req, res) => {
  const client = await mockDb.connect();
  const { title, body, rating, movie_id } = req.body;

  if (!title || !body || !rating || !movie_id || rating < 1 || rating > 10)
    return res.status(400).json({ message: 'Всі поля обов’язкові і rating 1–10' });

  try {
    await client.query('BEGIN');

    const insertResult = await client.query('INSERT INTO reviews ... RETURNING *', [title, body, rating, movie_id, req.user.id]);
    const avgResult = await client.query('SELECT AVG(rating) as avg_rating FROM reviews WHERE movie_id = $1', [movie_id]);
    const avgRating = avgResult.rows[0].avg_rating;

    await client.query('UPDATE movies SET rating = $1 WHERE id = $2', [avgRating, movie_id]);
    await client.query('COMMIT');

    res.status(201).json({ message: 'Рецензію створено', review: insertResult.rows[0], avg_rating: avgRating });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

const app = express();
app.use(express.json());
app.use('/api/v1', reviewsRouter);

describe('Reviews API', () => {

  afterEach(() => jest.clearAllMocks());

  test('REQ-REVIEW: POST /reviews creates review and updates avg rating', async () => {
    const token = jwt.sign({ id: 1, username: '@alice' }, process.env.JWT_SECRET || 'secret');

    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 101, title: 'Great', rating: 9 }] })
      .mockResolvedValueOnce({ rows: [{ avg_rating: 8.5 }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Great', body: 'Loved it', rating: 9, movie_id: 10 });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Рецензію створено');
    expect(res.body.review.rating).toBe(9);
    expect(res.body.avg_rating).toBe(8.5);
  });

  test('REQ-REVIEW-NEG: POST /reviews returns 400 for invalid rating', async () => {
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'secret');

    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bad', body: 'Not good', rating: 15, movie_id: 10 }); // >10

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Всі поля обов’язкові і rating 1–10');
  });

  test('REQ-REVIEW-NEG: POST /reviews returns 403 if no token', async () => {
    const res = await request(app)
      .post('/api/v1/reviews')
      .send({ title: 'Test', body: 'Test', rating: 5, movie_id: 10 });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Треба авторизація');
  });

});
