const express = require('express');
const router = express.Router();
const { deleteFileFromR2 } = require('../utils/r2');

/**
 * @openapi
 * /api/v1/movies/stats:
 *   get:
 *     summary: Отримати статистику по фільмах
 *     tags:
 *       - Movies
 *     responses:
 *       200:
 *         description: Успішне отримання статистики
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 avgRating:
 *                   type: number
 *                 genres:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/movies/stats', async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const [totalResult, avgRatingResult, genresResult] = await Promise.all([
      db.query('SELECT COUNT(*) AS count FROM movies'),
      db.query('SELECT AVG(rating) AS avg FROM movies WHERE rating > 0'),
      db.query('SELECT DISTINCT genre FROM movies WHERE genre IS NOT NULL AND genre != \'\' ORDER BY genre')
    ]);

    res.json({
      total: parseInt(totalResult.rows[0].count, 10),
      avgRating: parseFloat(avgRatingResult.rows[0].avg) || 0,
      genres: genresResult.rows.map(row => row.genre)
    });
  } catch (err) {
    console.error('DB error (GET /movies/stats):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/movies:
 *   get:
 *     summary: Отримати список усіх фільмів з пошуком та фільтрацією
 *     tags:
 *       - Movies
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         description: Номер сторінки
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Кількість записів на сторінку
 *         schema:
 *           type: integer
 *           default: 50
 *       - name: search
 *         in: query
 *         required: false
 *         description: Пошук по назві або опису
 *         schema:
 *           type: string
 *       - name: genre
 *         in: query
 *         required: false
 *         description: Фільтр по жанру
 *         schema:
 *           type: string
 *       - name: person
 *         in: query
 *         required: false
 *         description: Пошук по імені людини (актор, режисер, продюсер)
 *         schema:
 *           type: string
 *       - name: sort
 *         in: query
 *         required: false
 *         description: Сортування
 *         schema:
 *           type: string
 *           enum: [newest, oldest, title_asc, rating_desc, rating_asc]
 *           default: newest
 *     responses:
 *       200:
 *         description: Список фільмів
 */
router.get('/movies', async (req, res) => {
  const db = req.app.locals.db;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const genre = req.query.genre || '';
  const person = req.query.person || '';
  const sort = req.query.sort || 'newest';

  try {
    // Базові частини запиту
    let query = `
      SELECT m.*, 
            COALESCE(ARRAY_AGG(DISTINCT mp.person_id) FILTER (WHERE mp.person_id IS NOT NULL), '{}') as people_ids
      FROM movies m
      LEFT JOIN movie_people mp ON m.id = mp.movie_id
    `;
  
    let countQuery = 'SELECT COUNT(DISTINCT m.id) AS total FROM movies m';
    const params = [];
    const whereConditions = [];

    // Додаємо умови пошуку
    if (search) {
      whereConditions.push(
        `(m.title ILIKE $${params.length + 1} OR m.description ILIKE $${params.length + 1})`
      );
      params.push(`%${search}%`);
    }

    // Додаємо умову фільтрації по жанру
    if (genre) {
      whereConditions.push(`m.genre ILIKE $${params.length + 1}`);
      params.push(`%${genre}%`);
    }

    // Додаємо умову пошуку по людям
    if (person) {
      // Використовуємо EXISTS для перевірки наявності відповідних людей
      whereConditions.push(
        `EXISTS (
          SELECT 1 FROM movie_people mp2
          JOIN people p2 ON mp2.person_id = p2.id
          WHERE mp2.movie_id = m.id 
          AND (p2.first_name ILIKE $${params.length + 1} OR p2.last_name ILIKE $${params.length + 1})
        )`
      );
      params.push(`%${person}%`);
    }

    // Формуємо WHERE частину
    if (whereConditions.length > 0) {
      const whereClause = 'WHERE ' + whereConditions.join(' AND ');
      query += ' ' + whereClause;
      countQuery += ' ' + whereClause;
    }

    // Додаємо GROUP BY
    query += ' GROUP BY m.id';

    // Додаємо сортування
    switch (sort) {
      case 'oldest':
        query += ' ORDER BY m.id ASC';
        break;
      case 'title_asc':
        query += ' ORDER BY m.title ASC';
        break;
      case 'rating_desc':
        query += ' ORDER BY m.rating DESC NULLS LAST, m.id DESC';
        break;
      case 'rating_asc':
        query += ' ORDER BY m.rating ASC NULLS LAST, m.id DESC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY m.id DESC';
        break;
    }

    // Додаємо пагінацію
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    // Виконуємо запит за даними
    const result = await db.query(query, params);

    // Виконуємо запит за загальною кількістю
    const countResult = await db.query(countQuery, params.slice(0, -2)); // Виключаємо limit і offset
    const total = parseInt(countResult.rows[0].total, 10);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      movies: result.rows
    });
  } catch (err) {
    console.error('DB error (GET /movies):', err);
    res.status(500).json({ error: 'Database error' });
  }
  });

/**
 * @openapi
 * /api/v1/movies/genres:
 *   get:
 *     summary: Отримати список унікальних жанрів
 *     tags:
 *       - Movies
 *     responses:
 *       200:
 *         description: Успішне отримання списку жанрів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/movies/genres', async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const result = await db.query(
      `SELECT DISTINCT genre 
       FROM movies 
       WHERE genre IS NOT NULL AND genre != ''
       ORDER BY genre`
    );
    
    const genres = result.rows.map(row => row.genre);
    res.json(genres);
  } catch (err) {
    console.error('DB error (GET /movies/genres):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/movies/{id}:
 *   get:
 *     summary: Отримати фільм за ID з усіма людьми
 *     tags:
 *       - Movies
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID фільму
 *     responses:
 *       200:
 *         description: Інформація про фільм та пов'язаних людей
 *       404:
 *         description: Фільм не знайдено
 */
router.get('/movies/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    const movieResult = await db.query('SELECT * FROM movies WHERE id = $1', [id]);
    if (movieResult.rows.length === 0) return res.status(404).json({ message: 'Фільм не знайдено' });

    const peopleResult = await db.query(
      `SELECT p.*
       FROM people p
       JOIN movie_people mp ON p.id = mp.person_id
       WHERE mp.movie_id = $1`,
      [id]
    );

    res.json({ ...movieResult.rows[0], people: peopleResult.rows });
  } catch (err) {
    console.error('DB error (GET /movies/:id):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/movies:
 *   post:
 *     summary: Створити новий фільм з прив'язкою до людей
 *     tags:
 *       - Movies
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               genre:
 *                 type: string
 *               rating:
 *                 type: number
 *               people_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Фільм створено
 *       403:
 *         description: Недостатньо прав
 *       400:
 *         description: Некоректні дані
 */
router.post('/movies', async (req, res) => {
  const db = req.app.locals.db;
  const { title, description, genre, rating, people_ids } = req.body;

  if (!['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Недостатньо прав для створення фільму' });
  }

  if (!title) return res.status(400).json({ message: 'Назва фільму обов`язкова' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const movieResult = await client.query(
      `INSERT INTO movies (title, description, genre, rating)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, genre, rating || 0]
    );

    const movieId = movieResult.rows[0].id;

    if (Array.isArray(people_ids) && people_ids.length > 0) {
      for (const personId of people_ids) {
        await client.query(
          'INSERT INTO movie_people (movie_id, person_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [movieId, personId]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Фільм створено', movie: movieResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DB error (POST /movies):', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /api/v1/movies/{id}:
 *   put:
 *     summary: Оновити дані фільму та зв'язки з людьми
 *     tags:
 *       - Movies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID фільму
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               genre:
 *                 type: string
 *               rating:
 *                 type: number
 *               people_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Фільм оновлено
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Фільм не знайдено
 */
router.put('/movies/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { title, description, genre, rating, people_ids } = req.body;

  if (!['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Недостатньо прав для редагування фільму' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const movieResult = await client.query(
      `UPDATE movies
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           genre = COALESCE($3, genre),
           rating = COALESCE($4, rating)
       WHERE id = $5
       RETURNING *`,
      [title, description, genre, rating, id]
    );

    if (movieResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Фільм не знайдено' });
    }

    if (Array.isArray(people_ids)) {
      await client.query('DELETE FROM movie_people WHERE movie_id = $1', [id]);
      for (const personId of people_ids) {
        await client.query(
          'INSERT INTO movie_people (movie_id, person_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, personId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Фільм оновлено', movie: movieResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DB error (PUT /movies/:id):', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /api/v1/movies/{id}:
 *   delete:
 *     summary: Видалити фільм за ID
 *     tags:
 *       - Movies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID фільму
 *     responses:
 *       200:
 *         description: Фільм видалено
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Фільм не знайдено
 */
router.delete('/movies/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  if (!['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Недостатньо прав для видалення фільму' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT cover_url FROM movies WHERE id = $1', [id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Фільм не знайдено' });
    }

    const coverUrl = rows[0].cover_url;
    if (coverUrl) {
      const oldFileKey = coverUrl.split(/\.r2\.(?:cloudflarestorage|dev)\//)[1];
      await deleteFileFromR2(oldFileKey);
    }

    const deleteResult = await client.query('DELETE FROM movies WHERE id = $1 RETURNING *', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Фільм видалено', movie: deleteResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DB error (DELETE /movies/:id):', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /api/v1/movies/{userParam}/likes/{movieId}:
 *   post:
 *     summary: Додати фільм до списку улюблених користувача
 *     tags:
 *       - Movies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userParam
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID або username користувача (наприклад, "12" або "@alex")
 *       - name: movieId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID фільму
 *     responses:
 *       200:
 *         description: Фільм додано до улюблених
 *       404:
 *         description: Користувача або фільм не знайдено
 *       500:
 *         description: Помилка сервера
 */
router.post("/movies/:userParam/likes/:movieId", async (req, res) => {
  const { userParam, movieId } = req.params;
  const db = req.app.locals.db;

  try {
    const movieCheck = await db.query("SELECT id FROM movies WHERE id = $1", [movieId]);
    if (movieCheck.rows.length === 0) {
      return res.status(404).json({ message: "Фільм не знайдено" });
    }

    let target = {};
    if (/^\d+$/.test(userParam)) {
      target = { column: "id", value: userParam };
    } else {
      const username = userParam.startsWith("@") ? userParam : `@${userParam}`;
      target = { column: "username", value: username };
    }

    const userCheck = await db.query(
      `SELECT liked_movies FROM users WHERE ${target.column} = $1`,
      [target.value]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "Користувача не знайдено" });
    }

    await db.query(
      `UPDATE users 
       SET liked_movies = array_append(liked_movies, $1)
       WHERE ${target.column} = $2 
         AND NOT ($1 = ANY(liked_movies))`,
      [movieId, target.value]
    );

    res.json({ message: "Фільм додано в улюблені" });

  } catch (err) {
    console.error("DB error (POST /movies/:userParam/likes/:movieId):", err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

/**
 * @openapi
 * /api/v1/movies/{userParam}/likes/{movieId}:
 *   delete:
 *     summary: Видалити фільм зі списку улюблених користувача
 *     tags:
 *       - Movies
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userParam
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID або username користувача (наприклад, "12" або "@alex")
 *       - name: movieId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID фільму
 *     responses:
 *       200:
 *         description: Фільм видалено з улюблених
 *       404:
 *         description: Користувача або фільм не знайдено
 *       500:
 *         description: Помилка сервера
 */
router.delete("/movies/:userParam/likes/:movieId", async (req, res) => {
  const { userParam, movieId } = req.params;
  const db = req.app.locals.db;

  try {
    const movieCheck = await db.query("SELECT id FROM movies WHERE id = $1", [movieId]);
    if (movieCheck.rows.length === 0) {
      return res.status(404).json({ message: "Фільм не знайдено" });
    }

    let target = {};
    if (/^\d+$/.test(userParam)) {
      target = { column: "id", value: userParam };
    } else {
      const username = userParam.startsWith("@") ? userParam : `@${userParam}`;
      target = { column: "username", value: username };
    }

    const userCheck = await db.query(
      `SELECT liked_movies FROM users WHERE ${target.column} = $1`,
      [target.value]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "Користувача не знайдено" });
    }

    await db.query(
      `UPDATE users 
       SET liked_movies = array_remove(liked_movies, $1)
       WHERE ${target.column} = $2`,
      [movieId, target.value]
    );

    res.json({ message: "Фільм видалено з улюблених" });

  } catch (err) {
    console.error("DB error (DELETE /movies/:userParam/likes/:movieId):", err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});

module.exports = router;