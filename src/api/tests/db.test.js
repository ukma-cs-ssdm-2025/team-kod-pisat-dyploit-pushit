const db = require('../db.js');
const { Pool } = require('pg');

jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn().mockResolvedValue(),
    query: jest.fn(),
    end: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('DB module', () => {
  test('should connect to DB successfully', async () => {
    await expect(db.connect()).resolves.not.toThrow();
  });

  test('should return rows on query', async () => {
    const mockRows = [{ id: 1, username: '@alice' }];
    db.query = jest.fn().mockResolvedValue({ rows: mockRows });
    const result = await db.query('SELECT * FROM users');
    expect(result.rows).toEqual(mockRows);
  });
});
