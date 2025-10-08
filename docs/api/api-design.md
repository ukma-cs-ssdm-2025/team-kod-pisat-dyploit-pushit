# Movies & Users API Design Documentation

## Architecture Overview

* **Base URL**: `http://localhost:3000/api/v1`
* **API Style**: RESTful
* **Authentication**: JWT Bearer tokens (planned)
* **Response Format**: JSON
* **Versioning Strategy**: URL path versioning (`/v1`)

## Resource Model

### Users Resource

* **Endpoint**: `/users`
* **Description**: Управління користувачами системи
* **Attributes**:

  * `id` (integer): Унікальний ідентифікатор
  * `name` (string): Повне ім’я користувача
  * `email` (string): Електронна пошта
* **Relationships**:

  * Може мати багато відгуків (планується додати Reviews)

### Movies Resource

* **Endpoint**: `/movies`
* **Description**: Управління фільмами
* **Attributes**:

  * `id` (integer): Унікальний ідентифікатор
  * `title` (string): Назва фільму
  * `year` (integer): Рік виходу
* **Relationships**:

  * Може мати багато відгуків (планується додати Reviews)

## Design Decisions

### Підхід до розробки (Code-First)

* Всі ендпоїнти описуються безпосередньо у коді через JSDoc-коментарі.
* Це дозволяє швидко додавати нові маршрути та автоматично оновлювати документацію.
* API завжди залишається синхронізованим із реалізацією без ручного редагування OpenAPI YAML.

### Обробка помилок

* API повертає уніфіковану структуру помилки: код, повідомлення, деталі (для валідації полів).
* HTTP статуси відповідають типу помилки (400 для некоректних даних, 404 для неіснуючих ресурсів, 500 для серверних помилок).
* Дозволяє фронтенду легко обробляти помилки і відображати користувачам зрозумілі повідомлення.

