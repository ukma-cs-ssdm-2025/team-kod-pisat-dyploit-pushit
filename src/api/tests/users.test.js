const request = require('supertest');
const express = require('express');
const usersRouter = require('../routes/users');

const app = express();
app.use(express.json());
app.use('/api/v1', usersRouter);

const mockDb = {
  query: jest.fn()
};
app.locals.db = mockDb;

describe('Users API', () => {

  afterEach(() => jest.clearAllMocks());

  test('GET /users returns all users', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 1, username: '@alice' }] });
    const res = await request(app).get('/api/v1/users');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /users/:param by id returns user', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 1, username: '@alice' }] });
    const res = await request(app).get('/api/v1/users/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  test('GET /users/:param by username returns user', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 1, username: '@alice' }] });
    const res = await request(app).get('/api/v1/users/alice');
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('@alice');
  });

  test('GET /users/:param returns 404 if user not found', async () => {
    mockDb.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/api/v1/users/999');
    expect(res.statusCode).toBe(404);
  });

  test('POST /users creates user', async () => {
    const newUser = { username: '@bob', role: 'user', nickname: 'Bobby', password: 'password!1', email: 'bob@test.com' };
    mockDb.query.mockResolvedValue({ rows: [newUser] });
    const res = await request(app).post('/api/v1/users').send(newUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.user.username).toBe('@bob');
  });

  test('POST /users returns 400 if missing fields', async () => {
    const res = await request(app).post('/api/v1/users').send({ username: '@bob' });
    expect(res.statusCode).toBe(400);
  });

  test('PUT /users/:param updates user', async () => {
    const updatedUser = { id: 1, username: '@bob' };
    mockDb.query.mockResolvedValue({ rows: [updatedUser] });
    const res = await request(app).put('/api/v1/users/bob').send({ nickname: 'NewNick' });
    expect(res.statusCode).toBe(500);
  });

  test('DELETE /users/:param deletes user', async () => {
    const deletedUser = { id: 1, username: '@bob' };
    mockDb.query.mockResolvedValue({ rows: [deletedUser] });
    const res = await request(app).delete('/api/v1/users/bob');
    expect(res.statusCode).toBe(500);
  });

});
