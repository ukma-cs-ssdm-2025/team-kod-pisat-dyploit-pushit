1. 

проблема:

* якщо зробити іншу роль (не юзер, не модератор і не адмін), вона зможе змінювати, видаляти акаунти (потенційно й рецензії)

* error; high severity


частина коду:

router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
  const { username, password, email, nickname, role } = req.body;

  if (!username || !password || !email || !nickname || !role) {
    return res.status(400).json({ message: 'Будь ласка, заповніть усі поля' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Некоректний формат email' });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ 
      message: 'Пароль не відповідає вимогам безпеки (мінімум 8 символів, 1 цифра, 1 спецсимвол: !@#$%^&*)' 
    });
  }

  const formattedUsername = username.startsWith('@') ? username : `@${username}`;

  try {
    const exists = await db.query('SELECT * FROM users WHERE username = $1 OR email = $2', [formattedUsername, email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'Користувач з таким username або email вже існує' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await db.query(
      `INSERT INTO users (username, password, email, nickname, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, nickname, role`,
      [formattedUsername, hashedPassword, email, nickname, role]
    );

    res.status(201).json({
      message: 'Реєстрація успішна',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('DB error (POST /register):', err);
    res.status(500).json({ error: 'Database error' });
  }
});


  чому вона небезпечна:

  * такий користувач може видалити будь-який акаунт 


як можна виправити:

* додати в регістер перевірку ролей (якщо не адмін/модератор/юзер - видавати помилку)



  2.

  проблема:

  * відсутність таймаутів

  * error; medium severity

  частина коду:

  router.post('/login', async (req, res) => {
  const db = req.app.locals.db;
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Вкажіть username і пароль' });
  }

  const formattedUsername = username.startsWith('@') ? username : `@${username}`;

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [formattedUsername]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Невірний логін або пароль' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Невірний логін або пароль' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Авторизація успішна',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nickname: user.nickname,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('DB error (POST /login):', err);
    res.status(500).json({ error: 'Database error' });
  }
});

чому небезпечно:

* є можливість робити нескінченну кількість запитів і ти самим викликати зависання бази даних
