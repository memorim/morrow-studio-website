# Morrow Studio - сайт цифровой студии

Адаптивный сайт студии: проекты, фильтры, услуги, навигация и контактная форма.

[Открыть проект](https://memorim.github.io/morrow-studio-website/)

![Компьютерная версия](docs/desktop.png)

<img src="docs/mobile.png" width="320" alt="Мобильная версия">

## Устройство проекта

HTML, CSS и JavaScript без сборщика. Express обслуживает сайт и принимает обращения. PostgreSQL хранит заявки. Выбранную категорию проектов можно открыть по ссылке, обновить и вернуться к ней кнопкой «Назад».

## Локальный запуск и проверки

Node.js 24.18 и PostgreSQL. Укажите строку подключения в переменной окружения `DATABASE_URL`.

```bash
node --check script.js
python tests/check_assets.py
python .github/scripts/check_docs.py
pnpm install --frozen-lockfile
node server.js
```

Откройте `http://localhost:4832`. При запуске сервер применяет [миграцию](migrations/001_inquiries.sql). Карточки открывают краткое описание в диалоге.

Для браузерных проверок нужны Node.js 24.18.0 и pnpm 11.7.0:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps --only-shell chromium
pnpm test:e2e
```

CI запускает сайт с отдельной тестовой PostgreSQL. На компьютере, планшете и телефоне проверяются отправка заявки, повтор запроса, валидация, фильтры и навигация.

## Обработка заявок

`POST /api/inquiries` сохраняет имя, рабочую почту и описание проекта. После подтверждения записи форма показывает результат. При ошибке текст остаётся в полях, повтор с тем же ключом сохраняет одну заявку.

Владелец просматривает заявки в закрытой таблице `morrow_inquiries` своего проекта PostgreSQL. Уведомления по почте не настроены.

[Технические сведения](docs/TECHNICAL.md) · [Выполненные проверки](docs/VERIFICATION.md) · [История изменений](CHANGELOG.md)
