const express = require('express');
const multer = require('multer');
const { uploadFileToR2, deleteFileFromR2 } = require('../utils/r2');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @openapi
 * /api/v1/upload/avatar:
 *   post:
 *     summary: Завантажити аватар користувача
 *     description: |
 *       Приймає зображення користувача (`.jpg`, `.png`, `.jpeg`) та завантажує його до Cloudflare R2.
 *       Повертає публічне посилання на файл.
 *       Якщо у користувача вже є аватарка, повторний аплоад заборонений.
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Файл зображення користувача
 *     responses:
 *       200:
 *         description: Файл успішно завантажено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   example: "https://example-bucket.r2.cloudflarestorage.com/avatars/1731348743215_avatar.png"
 *       400:
 *         description: Файл не був переданий або аватарка вже існує
 *       401:
 *         description: Неавторизований користувач
 *       404:
 *         description: Користувача не знайдено
 *       500:
 *         description: Помилка сервера або завантаження файлу
 */

router.post('/upload/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const db = req.app.locals.db;

    if (!req.file) {
      return res.status(400).json({ error: 'Файл не завантажено' });
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Неавторизований користувач' });

    const { rows } = await db.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Користувача не знайдено' });
    if (rows[0].avatar_url) {
      return res.status(400).json({ error: 'Аватарка вже завантажена, повторно не можна' });
    }

    const fileName = `avatars/${Date.now()}_${req.file.originalname}`;
    const fileUrl = await uploadFileToR2(req.file.buffer, fileName, req.file.mimetype);

    await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [fileUrl, userId]);

    res.json({ success: true, url: fileUrl });

  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ error: 'Помилка під час завантаження файлу' });
  }
});

/**
 * @openapi
 * /api/v1/upload/avatar:
 *   put:
 *     summary: Замінити існуючу аватарку
 *     description: |
 *       Якщо у користувача вже є аватарка, старий файл видаляється з Cloudflare R2, а новий завантажується замість нього.
 *       Повертає публічне посилання на новий файл.
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Новий файл зображення (.jpg, .jpeg або .png)
 *     responses:
 *       200:
 *         description: Аватарку успішно замінено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 url:
 *                   type: string
 *                   example: "https://example-bucket.r2.cloudflarestorage.com/avatars/1731348743215_avatar.png"
 *       400:
 *         description: Файл не передано або сталася помилка під час видалення старого аватара
 *       401:
 *         description: Неавторизований користувач
 *       404:
 *         description: Користувача не знайдено
 *       500:
 *         description: Помилка сервера або завантаження файлу
 */

router.put('/upload/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const db = req.app.locals.db;

    if (!req.file) return res.status(400).json({ error: 'Файл не завантажено' });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Неавторизований користувач' });

    const { rows } = await db.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Користувача не знайдено' });

    const oldUrl = rows[0].avatar_url;
    if (oldUrl) {
      try {
        const oldFileKey = oldUrl.split('/').slice(-2).join('/');
        await deleteFileFromR2(oldFileKey);
      } catch (err) {
        console.warn('Не вдалося видалити старий файл з R2:', err.message);
      }
    }

    // Завантажуємо нову
    const fileName = `avatars/${Date.now()}_${req.file.originalname}`;
    const fileUrl = await uploadFileToR2(req.file.buffer, fileName, req.file.mimetype);

    await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [fileUrl, userId]);

    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error('Replace avatar error:', err);
    res.status(500).json({ error: 'Помилка під час заміни файлу' });
  }
});

/**
 * @openapi
 * /api/v1/upload/avatar/{param}:
 *   delete:
 *     summary: Видалити аватар користувача
 *     description: Видаляє аватарку користувача за його ID або username. Адміністратор може видаляти будь-які аватарки, звичайний користувач — лише свою.
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: param
 *         in: path
 *         required: true
 *         description: ID або username користувача (наприклад, `2` або `@string5`)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Аватарку успішно видалено
 *       400:
 *         description: Аватарки не існує
 *       401:
 *         description: Неавторизований користувач
 *       403:
 *         description: Недостатньо прав для видалення чужої аватарки
 *       404:
 *         description: Користувача не знайдено
 *       500:
 *         description: Помилка сервера
 */

router.delete('/upload/avatar/:param', async (req, res) => {
  const db = req.app.locals.db;
  const { param } = req.params;

  let target;
  if (/^\d+$/.test(param)) {
    target = { column: 'id', value: param };
  } else {
    const uname = param.startsWith('@') ? param : `@${param}`;
    target = { column: 'username', value: uname };
  }

  try {
    const query = target.column === 'id'
      ? 'SELECT id, username, avatar_url FROM users WHERE id = $1'
      : 'SELECT id, username, avatar_url FROM users WHERE username = $1';
    const { rows } = await db.query(query, [target.value]);

    if (rows.length === 0) return res.status(404).json({ error: 'Користувача не знайдено' });
    const user = rows[0];

    if (req.user.role === 'user' &&
      user.id !== req.user.id &&
      user.username !== req.user.username) {
      return res.status(403).json({ error: 'Недостатньо прав для видалення чужої аватарки' });
    }

    if (!user.avatar_url) {
      return res.status(400).json({ error: 'Аватарки немає' });
    }

    const oldUrl = user.avatar_url;
    const oldFileKey = oldUrl.split(/\.r2\.(?:cloudflarestorage|dev)\//)[1];
    await deleteFileFromR2(oldFileKey);

    await db.query('UPDATE users SET avatar_url = NULL WHERE id = $1', [user.id]);

    res.json({ success: true, message: `Аватарку користувача ${user.username} видалено` });

  } catch (err) {
    console.error('Delete avatar error:', err);
    res.status(500).json({ error: 'Помилка під час видалення файлу' });
  }
});

/**
 * @openapi
 * /api/v1/upload/movie-cover/{id}:
 *   post:
 *     summary: Завантажити обкладинку фільму
 *     description: |
 *       Дозволено лише адміністратору. Приймає зображення та завантажує до Cloudflare R2.
 *       Якщо у фільму вже є обкладинка, повторне завантаження заборонено.
 *     tags:
 *       - Upload
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover:
 *                 type: string
 *                 format: binary
 *                 description: Файл зображення обкладинки
 *     responses:
 *       200:
 *         description: Обкладинку завантажено
 *       400:
 *         description: Файл не передано або обкладинка вже існує
 *       401:
 *         description: Неавторизований користувач
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Фільм не знайдено
 *       500:
 *         description: Помилка сервера
 */

router.post('/upload/movie-cover/:id', upload.single('cover'), async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Тільки адміністратор може завантажувати обкладинки' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Файл не завантажено' });
    }

    const { rows } = await db.query('SELECT cover_url FROM movies WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Фільм не знайдено' });
    if (rows[0].cover_url) {
      return res.status(400).json({ error: 'Обкладинка вже існує, використайте PUT для заміни' });
    }

    const fileName = `covers/${Date.now()}_${req.file.originalname}`;
    const fileUrl = await uploadFileToR2(req.file.buffer, fileName, req.file.mimetype);

    await db.query('UPDATE movies SET cover_url = $1 WHERE id = $2', [fileUrl, id]);

    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error('Upload movie cover error:', err);
    res.status(500).json({ error: 'Помилка при завантаженні обкладинки' });
  }
});

/**
 * @openapi
 * /api/v1/upload/movie-cover/{id}:
 *   put:
 *     summary: Замінити обкладинку фільму
 *     description: |
 *       Адміністратор може замінити існуючу обкладинку. Стара обкладинка видаляється з R2.
 *     tags:
 *       - Upload
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover:
 *                 type: string
 *                 format: binary
 *                 description: Новий файл зображення
 *     responses:
 *       200:
 *         description: Обкладинку замінено
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Фільм не знайдено
 */

router.put('/upload/movie-cover/:id', upload.single('cover'), async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Тільки адміністратор може замінювати обкладинку' });
    }

    if (!req.file) return res.status(400).json({ error: 'Файл не завантажено' });

    const { rows } = await db.query('SELECT cover_url FROM movies WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Фільм не знайдено' });

    const oldUrl = rows[0].cover_url;
    if (oldUrl) {
      try {
        const oldFileKey = oldUrl.split(/\.r2\.(?:cloudflarestorage|dev)\//)[1];
        await deleteFileFromR2(oldFileKey);
      } catch (err) {
        console.warn('Не вдалося видалити стару обкладинку:', err.message);
      }
    }

    const fileName = `covers/${Date.now()}_${req.file.originalname}`;
    const fileUrl = await uploadFileToR2(req.file.buffer, fileName, req.file.mimetype);

    await db.query('UPDATE movies SET cover_url = $1 WHERE id = $2', [fileUrl, id]);

    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error('Replace movie cover error:', err);
    res.status(500).json({ error: 'Помилка при заміні обкладинки' });
  }
});

/**
 * @openapi
 * /api/v1/upload/movie-cover/{id}:
 *   delete:
 *     summary: Видалити обкладинку фільму
 *     description: |
 *       Тільки адміністратор може видаляти обкладинки фільмів.
 *     tags:
 *       - Upload
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
 *         description: Обкладинку видалено
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Фільм або обкладинку не знайдено
 */

router.delete('/upload/movie-cover/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Тільки адміністратор може видаляти обкладинки' });
    }

    const { rows } = await db.query('SELECT cover_url FROM movies WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Фільм не знайдено' });

    const oldUrl = rows[0].cover_url;
    if (!oldUrl) return res.status(400).json({ error: 'У фільму немає обкладинки' });

    const oldFileKey = oldUrl.split(/\.r2\.(?:cloudflarestorage|dev)\//)[1];
    await deleteFileFromR2(oldFileKey);

    await db.query('UPDATE movies SET cover_url = NULL WHERE id = $1', [id]);

    res.json({ success: true, message: 'Обкладинку видалено' });
  } catch (err) {
    console.error('Delete movie cover error:', err);
    res.status(500).json({ error: 'Помилка при видаленні обкладинки' });
  }
});

/**
 * @openapi
 * /api/v1/upload/person-avatar/{id}:
 *   post:
 *     summary: Завантажити аватарку людини
 *     description: |
 *       Дозволено лише адміністратору. Приймає зображення та завантажує до Cloudflare R2.
 *       Якщо у людини вже є аватарка, повторне завантаження заборонено.
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID людини
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Файл аватарки
 *     responses:
 *       200:
 *         description: Аватарку завантажено
 *       400:
 *         description: Файл не передано або аватарка вже існує
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Людину не знайдено
 *       500:
 *         description: Помилка сервера
 */
router.post('/upload/person-avatar/:id', upload.single('avatar'), async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Тільки адміністратор може завантажувати аватарку' });
    if (!req.file) return res.status(400).json({ error: 'Файл не завантажено' });

    const { rows } = await db.query('SELECT avatar_url FROM people WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Людину не знайдено' });
    if (rows[0].avatar_url) return res.status(400).json({ error: 'Аватарка вже існує, використайте PUT для заміни' });

    const fileName = `avatars/${Date.now()}_${req.file.originalname}`;
    const fileUrl = await uploadFileToR2(req.file.buffer, fileName, req.file.mimetype);

    await db.query('UPDATE people SET avatar_url = $1 WHERE id = $2', [fileUrl, id]);
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error('Upload person avatar error:', err);
    res.status(500).json({ error: 'Помилка при завантаженні аватарки' });
  }
});

/**
 * @openapi
 * /api/v1/upload/person-avatar/{id}:
 *   put:
 *     summary: Замінити аватарку людини
 *     description: |
 *       Адміністратор може замінити існуючу аватарку. Стара аватарка видаляється з R2.
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID людини
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Новий файл аватарки
 *     responses:
 *       200:
 *         description: Аватарку замінено
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Людину не знайдено
 */
router.put('/upload/person-avatar/:id', upload.single('avatar'), async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Тільки адміністратор може замінювати аватарку' });
    if (!req.file) return res.status(400).json({ error: 'Файл не завантажено' });

    const { rows } = await db.query('SELECT avatar_url FROM people WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Людину не знайдено' });

    const oldUrl = rows[0].avatar_url;
    if (oldUrl) {
      try {
        const oldFileKey = oldUrl.split(/\.r2\.(?:cloudflarestorage|dev)\//)[1];
        await deleteFileFromR2(oldFileKey);
      } catch (err) {
        console.warn('Не вдалося видалити стару аватарку:', err.message);
      }
    }

    const fileName = `avatars/${Date.now()}_${req.file.originalname}`;
    const fileUrl = await uploadFileToR2(req.file.buffer, fileName, req.file.mimetype);

    await db.query('UPDATE people SET avatar_url = $1 WHERE id = $2', [fileUrl, id]);
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error('Replace person avatar error:', err);
    res.status(500).json({ error: 'Помилка при заміні аватарки' });
  }
});

/**
 * @openapi
 * /api/v1/upload/person-avatar/{id}:
 *   delete:
 *     summary: Видалити аватарку людини
 *     description: |
 *       Тільки адміністратор може видаляти аватарки людей.
 *     tags:
 *       - Upload
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
 *         description: Аватарку видалено
 *       403:
 *         description: Недостатньо прав
 *       404:
 *         description: Людину або аватарку не знайдено
 */
router.delete('/upload/person-avatar/:id', async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Тільки адміністратор може видаляти аватарку' });

    const { rows } = await db.query('SELECT avatar_url FROM people WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Людину не знайдено' });

    const oldUrl = rows[0].avatar_url;
    if (!oldUrl) return res.status(400).json({ error: 'Аватарки немає' });

    const oldFileKey = oldUrl.split(/\.r2\.(?:cloudflarestorage|dev)\//)[1];
    await deleteFileFromR2(oldFileKey);

    await db.query('UPDATE people SET avatar_url = NULL WHERE id = $1', [id]);
    res.json({ success: true, message: 'Аватарку видалено' });
  } catch (err) {
    console.error('Delete person avatar error:', err);
    res.status(500).json({ error: 'Помилка при видаленні аватарки' });
  }
});

module.exports = router;
