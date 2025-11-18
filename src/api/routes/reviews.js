const express = require('express');
const router = express.Router();

// --- ДОПОМІЖНА ФУНКЦІЯ ---
// Оновлює кешований рейтинг у таблиці movies на основі таблиці reviews
async function updateMovieRating(db, movieId) {
  try {
    const { rows } = await db.query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE movie_id = $1',
      [movieId]
    );
    
    const average = rows[0].avg_rating ? parseFloat(rows[0].avg_rating).toFixed(1) : 0;

    await db.query(
      'UPDATE movies SET rating = $1 WHERE id = $2',
      [average, movieId]
    );
    console.log(`Rating updated for movie ${movieId}: ${average}`);
  } catch (err) {
    console.error(`Failed to update rating for movie ${movieId}:`, err);
  }
}

/**
 * @openapi
 * /api/v1/reviews:
 * get:
 * summary: Отримати список усіх рецензій
 * tags:
 * - Reviews
 * responses:
 * 200:
 * description: Список рецензій
 */
router.get('/reviews', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query(`
      SELECT * FROM reviews ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('DB error (GET /reviews):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/reviews/{id}:
 * get:
 * summary: Отримати рецензію за ID
 * tags:
 * - Reviews
 * parameters:
 * - name: id
 * in: path
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Рецензія знайдена
 * 404:
 * description: Рецензія не знайдена
 */
router.get('/reviews/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  try {
    const result = await db.query(`SELECT * FROM reviews WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Рецензію не знайдено' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB error (GET /reviews/:id):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/reviews:
 * post:
 * summary: Створити нову рецензію
 * tags:
 * - Reviews
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [title, body, rating, movie_id]
 * properties:
 * title:
 * type: string
 * body:
 * type: string
 * rating:
 * type: integer
 * movie_id:
 * type: integer
 * responses:
 * 201:
 * description: Рецензію створено
 */
router.post('/reviews', async (req, res) => {
  const db = req.app.locals.db;
  const { title, body, rating, movie_id } = req.body;

  if (!title || !body || !rating || !movie_id)
    return res.status(400).json({ message: 'Всі поля обов’язкові' });

  try {
    const result = await db.query(
      `INSERT INTO reviews (title, body, rating, movie_id, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [title, body, rating, movie_id, req.user.id]
    );

    // --- ОНОВЛЕННЯ РЕЙТИНГУ ФІЛЬМУ ---
    await updateMovieRating(db, movie_id);
    
    res.status(201).json({ message: 'Рецензію створено', review: result.rows[0] });
  } catch (err) {
    console.error('DB error (POST /reviews):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/reviews/{id}:
 * put:
 * summary: Оновити рецензію
 * tags:
 * - Reviews
 * security:
 * - bearerAuth: []
 * parameters:
 * - name: id
 * in: path
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * body:
 * type: string
 * rating:
 * type: integer
 * responses:
 * 200:
 * description: Рецензію оновлено
 * 403:
 * description: Недостатньо прав
 * 404:
 * description: Рецензію не знайдено
 */
router.put('/reviews/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { title, body, rating } = req.body;

  try {
    const review = await db.query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (review.rows.length === 0) return res.status(404).json({ message: 'Рецензію не знайдено' });

    const currentReview = review.rows[0];

    if (currentReview.user_id !== req.user.id && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Недостатньо прав для редагування цієї рецензії' });
    }

    const result = await db.query(
      `UPDATE reviews
       SET title = COALESCE($1, title),
           body = COALESCE($2, body),
           rating = COALESCE($3, rating)
       WHERE id = $4
       RETURNING *`,
      [title, body, rating, id]
    );

    // --- ОНОВЛЕННЯ РЕЙТИНГУ ФІЛЬМУ ---
    // Використовуємо movie_id зі старого запису (бо він не змінюється)
    await updateMovieRating(db, currentReview.movie_id);

    res.json({ message: 'Рецензію оновлено', review: result.rows[0] });
  } catch (err) {
    console.error('DB error (PUT /reviews/:id):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/reviews/{id}:
 * delete:
 * summary: Видалити рецензію
 * tags:
 * - Reviews
 * security:
 * - bearerAuth: []
 * parameters:
 * - name: id
 * in: path
 * required: true
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Рецензію видалено
 * 403:
 * description: Недостатньо прав
 * 404:
 * description: Рецензію не знайдено
 */
router.delete('/reviews/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    const review = await db.query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (review.rows.length === 0) return res.status(404).json({ message: 'Рецензію не знайдено' });

    const currentReview = review.rows[0];

    if (currentReview.user_id !== req.user.id && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Недостатньо прав для видалення цієї рецензії' });
    }

    const result = await db.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);

    // --- ОНОВЛЕННЯ РЕЙТИНГУ ФІЛЬМУ ---
    await updateMovieRating(db, currentReview.movie_id);

    res.json({ message: 'Рецензію видалено', review: result.rows[0] });
  } catch (err) {
    console.error('DB error (DELETE /reviews/:id):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;