const request = require('supertest');
const express = require('express');
const reviewsRouter = require('../routes/reviews');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/v1', reviewsRouter);

app.use((req, res, next) => {
  req.user = { id: 1, username: '@alice' };
  next();
});

describe('Performance API /reviews', () => {
  test('REQ-PERF: 90% of requests <1.5s, RPS ≥20', async () => {
    const requests = 50;
    const times = [];

    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'secret');

    for (let i = 0; i < requests; i++) {
      const start = Date.now();
      await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `Review ${i}`, body: 'Test body', rating: 8, movie_id: 1 });
      const duration = Date.now() - start;
      times.push(duration);
    }

    const fastRequests = times.filter(t => t < 1500).length;
    const avgRPS = (requests / (times.reduce((a, b) => a + b, 0) / 1000));

    console.log('Times (ms):', times);
    console.log('Fast requests:', fastRequests, '/', requests);
    console.log('Average RPS:', avgRPS.toFixed(2));

    expect(fastRequests / requests).toBeGreaterThanOrEqual(0.9); // 90% < 1.5s
    expect(avgRPS).toBeGreaterThanOrEqual(20); // RPS ≥ 20
  });
});
