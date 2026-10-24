# Morrow Studio — сайт digital-студии

Адаптивный сайт digital-студии с портфолио, описанием услуг и формой обращения.

**Проект:** Самостоятельная разработка.

![CI](https://github.com/memorim/morrow-studio-website/actions/workflows/ci.yml/badge.svg)

[Открыть сайт-демонстрацию](https://memorim.github.io/morrow-studio-website/)

![Компьютерная версия](docs/desktop.png)

<img src="docs/mobile.png" width="320" alt="Мобильная версия">

[Короткая демонстрация сценария](docs/demo.gif)

## Что работает
- Адаптивная сетка, CSS-композиции кейсов и фильтр проектов.
- Состояния наведения, плавная навигация и клиентская форма.

## Стек
HTML, CSS, JavaScript.

## Запуск и проверка
Python 3.12.14 для локального HTTP-сервера; сборка не нужна.

```bash
node --check script.js
python tests/check_assets.py
python -m http.server 8080
```

## Технические решения
- Сайт работает без сборки и UI-фреймворка.
- Форма проверяет обязательные поля и показывает результат локальной проверки.

## Подробности
[API, конфигурация и исходные инструкции](docs/TECHNICAL.md).

[Результаты проверки этой версии](docs/VERIFICATION.md).

## Проверки и обновления
CI проверяет проект и ссылки на локальные материалы. Dependabot предлагает обновления зависимостей и Actions. [История изменений](CHANGELOG.md).
