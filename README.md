# Lashify — Telegram Mini App для записи к мастеру

Автоматическая запись клиентов с календарём, выбором времени, уведомлениями и админ-панелью (опционально).

## Возможности

- **Mini App внутри Telegram** – клиент выбирает услугу, дату и время без звонков и сообщений.
- **Умный календарь** – прошедшие дни блокируются автоматически.
- **Выбор времени** – фиксированные слоты или ручной ввод.
- **Уведомления мастеру** – при новой записи в Telegram приходит кнопка Подтвердить / Отклонить.
- **Статусы записей** – pending, confirmed, cancelled (хранятся в SQLite).
- **Админ-панель в Mini App** (опционально) – просмотр всех записей, подтверждение/отмена через API.
- **Современный дизайн** – стекло, градиенты, анимации, адаптив.

## Технологии

- Python 3.12+
- Aiogram 3 (Telegram Bot API)
- aiohttp (API для админ-панели)
- SQLite (база данных)
- HTML5 / CSS3 / Vanilla JS (Telegram WebApp)

## Быстрый старт

### Клонируйте репозиторий

```bash
git clone https://github.com/SlizenPyDev/telegram-mini-app-lashify
cd lashify-booking-bot
Установите зависимости
bash
pip install aiogram aiosqlite aiohttp
Настройте бота
Создайте файл backend/config.py (не публикуется в Git):

python
TOKEN = "ВАШ_ТОКЕН_ОТ_BOTFATHER"
BOT_TOKEN = TOKEN
ADMIN_ID = 123456789   # ваш Telegram ID
Запустите бота (только запись + уведомления)
bash
python main.py
Бот запустится в режиме polling. По команде /start приходит кнопка с Mini App.

Запустите Mini App локально
Откройте второй терминал:

bash
python -m http.server 8080
Теперь приложение доступно по адресу http://localhost:8080/index.html.
Для работы в Telegram нужен HTTPS-туннель, например, ngrok:

bash
ngrok http 8080
Скопируйте полученный HTTPS-адрес (например, https://abc123.ngrok-free.app) и укажите его в handlers.py в переменной base_url (или через os.environ['WEBAPP_URL']).

Структура проекта
text
.
├── backend/
│   ├── config.py         # настройки (токен, ADMIN_ID) – не публикуется
│   ├── database.py       # работа с SQLite
│   ├── handlers.py       # обработчики Telegram-бота
│   └── api.py            # эндпоинты для админ-панели (aiohttp)
├── index.html            # главная страница Mini App
├── style.css             # стили
├── script.js             # клиентская логика (календарь, выбор, отправка)
├── main.py               # точка входа (запуск бота и API)
└── README.md
Лицензия
MIT — свободное использование, модификация, распространение.
