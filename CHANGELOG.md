# Changelog

## [Unreleased]

## [v1.1.0] – 2025-01-15
### Refactoring
- Виконано рефакторинг відповідно до рекомендацій SonarCloud.
- Замінено `.forEach()` на `for…of` у відповідних модулях.
- Замінено `window` на `globalThis` для покращення кросплатформенності.
- Використано `Number.parseInt` замість глобального `parseInt`.

