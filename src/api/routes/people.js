const express = require('express');
const router = express.Router();
const { deleteFileFromR2 } = require('../utils/r2');

/**
 * @openapi
 * /api/v1/people/stats:
 *   get:
 *     summary: Отримати статистику по людях
 *     tags:
 *       - People
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
 *                 actors:
 *                   type: integer
 *                 directors:
 *                   type: integer
 *                 producers:
 *                   type: integer
 */
router.get('/people/stats', async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const [totalResult, actorsResult, directorsResult, producersResult] = await Promise.all([
      db.query('SELECT COUNT(*) AS count FROM people'),
      db.query('SELECT COUNT(*) AS count FROM people WHERE profession = $1', ['actor']),
      db.query('SELECT COUNT(*) AS count FROM people WHERE profession = $1', ['director']),
      db.query('SELECT COUNT(*) AS count FROM people WHERE profession = $1', ['producer'])
    ]);

    res.json({
      total: parseInt(totalResult.rows[0].count, 10),
      actors: parseInt(actorsResult.rows[0].count, 10),
      directors: parseInt(directorsResult.rows[0].count, 10),
      producers: parseInt(producersResult.rows[0].count, 10)
    });
  } catch (err) {
    console.error('DB error (GET /people/stats):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/people/professions:
 *   get:
 *     summary: Отримати список унікальних професій
 *     tags:
 *       - People
 *     responses:
 *       200:
 *         description: Успішне отримання списку професій
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/people/professions', async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const result = await db.query(
      'SELECT DISTINCT profession FROM people ORDER BY profession'
    );
    
    const professions = result.rows.map(row => row.profession);
    res.json(professions);
  } catch (err) {
    console.error('DB error (GET /people/professions):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/people:
 *   get:
 *     summary: Отримати список усіх людей з пошуком та фільтрацією
 *     tags:
 *       - People
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
 *         description: Пошук по імені, прізвищу або біографії
 *         schema:
 *           type: string
 *       - name: profession
 *         in: query
 *         required: false
 *         description: Фільтр по професії
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Успішне отримання списку людей
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 people:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       profession:
 *                         type: string
 *                       biography:
 *                         type: string
 */
router.get('/people', async (req, res) => {
  const db = req.app.locals.db;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const profession = req.query.profession || '';

  try {
    let query = 'SELECT * FROM people';
    let countQuery = 'SELECT COUNT(*) AS total FROM people';
    const params = [];
    const whereConditions = [];

    if (search) {
      whereConditions.push(
        `(first_name ILIKE $${params.length + 1} OR last_name ILIKE $${params.length + 1} OR biography ILIKE $${params.length + 1})`
      );
      params.push(`%${search}%`);
    }

    if (profession) {
      whereConditions.push(`profession = $${params.length + 1}`);
      params.push(profession);
    }

    if (whereConditions.length > 0) {
      const whereClause = 'WHERE ' + whereConditions.join(' AND ');
      query += ' ' + whereClause;
      countQuery += ' ' + whereClause;
    }

    query += ' ORDER BY last_name, first_name';
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const countResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total, 10);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      people: result.rows
    });
  } catch (err) {
    console.error('DB error (GET /people):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/people/{id}:
 *   get:
 *     summary: Отримати інформацію про конкретну людину з фільмами
 *     tags:
 *       - People
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID людини
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Успішне отримання даних людини з переліком фільмів
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 profession:
 *                   type: string
 *                 biography:
 *                   type: string
 *                 movies:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Людину не знайдено
 */
router.get('/people/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    const personResult = await db.query('SELECT * FROM people WHERE id = $1', [id]);
    if (personResult.rows.length === 0)
      return res.status(404).json({ message: 'Людину не знайдено' });

    const moviesResult = await db.query(
      `SELECT m.* 
       FROM movies m
       JOIN movie_people mp ON m.id = mp.movie_id
       WHERE mp.person_id = $1`,
      [id]
    );

    res.json({ ...personResult.rows[0], movies: moviesResult.rows });
  } catch (err) {
    console.error('DB error (GET /people/:id):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/**
 * @openapi
 * /api/v1/people:
 *   post:
 *     summary: Додати нову людину
 *     tags:
 *       - People
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - profession
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "Tom"
 *               last_name:
 *                 type: string
 *                 example: "Cruise"
 *               profession:
 *                 type: string
 *                 enum: [actor, producer, director]
 *               biography:
 *                 type: string
 *                 example: "Американський актор і продюсер."
 *               movie_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Людину створено
 *       400:
 *         description: Некоректні дані
 *       403:
 *         description: Недостатньо прав
 *       500:
 *         description: Помилка бази даних
 */
router.post('/people', async (req, res) => {
  const db = req.app.locals.db;
  const { first_name, last_name, profession, biography, movie_ids } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Недостатньо прав для створення запису' });
  }

  if (!first_name || !last_name || !profession) {
    return res.status(400).json({ message: 'Ім’я, прізвище і професія — обов’язкові' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const personResult = await client.query(
      `INSERT INTO people (first_name, last_name, profession, biography)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [first_name, last_name, profession, biography || null]
    );

    const personId = personResult.rows[0].id;

    if (movie_ids && Array.isArray(movie_ids) && movie_ids.length > 0) {
      for (const movieId of movie_ids) {
        await client.query(
          'INSERT INTO movie_people (movie_id, person_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [movieId, personId]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Людину створено', person: personResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DB error (POST /people):', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /api/v1/people/{id}:
 *   put:
 *     summary: Оновити інформацію про людину
 *     tags:
 *       - People
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID людини
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               profession:
 *                 type: string
 *               biography:
 *                 type: string
 *               movie_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Людину оновлено
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Людину не знайдено
 *       500:
 *         description: Помилка бази даних
 */
router.put('/people/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { first_name, last_name, profession, biography, movie_ids } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Недостатньо прав для редагування запису' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE people
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           profession = COALESCE($3, profession),
           biography = COALESCE($4, biography)
       WHERE id = $5
       RETURNING *`,
      [first_name, last_name, profession, biography, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Людину не знайдено' });
    }

    if (Array.isArray(movie_ids)) {
      await client.query('DELETE FROM movie_people WHERE person_id = $1', [id]);
      for (const movieId of movie_ids) {
        await client.query(
          'INSERT INTO movie_people (movie_id, person_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [movieId, id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Людину оновлено', person: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DB error (PUT /people/:id):', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

/**
 * @openapi
 * /api/v1/people/{id}:
 *   delete:
 *     summary: Видалити людину
 *     tags:
 *       - People
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID людини
 *     responses:
 *       200:
 *         description: Людину видалено
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Людину не знайдено
 *       500:
 *         description: Помилка бази даних
 */
router.delete('/people/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Недостатньо прав для видалення запису' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT id, first_name, last_name, avatar_url FROM people WHERE id = $1',
      [id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Людину не знайдено' });
    }

    const person = rows[0];

    if (person.avatar_url) {
      try {
        const oldFileKey = person.avatar_url.split(/\.r2\.(?:cloudflarestorage|dev)\//)[1];
        await deleteFileFromR2(oldFileKey);
      } catch (err) {
        console.warn(`Не вдалося видалити аватарку людини ${person.first_name} ${person.last_name}:`, err.message);
      }
    }

    const deleteResult = await client.query('DELETE FROM people WHERE id = $1 RETURNING *', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Людину видалено', person: deleteResult.rows[0] });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DB error (DELETE /people/:id):', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

module.exports = router;