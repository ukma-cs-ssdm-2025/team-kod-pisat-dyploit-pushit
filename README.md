**Основна інформація**

* **Назва команди:** kod-pisat-dyploit-pushit
* **Учасники:**

  * Олександр — GitHub: `@FeadenGlow`, електронна пошта НаУКМА: `os.muzyka@ukma.edu.ua`
  * Остап — GitHub: `@OstapGladun`, електронна пошта НаУКМА: `o.hladun@ukma.edu.ua`
  * Тетяна — GitHub: `@tetianashapoval`, електронна пошта НаУКМА: `t.shapoval@ukma.edu.ua`
  * Катерина — GitHub: `@Kate-Samsonenko`, електронна пошта НаУКМА: `k.samsonenko@ukma.edu.ua`

**Інструкція запуску**

1. Клонувати репозиторій.
2. Через термінал в директорії `/src/api` прописати команду:

   ```bash
   docker-compose up --build
   ```

   (для запуску бази даних)
3. Перейти в директорію `/src/frontend` та встановити залежності:

   ```bash
   npm install
   ```
4. Запустити фронтенд:

   ```bash
   npm run dev
   ```
5. Вставити в браузер отримане посилання `http://localhost:5173/`.

**Артефакти вимог**

  [NFR](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/blob/main/docs/requirements/requirements.md)
  [Користувацькі історії](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/blob/main/docs/requirements/user-stories.md)
  [Матриця простежуваності](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/blob/main/docs/requirements/rtm.md)
  [Архітектура](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/blob/main/docs/architecture)


  [![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=20575885)
  [![CI Test](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/actions/workflows/ci.yml)
  [![Deploy API Docs](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/actions/workflows/pages/pages-build-deployment/badge.svg?branch=main)](https://github.com/ukma-cs-ssdm-2025/team-kod-pisat-dyploit-pushit/actions/workflows/pages/pages-build-deployment/)
