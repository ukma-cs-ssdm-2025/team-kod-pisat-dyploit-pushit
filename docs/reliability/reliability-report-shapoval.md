Reliability Report – Auth Module (auth.js)

Виконавець – Шаповал Тетяна

Overview
У цьому звіті наведено сім виявлених дефектів у модулі авторизації auth.js, а також рішення, що покращують надійність, відмовостійкість, безпеку та передбачуваність поведінки сервісу.

1. Відсутність перевірки типів вхідних полів
Fault: Код використовує username.startsWith(...) та інші string-методи без перевірки, що значення дійсно є рядком.
const formattedUsername = username.startsWith('@') ? username : `@${username}`;

Error: Якщо username = {} або password = 123 → викликається TypeError: username.startsWith is not a function.
Failure: API повертає 500 Internal Server Error або хендлер падає повністю.
Severity: High
Fix: Додано перевірку типів та нормалізацію:

До
const { username, password, email, nickname } = req.body;

Після
if (
  typeof username !== 'string' ||
  typeof password !== 'string' ||
  typeof email !== 'string' ||
  typeof nickname !== 'string'
) {
  return res.status(400).json({ message: 'Невірний формат полів' });
}

const cleanUsername = username.trim();
const cleanEmail = email.trim().toLowerCase();
const cleanNickname = nickname.trim();



2. Відсутність нормалізації вхідних полів → можливі дублікати
Fault: username, email беруться як є — без trim() та lowercase().
Error: Користувач "user " та "user" вважаються різними.
Email "User@Example.com" зберігається в іншому регістрі.

Failure: Дублікати в БД
Користувач не може увійти без точного повторення пробілу
Severity: Medium

Fix: 
До


const formattedUsername = username.startsWith('@') ? username : `@${username}`;


Після
const rawUsername = cleanUsername.startsWith('@') ? cleanUsername : `@${cleanUsername}`;
const exists = await db.query(
  'SELECT * FROM users WHERE username = $1 OR email = $2',
  [rawUsername, cleanEmail]
);


3. Race condition при реєстрації (INSERT без гарантій)
Fault: Перевірка існування — окремо від вставки. Два паралельних запити можуть вставити один і той самий email.
Error: PostgreSQL кидає duplicate key error (23505).
Failure: Клієнт отримує 500 Database error замість 409 Conflict.
Або реєстрація проходить нестабільно.

Severity: High
Fix:
До

} catch (err) {
  res.status(500).json({ error: 'Database error' });
}

Після

} catch (err) {
  if (err.code === '23505') {
    return res.status(409).json({
      message: 'Користувач з таким username або email вже існує'
    });
  }
  return res.status(500).json({ error: 'Internal server error' });
}


4. Некоректні повідомлення логів («DB error» для всіх випадків)
Fault: У catch ми завжди пишемо:
console.error('DB error (POST /login):', err);
Error: Якщо впаде jwt.sign() — ми помилково маркуємо це як DB-помилку.

Failure:Ускладнена діагностика — команда шукає проблему в БД, хоча вона в іншому місці.
Severity: Medium
Fix:

console.error('Error in POST /login:', err);
return res.status(500).json({ error: 'Internal server error' });


5. Небезпечний fallback для JWT_SECRET
Fault: const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
Error: Сервер запускається з слабким ключем, якщо забули задати env-змінну.

Failure:
Компрометація токенів
Неможливість валідувати чужі токени між сервісами

Severity: High
Fix:
До

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

Після

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;


6. Відсутність обмежень розміру полів
Fault: Користувач може надіслати пароль у 1 МБ → bcrypt зависне.
Error: Сервер витрачає великий час на хешування або memory spike.
Failure: Затримки, можливість DoS-атаки.
Severity: Medium–High

Fix:

if (
  cleanUsername.length > 50 ||
  cleanNickname.length > 50 ||
  cleanEmail.length > 254 ||
  password.length > 200
) {
  return res.status(400).json({ message: 'Занадто довгі вхідні дані' });
}


7. Відсутність rate limiting на /login → брутфорс
Fault: Логін можна викликати нескінченну кількість разів без обмежень.

Error: Високе навантаження на БД + масове перебору password-hash.
Failure: Спад продуктивності
Втрата доступності сервера

Severity: High
Fix

const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
});

router.post('/login', loginLimiter, async (req, res) => {


    
Висновок
Після внесених змін модуль авторизації отримав такі покращення:
Безпека: захист від брутфорсу, неможливість запуску з weak JWT secret.
Достовірність даних: усунення race condition, нормалізація полів.
Відмовостійкість: жоден некоректний payload більше не валить API.
Краще логування: чітке розділення помилок.