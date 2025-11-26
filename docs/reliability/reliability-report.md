# Reliability Report

## 1. Executive Summary
Цей звіт містить аналіз бекенд та фронтенд коду проекту Flick.ly. Було виявлено критичні вразливості в безпеці даних (витік хешів паролів), проблеми з масштабованістю (відсутність пагінації) та порушення цілісності даних (відсутність транзакцій при розрахунку рейтингів).

## 2. Summary of Issues

| ID | Component | Issue Type | Description | Classification | Severity |  Status | 
|----|-----------|------------|-------------|----------------|----------|--------|
| R-01 | `users.js` | **Security / Privacy** | Endpoints повертають повний об'єкт користувача, включаючи хеш пароля (`password`). | Failure | **Critical** | Open |
| R-02 | `reviews.js` | **Data Integrity** | Оновлення рейтингу фільму та створення рецензії не є атомарними (Race Condition). | Fault | **High** | Open |
| R-03 | `movies.js` | **Performance** | `GET /movies` завантажує всю базу даних без пагінації. | Failure | **High** | Open |
| R-04 | `users.js` | **Performance** | `GET /users` завантажує всіх користувачів без пагінації. | Failure | **Medium** | Open |
| R-05 | `auth.js` | **Security** | Відсутність Rate Limiting на логін/реєстрацію (ризик Brute Force). | Failure | **Medium** | Open |
| R-06 | `movies.js` | **Error Handling** | Завантаження обкладинки відбувається окремо від створення запису фільму (можливі "сироти" файлів). | Fault | **Low** | Open |

---

## 3. Detailed Analysis & Fixes

### R-01: Password Hash Exposure
**Опис:** Маршрут `GET /users` та `GET /users/:param` виконує `SELECT *`. Це передає на фронтенд поле `password` (хеш) та `email` всіх користувачів, що є серйозним порушенням безпеки.

**Before:**
```javascript
// users.js
router.get('/users', async (req, res) => {
  // ...
  const result = await db.query('SELECT * FROM users ORDER BY id');
  res.json(result.rows); 
});
```
**After:**
```javascript
// users.js
router.get('/users', async (req, res) => {
  // ...
  // Явно вказуємо поля, які безпечно віддавати (Projection)
  const result = await db.query(`
    SELECT id, username, nickname, role, avatar_url, created_at 
    FROM users 
    ORDER BY id
  `);
  res.json(result.rows);
});
```

### R-02: Lack of Atomicity in Rating Calculation
**Опис:** При створенні рецензії спочатку робиться INSERT, а потім окремим викликом updateMovieRating (який робить SELECT AVG і UPDATE). Якщо сервер впаде між цими діями або при паралельних запитах, рейтинг фільму буде некоректним.

**Before:**
```javascript
// reviews.js (POST /reviews)
const result = await db.query(
  `INSERT INTO reviews ... RETURNING *`,
  [title, body, rating, movie_id, req.user.id]
);

// Ця функція працює поза транзакцією
await updateMovieRating(db, movie_id);
```
**After:**
```javascript
// reviews.js
router.post('/reviews', async (req, res) => {
  const client = await req.app.locals.db.connect();
  try {
    await client.query('BEGIN'); // Початок транзакції

    const result = await client.query(
      `INSERT INTO reviews (title, body, rating, movie_id, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [title, body, rating, movie_id, req.user.id]
    );

    // Розрахунок та оновлення всередині тієї ж транзакції
    // Використовуємо FOR UPDATE для блокування рядка фільму від стану гонки
    const { rows } = await client.query(
      'SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE movie_id = $1',
      [movie_id]
    );
    const finalRating = Math.round(parseFloat(rows[0].avg_rating) * 10) / 10;
    
    await client.query(
      'UPDATE movies SET rating = $1 WHERE id = $2',
      [finalRating, movie_id]
    );

    await client.query('COMMIT'); // Фіксація змін
    res.status(201).json({ message: 'Рецензію створено', review: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK'); // Відкат при помилці
    // ... error handling
  } finally {
    client.release();
  }
});
```

### R-03: No Pagination
**Опис:** GET /movies завантажує всі фільми. Якщо в базі буде 10,000 фільмів, сервер спробує серіалізувати масив з 10 тисяч об'єктів, а браузер "зависне" при рендерингу.

**Before:**
```javascript
// movies.js
const result = await db.query(`
  SELECT m.*, ... 
  FROM movies m ...
`);
res.json(result.rows);
```
**After:**
```javascript
// movies.js
router.get('/movies', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await db.query(`
    SELECT m.*, 
           COALESCE(ARRAY_AGG(mp.person_id) FILTER (WHERE mp.person_id IS NOT NULL), '{}') as people_ids
    FROM movies m
    LEFT JOIN movie_people mp ON m.id = mp.movie_id
    GROUP BY m.id
    ORDER BY m.id
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  
  res.json(result.rows);
});
```
## 4. Open Issues
* Backend Validation: Наразі перевірка даних покладається на прості if. Рекомендується впровадити бібліотеку валідації схем (наприклад, Joi або Zod) для всіх POST/PUT запитів, щоб уникнути SQL Injection через нестандартні типи даних або логічних помилок.

* Rate Limiting: Маршрути /auth/login та /auth/register не захищені від перебору паролів. Необхідно додати middleware (наприклад, express-rate-limit).

* Config Management: Константи (наприклад, SALT_ROUNDS, секрети) частково захардкоджені. Потрібно винести все в змінні середовища .env.

* Orphaned Files: При видаленні фільму транзакція відкатується, якщо БД падає, але файл з R2 може бути вже видалений (або навпаки). Рекомендується використовувати механізм черг або cron-job для очистки файлів, які не мають посилань у БД ("Garbage Collection").

* N+1 Query Problem: У Frontend (Movie.jsx) робиться Promise.all з купою запитів. Для списку фільмів (Movies.jsx), якщо ми захочемо показати імена акторів, нам доведеться для кожного фільму робити запит або вантажити всіх людей (що зараз і робиться: getAllPeople). Це не масштабується. Потрібно змінити SQL запит, щоб повертати імена акторів разом з фільмом (JSON Aggregation).
