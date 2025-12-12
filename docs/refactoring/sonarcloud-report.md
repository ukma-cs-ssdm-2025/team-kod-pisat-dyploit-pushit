# SonarCloud Report

## Загальний звіт

Аналіз коду виконано через **SonarCloud CI**. Основні метрики проекту:

| Метрика                     | Значення            |
|-------------------------------|------------------|
| **Code Smells**              | 3                |
| **Maintainability Rating**   | Low                |
| **Technical Debt (h)**       | 1.5              |
| **Duplicated Lines (%)**     | 0.8              |
| **Reliability Rating**       | Medium                |

## Обрані проблеми

### 1. `for…of` замість `.forEach(…)`
- **Тип:** Code Smell
- **Локація:** різні файли, де використовується `.forEach()`
- **Опис:** Використання `for…of` більш ефективне, особливо при асинхронних операціях, оскільки `.forEach()` не працює з `await`.
- **Рекомендація:** Замінити `.forEach()` на `for…of`.

### 2. `globalThis` замість `window`
- **Тип:** Code Smell
- **Локація:** файли, де глобальний об’єкт визначається через `window`
- **Опис:** `window` доступний тільки у браузерному середовищі, а `globalThis` універсальний для Node.js та браузера.
- **Рекомендація:** Замінити `window` на `globalThis` для кросплатформенності.

### 3. `Number.parseInt` замість `parseInt`
- **Тип:** Code Smell
- **Локація:** файли з викликом `parseInt`
- **Опис:** Рекомендується використовувати `Number.parseInt` замість глобального `parseInt`, щоб уникнути проблем із shadowing та підвищити читабельність.
- **Рекомендація:** Замінити всі виклики `parseInt` на `Number.parseInt`.

### 4. Прибрати використання оператора void в обробнику кліку
- **Тип:** Code Smell
- **Локація:** src/frontend/src/pages/PeopleList.jsx, обробник onClick для зображення попкорну (рядок ~457)
- **Опис:** Для перезапуску CSS-анімації використовувався вираз
- 
void e.target.offsetWidth;

Оператор void повертає undefined і майже не використовується в сучасному JavaScript. Через це код виглядає незрозуміло, ускладнює підтримку і порушує правило SonarCloud "Remove this use of the 'void' operator" (javascript:S3735).

- **Рекомендація:** Прибрати використання void і замінити його на більш прозорий спосіб форсувати перерахунок стилів. Наприклад:

// до
e.target.classList.remove('active');
void e.target.offsetWidth;   
e.target.classList.add('active');

// після
e.target.classList.remove('active');
e.target.offsetWidth;        
e.target.classList.add('active');


Або альтернативно – використовувати requestAnimationFrame / стан компонента для перезапуску анімації.


## Скриншоти з SonarCloud (до/після)

> Примітка: Скриншотів "до" немає, оскільки аналіз SonarCloud був виконаний раніше і дані не збереглися.  
> Нижче наведено лише скриншоти стану після рефакторингу та виправлення обраних Code Smells.

### Після рефакторингу
![SonarCloud after refactoring](https://pub-ce8d628c5b474cf792adf6cd6a5a3c5e.r2.dev/avatars/1764196918958_1.png)
![SonarCloud after refactoring](https://pub-ce8d628c5b474cf792adf6cd6a5a3c5e.r2.dev/avatars/1764197033599_2.png)
![SonarCloud after refactoring](https://pub-ce8d628c5b474cf792adf6cd6a5a3c5e.r2.dev/avatars/1764197132580_3.png)

### для 4
скріншот до:
<img width="878" height="431" alt="image" src="https://github.com/user-attachments/assets/c040b61b-9fa3-43dd-a485-83cab88c9ac0" />
скріншот після:
- не підтягнувся в сонар, але
<img width="1882" height="752" alt="image" src="https://github.com/user-attachments/assets/fe8a23cc-edfe-4b67-a6e6-55e354d418a2" />
показує, що внесені зміни - успішні


