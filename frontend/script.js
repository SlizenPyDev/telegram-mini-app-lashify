const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

window.bookingData = window.bookingData || { service: null, price: null, date: null, time: null, is_custom: false };
window.currentMonth = new Date();

console.log("Система инициализирована ✅");
if (window.Telegram.WebApp) {
    console.log("Библиотека Telegram загружена успешно! ✅");
} else {
    console.log("Библиотека НЕ загружена. Проверь путь в HTML! ❌");
}

function nextStep(step) {
    console.log("Переход на шаг:", step);
    document.querySelectorAll('.step').forEach(s => {
        s.style.setProperty('display', 'none', 'important');
        s.classList.remove('active');
    });
    const targetId = (step === 'admin') ? 'step-admin' : `step-${step}`;
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
        targetEl.style.setProperty('display', 'flex', 'important');
        targetEl.classList.add('active');
        if (step === 3 || step === '3') renderCalendar();
        
        if (step === 4 || step === '4') {
            updateFinalSummary();
        }
    }
}

function updateFinalSummary() {
    const finalService = document.getElementById('final-service');
    const finalDateTime = document.getElementById('final-date-time');
    
    if (finalService) {
        finalService.innerText = window.bookingData.service || 'не выбрана';
    }
    if (finalDateTime) {
        finalDateTime.innerText = `${window.bookingData.date || 'дата не выбрана'} в ${window.bookingData.time || 'время не выбрано'}`;
    }
    
    // Для старых элементов, если они есть
    const summaryService = document.getElementById('summary-service');
    const summaryDate = document.getElementById('summary-date');
    if (summaryService) summaryService.innerText = window.bookingData.service || '';
    if (summaryDate) summaryDate.innerText = `${window.bookingData.date || ''} в ${window.bookingData.time || ''}`;
}
function selectService(element, name, price) {
    console.log("Клик по услуге:", name);
    if (!window.bookingData) {
        window.bookingData = { service: null, price: null, date: null, time: null, is_custom: false };
    }
    window.bookingData.service = name;
    window.bookingData.price = price;
    
    document.querySelectorAll('.service-item').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    
    const currentStep = element.closest('.step');
    const nextBtn = currentStep.querySelector('.btn-main');
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.remove('btn-disabled');
        nextBtn.style.setProperty('background', 'linear-gradient(90deg, #ad1457, #6a1b9a)', 'important');
        nextBtn.style.setProperty('opacity', '1', 'important');
        nextBtn.style.setProperty('pointer-events', 'auto', 'important');
        console.log("Кнопка на текущем экране активирована! ✅");
    } else {
        console.error("Кнопка не найдена на текущем шаге! ❌");
    }
}

function renderCalendar() {
    const daysContainer = document.getElementById('daysGrid');
    const monthLabel = document.getElementById('monthDisplay');
    if (!daysContainer || !monthLabel) return;
    if (!window.currentMonth) window.currentMonth = new Date();
    const year = window.currentMonth.getFullYear();
    const month = window.currentMonth.getMonth();
    monthLabel.innerText = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(window.currentMonth);
    daysContainer.innerHTML = '';
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDay = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startingDay; i++) daysContainer.innerHTML += `<div></div>`;
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let className = 'day-slot';
        if (dateObj < today) className += ' disabled';
        daysContainer.innerHTML += `<div class="${className}" onclick="selectDate(this, ${day})">${day}</div>`;
    }
}

function selectDate(el, day) {
    if (el.classList.contains('disabled')) return;
    document.querySelectorAll('.day-slot').forEach(d => d.classList.remove('selected'));
    el.classList.add('selected');
    
    const month = window.currentMonth.getMonth() + 1;
    const year = window.currentMonth.getFullYear();
    window.bookingData.date = `${day}.${month}.${year}`;
    console.log("Дата выбрана и сохранена:", window.bookingData.date);
}

function selectDay(el, day) {
    selectDate(el, day);
}

function changeMonth(delta) {
    window.currentMonth.setMonth(window.currentMonth.getMonth() + delta);
    renderCalendar();
}

function selectTime(element) {
    const time = element.innerText.trim();
    console.log("Выбрано время:", time);
    
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    element.classList.add('selected');
    
    window.bookingData.time = time;
    window.bookingData.is_custom = false;
    
    const customInput = document.getElementById('custom-time-input');
    if (customInput) customInput.value = "";
    
    console.log("Время сохранено:", window.bookingData.time);
}

function openCustomTime() {
    const block = document.getElementById('custom-time-block');
    if (block) {
        block.style.display = block.style.display === 'none' || !block.style.display ? 'block' : 'none';
    }
}


function sendData() {
    try {
        const customTimeInput = document.getElementById('custom-time-input');
        if (customTimeInput && customTimeInput.value) {
            window.bookingData.time = customTimeInput.value;
            window.bookingData.is_custom = true;
        }
        if (!window.bookingData.time || !window.bookingData.date) {
            alert("Пожалуйста, выберите дату и время!");
            return;
        }
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.sendData(JSON.stringify(window.bookingData));
            nextStep(4);
        } else {
            alert("Запись создана ;)");
            nextStep(4);
        }
    } catch (error) {
        console.error(error);
        alert("Ошибка: " + error.message);
    }
}

async function loadBookings() {
    const container = document.getElementById('admin-records');
    if (!container) return;
    container.innerHTML = '<p style="opacity:0.6;">Загрузка записей...</p>';
    
    try {
        const initData = tg.initData;
        const response = await fetch(`/admin/bookings?initData=${encodeURIComponent(initData)}`);
        if (!response.ok) {
            if (response.status === 401) {
                container.innerHTML = '<p style="color:#ff8888;">Нет доступа. Вы не админ.</p>';
                return;
            }
            throw new Error('Ошибка загрузки');
        }
        const bookings = await response.json();
        
        if (bookings.length === 0) {
            container.innerHTML = '<p style="opacity:0.6;">Нет записей</p>';
            return;
        }
        
        container.innerHTML = '';
        for (const booking of bookings) {
            const card = document.createElement('div');
            card.className = 'booking-card';
            card.dataset.id = booking.id;
            
            const statusText = {
                'pending': '🟡 Ожидает',
                'confirmed': '✅ Подтверждена',
                'cancelled': '❌ Отменена'
            }[booking.status] || booking.status;
            
            card.innerHTML = `
                <div class="booking-header">
                    <strong>${escapeHtml(booking.user_name)}</strong>
                    <span class="booking-status status-${booking.status}">${statusText}</span>
                </div>
                <div class="booking-details">${escapeHtml(booking.service_name)} • ${booking.booking_date}</div>
                <div class="booking-actions">
                    ${booking.status === 'pending' ? `
                        <button class="admin-confirm" data-id="${booking.id}">✅ Подтвердить</button>
                        <button class="admin-cancel" data-id="${booking.id}">❌ Отменить</button>
                    ` : booking.status === 'confirmed' ? `
                        <button class="admin-cancel" data-id="${booking.id}">❌ Отменить</button>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
        }
        
        document.querySelectorAll('.admin-confirm').forEach(btn => {
            btn.onclick = () => confirmBooking(btn.dataset.id);
        });
        document.querySelectorAll('.admin-cancel').forEach(btn => {
            btn.onclick = () => cancelBooking(btn.dataset.id);
        });
        
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color:#ff8888;">Ошибка загрузки записей</p>';
    }
}

async function confirmBooking(bookingId) {
    if (!confirm('Подтвердить запись? Клиент получит уведомление.')) return;
    const initData = tg.initData;
    try {
        const response = await fetch(`/admin/confirm/${bookingId}?initData=${encodeURIComponent(initData)}`, {
            method: 'POST'
        });
        if (response.ok) {
            alert('Запись подтверждена!');
            loadBookings(); 
        } else {
            alert('Ошибка при подтверждении');
        }
    } catch(e) { console.error(e); alert('Ошибка сети'); }
}

async function cancelBooking(bookingId) {
    if (!confirm('Отменить запись? Клиент получит уведомление.')) return;
    const initData = tg.initData;
    try {
        const response = await fetch(`/admin/cancel/${bookingId}?initData=${encodeURIComponent(initData)}`, {
            method: 'POST'
        });
        if (response.ok) {
            alert('Запись отменена');
            loadBookings();
        } else {
            alert('Ошибка при отмене');
        }
    } catch(e) { console.error(e); alert('Ошибка сети'); }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const user = tg.initDataUnsafe?.user;
    const MY_ID = 12345678;
    if (user && user.id === MY_ID) {
        const adminBtn = document.createElement('div');
        adminBtn.innerHTML = '<p style="margin:0; color:#ad1457; font-weight:bold;">👑 ВОЙТИ В АДМИНКУ</p>';
        adminBtn.onclick = () => nextStep('admin');
        document.getElementById('admin-login-node')?.appendChild(adminBtn);
    }
    loadBookings();
    document.getElementById('custom-time-input')?.addEventListener('input', function(e) {
        if (e.target.value) {
            document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
            window.bookingData.time = e.target.value;
            window.bookingData.is_custom = true;
        }
    });
});