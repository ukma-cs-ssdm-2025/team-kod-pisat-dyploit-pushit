**Основна інформація**

* **Назва команди:** kod-pisat-dyploit-pushit
* **Учасники:**

  * Олександр — GitHub: `@FeadenGlow`, електронна пошта НаУКМА: `os.muzyka@ukma.edu.ua`
  * Остап — GitHub: `@OstapGladun`, електронна пошта НаУКМА: `o.hladun@ukma.edu.ua`
  * Тетяна — GitHub: `@tetianashapoval`, електронна пошта НаУКМА: `t.shapoval@ukma.edu.ua`
  * Катерина — GitHub: `@Kate-Samsonenko`, електронна пошта НаУКМА: `k.samsonenko@ukma.edu.ua`


**Артефакти вимог**

  [NFR](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/blob/main/docs/requirements/requirements.md)
  [Користувацькі історії](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/blob/main/docs/requirements/user-stories.md)
  [Матриця простежуваності](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/blob/main/docs/requirements/rtm.md)
  [Архітектура](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/blob/main/docs/architecture)


  [![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=20575885)
  [![CI Test](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/actions/workflows/ci.yml)
  [![Deploy API Docs](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/actions/workflows/pages/pages-build-deployment/badge.svg?branch=main)](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/actions/workflows/pages/pages-build-deployment/)


Документація

Студентський проєкт, що реалізує платформу для перегляду та публікації рецензій на фільми.
Система включає три ролі: Користувач, Модератор, Адміністратор.
Користувачі можуть:
створювати профіль та авторизуватися;
писати та редагувати рецензії;
переглядати рецензії інших користувачів;
оцінювати фільми;
отримувати персональні рекомендації на основі своїх оцінок.
Модератори та адміністратори додатково мають можливість керувати контентом та користувачами.

Стрктура репозиторію

.
├── Project-Description.md
├── TeamCharter.md
├── README.md                # основна документація
├── docs/                    # документування проєкту
│   ├── api/
│   ├── architecture/
│   ├── code-quality/
│   ├── requirements/
│   ├── testing/
│   └── validations/
└── src/
    ├── api/                 # backend (Node.js + Express + PostgreSQL)
    │   ├── server.js
    │   ├── db.js
    │   ├── init.sql
    │   ├── routes/
    │   ├── middleware/
    │   ├── utils/
    │   ├── tests/
    │   ├── swagger-config.js
    │   └── coverage/
    └── frontend/            # frontend (React + Vite)
        ├── src/
        ├── public/
        ├── vite.config.js
        └── README.md


Технологічний стек

Backend (src/api)
Node.js (CommonJS)
Express
PostgreSQL (pg)
JWT (jsonwebtoken)
bcrypt
Multer
AWS S3 SDK
Swagger (OpenAPI)
Jest + Supertest
ESLint
Frontend (src/frontend)
React + Vite
SPA
Сторінки: Login, Register, Dashboard

НАлаштування бекенду

Перейти в папку API:
cd src/api
1. Встановлення залежностей
npm install
2. Файл змінних середовища (.env)
Створи файл .env у src/api:
PORT=3000

# PostgreSQL
PGHOST=localhost
PGPORT=5432
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=your_database

# JWT
JWT_SECRET=your_jwt_secret_here

# S3 (опціонально)
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
S3_REGION=...

3. Ініціалізація бази даних
psql -U your_user -d your_database -f init.sql

4. Запуск API
npm start

API запуститься на http://localhost:<PORT>.


API: Огляд ендпоінтів
Усі маршрути розташовані у src/api/routes.

AUTH (auth.js)
POST /auth/register — реєстрація
POST /auth/login — вхід
GET /auth/me — отримання власного профілю

USERS (users.js)
GET /users — список користувачів (модератор/адмін)
GET /users/:id — профіль користувача
PATCH /users/:id — оновлення профілю
DELETE /users/:id — блокування/видалення користувача

MOVIES (movies.js)
GET /movies — список фільмів
GET /movies/:id — деталі фільму
POST /movies — додавання фільму (адмін)
PATCH /movies/:id
DELETE /movies/:id

REVIEWS (reviews.js)
GET /movies/:id/reviews — рецензії фільму
POST /movies/:id/reviews — створення рецензії
PATCH /reviews/:id — редагування своєї рецензії
DELETE /reviews/:id — видалення (користувач/модератор/адмін)

RATINGS (movies.js або окремо)
POST /movies/:id/rating — поставити оцінку
GET /users/:id/recommendations — отримати рекомендації

UPLOADS (upload.js)
POST /upload/avatar — завантажити аватар
POST /upload/poster — завантажити постер фільму

Авторизація та ролі
Авторизація здійснюється через JWT.
У запитах, де потрібен токен, використовується заголовок:
Authorization: Bearer <token>
Ролі:
USER — базові можливості (рецензії, профіль, оцінки)
MODERATOR — модерація рецензій та користувачів
ADMIN — повний доступ
Перевірка токена та ролей:
src/api/middleware/authMiddleware.js.

Тестування

Перейти в директорію API:
cd src/api
Запуск тестів
npm test
Перегляд покриття тестами
npm test -- --coverage
Результати доступні у:
src/api/coverage/lcov-report/index.html
У наявності такі тести:
db.test.js
users.test.js
validateEmail.test.js
validateUsername.test.js
password-validator.test.js
isValidRating.test.js

Налаштування Frontend

cd src/frontend
npm install
npm run dev
Застосунок стартує на:
http://localhost:5173


