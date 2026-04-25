import asyncio
from aiohttp import web
from aiogram import Bot, Dispatcher
from backend.config import TOKEN
from backend.handlers import router
from backend.database import init_db
from backend.api import setup_routes

async def run_bot():
    bot = Bot(token=TOKEN)
    dp = Dispatcher()
    dp.include_router(router)
    await init_db()
    print("🤖 Бот запущен и слушает сообщения")
    await dp.start_polling(bot)

async def run_api():
    app = web.Application()
    setup_routes(app)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host='0.0.0.0', port=8080)
    await site.start()
    print("🌐 API сервер запущен на порту 8080")

    while True:
        await asyncio.sleep(3600)

async def main():
    await asyncio.gather(run_bot(), run_api())

if __name__ == '__main__':
    asyncio.run(main())