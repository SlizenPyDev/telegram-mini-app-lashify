import json
import hmac
import hashlib
from aiohttp import web
from aiogram import Bot
from backend.database import get_all_bookings, update_booking_status, get_booking_by_id
from backend.config import BOT_TOKEN, ADMIN_ID

bot = Bot(token=BOT_TOKEN)

def check_admin(init_data: str) -> bool:

    try:
        params = dict(x.split('=') for x in init_data.split('&') if x)
        hash_str = params.pop('hash')
        data_check_string = '\n'.join(f"{k}={params[k]}" for k in sorted(params.keys()))
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        if computed_hash != hash_str:
            return False
        user = json.loads(params.get('user', '{}'))
        return user.get('id') == ADMIN_ID
    except:
        return False

async def get_bookings(request):
    init_data = request.query.get('initData')
    if not check_admin(init_data):
        return web.json_response({'error': 'Unauthorized'}, status=401)
    
    bookings = await get_all_bookings()
    result = []
    for b in bookings:
        result.append({
            'id': b[0],
            'user_id': b[1],
            'user_name': b[2],
            'service_name': b[3],
            'booking_date': b[4],
            'status': b[5]
        })
    return web.json_response(result)

async def confirm_booking(request):
    init_data = request.query.get('initData')
    if not check_admin(init_data):
        return web.json_response({'error': 'Unauthorized'}, status=401)
    
    booking_id = int(request.match_info['id'])
    booking = await get_booking_by_id(booking_id)
    if not booking:
        return web.json_response({'error': 'Booking not found'}, status=404)
    
    await update_booking_status(booking_id, 'confirmed')
    
    client_id = booking[1]
    try:
        await bot.send_message(
            client_id,
            f"✅ Ваша запись на {booking[3]} ({booking[4]}) подтверждена!\nЖдём вас в Lashify 💖"
        )
    except Exception as e:
        print(f"Не удалось отправить сообщение клиенту {client_id}: {e}")
    
    return web.json_response({'status': 'confirmed'})

async def cancel_booking(request):
    init_data = request.query.get('initData')
    if not check_admin(init_data):
        return web.json_response({'error': 'Unauthorized'}, status=401)
    
    booking_id = int(request.match_info['id'])
    booking = await get_booking_by_id(booking_id)
    if not booking:
        return web.json_response({'error': 'Booking not found'}, status=404)
    
    await update_booking_status(booking_id, 'cancelled')
    
    client_id = booking[1]
    try:
        await bot.send_message(
            client_id,
            f"❌ К сожалению, ваша запись на {booking[3]} ({booking[4]}) отменена.\nВы можете записаться снова в любое время."
        )
    except Exception as e:
        print(f"Не удалось отправить сообщение клиенту {client_id}: {e}")
    
    return web.json_response({'status': 'cancelled'})

# Регистрация роутов
def setup_routes(app):
    app.router.add_get('/admin/bookings', get_bookings)
    app.router.add_post('/admin/confirm/{id}', confirm_booking)
    app.router.add_post('/admin/cancel/{id}', cancel_booking)