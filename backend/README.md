# Quadrant Backend

FastAPI + PostgreSQL сервисная архитектура для мобильного приложения Quadrant.

## Стек
- FastAPI / Uvicorn
- PostgreSQL (asyncpg + SQLAlchemy 2.x)
- Alembic миграции
- Celery + Redis для фоновых задач (Strava/Notion sync, уведомления)
- Pydantic Settings для конфигурации

## Запуск (локально)
```bash
poetry install
poetry run uvicorn app.main:app --reload
```

Перед запуском заполните `.env` (см. `app/core/config.py`) или переменные окружения:
- `DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/quadrant`
- `REDIS_URL=redis://localhost:6379/0`
- `JWT_SECRET=...`
- `TELEGRAM_BOT_TOKEN=...`

## Структура
```
app/
  api/          # Роутеры и зависимости
  core/         # Конфиг, логирование, безопасность, база
  models/       # SQLAlchemy модели
  repositories/ # CRUD-слой
  schemas/      # Pydantic DTO
  services/     # Бизнес-логика
  integrations/ # Strava, TonConnect, Notion
  tasks/        # Celery задачи
```

## Следующие шаги
1. Настроить Alembic и описать первичные модели (User, Course, Book и т.д.).
2. Реализовать Telegram OAuth-флоу и JWT-авторизацию.
3. Поднять docker-compose c Postgres и Redis.
4. Подключить Strava/Ton/Notion интеграции.
