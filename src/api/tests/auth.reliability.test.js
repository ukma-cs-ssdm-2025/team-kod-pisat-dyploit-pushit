// tests/auth.reliability.test.js

const request = require('supertest');
const app = require('../app'); 

describe('Auth reliability tests (Lab 9)', () => {
  /**
   * 1) Error-handling test
   
   * Сценарій:
   *  - Надсилаємо некоректні типи полів на /auth/register (username = об’єкт)
   *  - Очікуємо: 400, JSON з повідомленням, а не 500/краш.
   *  - Перевіряємо, що валідатор типів працює і помилка обробляється коректно.
   */
  test('Error-handling: invalid field types are rejected with 400, not 500', async () => {
    // мокаємо db, щоб навіть якщо код дійде до нього — не впав
    app.locals.db = {
      query: jest.fn(),
    };

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: { bad: 'type' }, // НЕ string
        password: 12345678,        // НЕ string
        email: ['not', 'string'],  // НЕ string
        nickname: null,           // НЕ string
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    
    expect(res.body.message).toMatch(/формат полів|формат/i);
  });

  /**
   * 2) External failure test
  
   * Сценарій:
   *  - Перший виклик db.query (SELECT) — повертає, що такого юзера немає.
   *  - Другий виклик db.query (INSERT) — кидає помилку з code = '23505'
   *    (PostgreSQL duplicate key).
   *  - Очікуємо: 409 Conflict з читабельним повідомленням,
   *    а НЕ 500 "Database error".
   */
  test('External failure: duplicate key (23505) on register is handled as 409 Conflict', async () => {
    const fakeDb = {
      query: jest
        .fn()
        // 1-й виклик: SELECT ... WHERE username/email
        .mockResolvedValueOnce({ rows: [] })
        // 2-й виклик: INSERT ... → дубль
        .mockRejectedValueOnce({ code: '23505' }),
    };

    app.locals.db = fakeDb;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: '@testuser',
        password: 'Qwerty!123',
        email: 'test@example.com',
        nickname: 'Tester',
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/вже існує/i);
    // Додатково: переконуємось, що db.query справді викликався двічі
    expect(fakeDb.query).toHaveBeenCalledTimes(2);
  });

  /**
   * 3) Boundary test
   
   * Сценарій:
   *  - Надсилаємо пароль, довший за дозволену довжину (наприклад, 201 символ).
   *  - Очікуємо: 400 + повідомлення "Занадто довгі вхідні дані"
   *  - Перевіряємо, що БД взагалі не викликається (перевірка довжини працює як guard clause).
   */
  test('Boundary: too long password is rejected with 400 and DB is not called', async () => {
    const longPassword = 'A'.repeat(201); // > 200 символів
    const fakeDb = {
      query: jest.fn(),
    };

    app.locals.db = fakeDb;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: '@boundaryuser',
        password: longPassword,
        email: 'boundary@example.com',
        nickname: 'Boundary',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/занадто довгі|довгі вхідні дані/i);

    // Перевіряємо, що через guard clause ми навіть не дійшли до БД
    expect(fakeDb.query).not.toHaveBeenCalled();
  });
});
