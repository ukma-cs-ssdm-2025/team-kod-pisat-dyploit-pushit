# Журнал Налагодження: Неправильна валідація Username

## Симптом

Система дозволяє знаходити користувачів за `id` або `username`. Бізнес-логіка вимагає, щоб `username` завжди починався з префіксу `@`.

Під час тестування було виявлено, що:
1.  Створення користувача (`POST /api/v1/users`) працювало коректно. Якщо `username` надходив без `@`, сервіс додавав його автоматично.
2.  Оновлення користувача (`PUT /api/v1/users/:param`) дозволяло змінити `username` на будь-яке значення, включаючи те, що *не* починається з `@` (наприклад, `"username": "testuser"`).
3.  Після такого оновлення, користувач ставав недоступним для пошуку за `username` (`GET /api/v1/users/testuser` або `GET /api/v1/users/@testuser`), оскільки логіка пошуку очікувала знайти в базі даних `username` з префіксом `@`.

## Корінна причина (Root Cause)

Логіка валідації та форматування `username` (додавання префіксу `@`) була реалізована лише в обробнику `POST /users`.

Обробник `PUT /users/:param` приймав нове значення `username` з тіла запиту (`req.body`) і напряму передавав його в `UPDATE` запит до бази даних, оминаючи обов'язкове форматування. Це призводило до неконсистенції даних у базі.

## Виправлення

До обробника `PUT /api/v1/users/:param` було додано таку саму логіку перевірки та форматування `username`, яка вже існувала в `POST` ендпоінті.

Перед виконанням запиту `UPDATE` до бази даних, ми перевіряємо, чи `username` був наданий у тілі запиту, і якщо так, чи починається він з `@`. Якщо ні, префікс `@` додається примусово.

Фрагмент коду (виправлення в `router.put`):

```javascript
router.put('/users/:param', async (req, res) => {
  const db = req.app.locals.db;
  const { param } = req.params;
  // Змінено 'const' на 'let', щоб дозволити модифікацію
  let { username, role, nickname, password, email } = req.body;

  let target;
  if (/^\d+$/.test(param)) {
    target = { column: 'id', value: param };
  } else {
    const uname = param.startsWith('@') ? param : `@${param}`;
    target = { column: 'username', value: uname };
  }

  // --- ПОЧАТОК ВИПРАВЛЕННЯ ---
  // Та сама логіку форматування, що і в POST
  if (username && !username.startsWith('@')) {
    username = `@${username}`;
  }
  // --- КІНЕЦЬ ВИПРАВЛЕННЯ ---

  try {
    const result = await db.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           role = COALESCE($2, role),
           nickname = COALESCE($3, nickname),
           password = COALESCE($4, password),
           email = COALESCE($5, email)
       WHERE ${target.column} = $6
       RETURNING *`,
      [username, role, nickname, password, email, target.value]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    res.json({ message: 'Користувача оновлено', user: result.rows[0] });
  } catch (err) {
    console.error('DB error (PUT /users/:param):', err);
    res.status(500).json({ error: 'Database error' });
  }
});
```
## Урок

Критично важливо застосовувати однакові правила валідації та форматування даних (бізнес-логіку) до всіх ендпоінтів, які можуть модифікувати ці дані. Логіка валідації для поля має бути ідентичною як при створенні (POST), так і при оновленні (PUT/PATCH), щоб запобігти неконсистентності даних.