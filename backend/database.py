import aiosqlite

DB_PATH = 'lash_beauty.db'

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                user_name TEXT,
                service_name TEXT,
                booking_date TEXT,
                status TEXT DEFAULT 'pending'
            )''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                price INTEGER
            )''')
        
        prices = [
            ('Классика', 1200), ('1.5 D', 1300), ('2 D', 1400),
            ('2.5 D', 1600), ('3 D', 1700), ('4 D', 2000), ('Снятие', 200)
        ]
        await db.executemany('INSERT OR IGNORE INTO services (name, price) VALUES (?, ?)', prices)
        await db.commit()
        print("✅ База данных готова")

async def add_booking(user_id, user_name, service, booking_date):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO bookings (user_id, user_name, service_name, booking_date) VALUES (?, ?, ?, ?)",
            (user_id, user_name, service, booking_date)
        )
        await db.commit()
        print(f"--- БАЗА: Запись для {user_name} сохранена! ---")

async def get_all_bookings():
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT * FROM bookings ORDER BY id DESC")
        return await cursor.fetchall()

async def get_booking_by_id(booking_id):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        return await cursor.fetchone()

async def update_booking_status(booking_id, status):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("UPDATE bookings SET status = ? WHERE id = ?", (status, booking_id))
        await db.commit()