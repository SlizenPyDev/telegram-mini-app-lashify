import os
import json
from aiogram import Router, types, F
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo, ReplyKeyboardMarkup, KeyboardButton
from backend.database import add_booking
from backend.config import ADMIN_ID

router = Router()

@router.message(CommandStart())
async def start_cmd(message: types.Message):
    base_url = os.environ.get('WEBAPP_URL', 'https://ваш-адрес.ngrok-free.app')
    url = f"{base_url}?v={os.urandom(4).hex()}" 
    
    kb = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="💅 Записаться", web_app=WebAppInfo(url=url))]
        ],
        resize_keyboard=True
    )
    
    await message.answer(
        f"Привет, {message.from_user.first_name}! 👋\n"
        "Нажми на кнопку ниже, чтобы выбрать услугу и время.",
        reply_markup=kb
    )

@router.message(F.web_app_data)
async def web_app_data_handler(message: types.Message):
    print("🎯 СОБЫТИЕ: Бот получил данные от Mini App")
    try:
        raw_data = message.web_app_data.data
        data = json.loads(raw_data)
        user_id = message.from_user.id
        user_name = message.from_user.full_name
        service = data.get('service', 'Не указана')
        booking_date = f"{data.get('date', '---')} в {data.get('time', '---')}"

        import aiosqlite
        from backend.database import DB_PATH
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute(
                "INSERT INTO bookings (user_id, user_name, service_name, booking_date) VALUES (?, ?, ?, ?)",
                (user_id, user_name, service, booking_date)
            )
            booking_id = cursor.lastrowid
            await db.commit()

        admin_text = (
            "🔔 **НОВАЯ ЗАПИСЬ!**\n"
            f"👤 {user_name} (ID: {user_id})\n"
            f"💅 {service}\n"
            f"📅 {booking_date}\n"
            "━━━━━━━━━━━━━━━━━━"
        )
        kb = types.InlineKeyboardMarkup(inline_keyboard=[
            [
                types.InlineKeyboardButton(text="✅ Подтвердить", callback_data=f"conf_{booking_id}"),
                types.InlineKeyboardButton(text="❌ Отклонить", callback_data=f"canc_{booking_id}")
            ]
        ])

        await message.bot.send_message(
            chat_id=ADMIN_ID,
            text=admin_text,
            reply_markup=kb,
            parse_mode="Markdown"
        )

        await message.answer(
            f"✅ {user_name}, вы записаны!\n"
            f"{service} — {booking_date}\n\n"
            "Мастер подтвердит запись."
        )
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        await message.answer("Ошибка при записи. Попробуйте позже.")
@router.callback_query(F.data.startswith("conf_"))
async def admin_confirm(callback: types.CallbackQuery):
    client_id = int(callback.data.split("_")[1])

    await callback.bot.send_message(
        client_id, 
        "✨ **Мастер подтвердил вашу запись!**\nДо встречи в Lashify! 💖"
    )

    await callback.message.edit_text(callback.message.text + "\n\n✅ **ЗАПИСЬ ПОДТВЕРЖДЕНА**")
    await callback.answer("Клиент уведомлен! 🚀")
