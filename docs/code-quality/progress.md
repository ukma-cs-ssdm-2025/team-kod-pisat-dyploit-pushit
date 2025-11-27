# Прогрес реалізації API (User Management)

## Поточний стан
**Дата:** 28.10.2025  
**Відповідальний:** Олександр Музика, Остап Гладун 

### Реалізовано:
- [x] Ініціалізовано Express API-сервер (`src/api/server.js`)
- [x] Підключено PostgreSQL через `pg`
- [x] Створено таблицю `users` (поля: id, username, role, nickname, password, email)
- [x] Додано CRUD маршрути:
  - `GET /api/v1/users` — отримати всіх користувачів  
  - `GET /api/v1/users/:param` — отримати користувача за `id` або `@username`  
  - `POST /api/v1/users` — створити нового користувача  
  - `PUT /api/v1/users/:param` — оновити користувача за `id` або `@username`  
  - `DELETE /api/v1/users/:param` — видалити користувача  
- [x] Валідація `username`: якщо вказано без "@", додається автоматично
- [x] Swagger-документація (`/api-docs` та `/openapi.yaml`)

### У процесі:
- [ ] Додавання ролей доступу (middleware auth)