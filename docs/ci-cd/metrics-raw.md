# CI/CD Metrics Raw Data

**Період аналізу:** 1–26 листопада  
**CI-система:** (вкажи свою, напр. GitHub Actions)  
**Основна гілка:** `main` (або своя)  

## Останні запускі CI/CD (raw data)

> Нижче – дані з останніх запусків пайплайна, які були використані для розрахунку DORA-метрик.

| Run # | Commit SHA | Status   | Тривалість (start → end) | Deployed? | Notes                             |
|:-----:|-----------:|----------|--------------------------|:---------:|-----------------------------------|
| 236   | 5641046    |  Success | ~7 s                     |    Yes    | Reliability report added          |
| 235   | 76f1b25    |  Success | ~9 s                     |    Yes    | fixing deployment issues          |
| 234   | f06cd0b    |  Success | ~10 s                    |    Yes    | fixing deployment issues          |
| 233   | 78dfc57    |  Success | ~9 s                     |    Yes    | fixing deployment issues          |
| 232   | 37979c4    |  Success | ~9 s                     |    Yes    | fixing deployment issues          |
| 231   | 95f6ba2    |  Success | ~20 s                    |    Yes    | Scavenger hunt fixed...           |
| 230   | acc0080    |  Success | ~12 s                    |    Yes    | fixing deployment issues          |
| 229   | 957042f    |  Success | ~7 s                     |    Yes    | fixing deployment startup         |

> Усі наведені вище ран-и завершилися успішно з точки зору CI (зелений статус), але назви комітів
> `fixing deployment issues` натякають, що попередні версії деплоювались з проблемами, які
> виправлялись послідовно декількома комітами.
