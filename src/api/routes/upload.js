const express = require('express');
const multer = require('multer');
const { uploadFileToR2 } = require('../utils/r2');

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

module.exports = router;
