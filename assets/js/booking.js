const API_URL = window.location.origin + '/api';

let currentMonth = formatMonth(new Date());
let selectedDate = null;
let selectedStart = null;
let monthData = null;

function formatMonth(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function monthLabel(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function getMondayBasedCells(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  let startOffset = first.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells = [];
  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ empty: true });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ empty: false, date: `${y}-${pad2(m)}-${pad2(d)}` });
  }
  return cells;
}

async function loadMonth(monthStr) {
  const status = document.getElementById('calendarStatus');
  if (!status) return;
  status.textContent = 'Kalender wird geladen …';

  try {
    const res = await fetch(`${API_URL}/bookings/availability?month=${monthStr}`);
    if (!res.ok) throw new Error('Laden fehlgeschlagen');
    monthData = await res.json();
    currentMonth = monthStr;
    document.getElementById('monthLabel').textContent = monthLabel(monthStr);
    renderCalendar();
    status.textContent = monthData.googleCalendarConnected
      ? 'Kalender synchronisiert mit Google.'
      : 'Belegte Zeiten aus Website-Buchungen. Google Kalender kann im Admin verbunden werden.';
  } catch (e) {
    status.textContent = 'Kalender konnte nicht geladen werden. Bitte später erneut versuchen.';
    console.error(e);
  }
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const cells = getMondayBasedCells(currentMonth);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  grid.innerHTML = cells
    .map((cell) => {
      if (cell.empty) {
        return '<div class="booking-day booking-day-empty" role="gridcell"></div>';
      }

      const day = monthData.days[cell.date];
      let cls = 'booking-day';
      let disabled = true;

      if (!day || !day.workingDay) {
        cls += ' booking-day-off';
      } else if (day.hasAvailability) {
        cls += ' booking-day-free';
        disabled = false;
      } else {
        cls += ' booking-day-busy';
      }

      if (cell.date === todayStr) cls += ' booking-day-today';
      if (cell.date === selectedDate) cls += ' booking-day-selected';

      const label = parseInt(cell.date.split('-')[2], 10);
      return `<button type="button" class="${cls}" data-date="${cell.date}" ${
        disabled ? 'disabled' : ''
      } role="gridcell" aria-label="${cell.date}">${label}</button>`;
    })
    .join('');

  grid.querySelectorAll('button[data-date]:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => selectDay(btn.dataset.date));
  });
}

async function selectDay(dateStr) {
  selectedDate = dateStr;
  selectedStart = null;
  document.getElementById('bookingFormPanel').style.display = 'none';
  document.getElementById('selectedDayLabel').textContent = formatDateLabel(dateStr);
  renderCalendar();

  const list = document.getElementById('slotsList');
  list.innerHTML = '<p class="sub">Zeiten werden geladen …</p>';

  try {
    const res = await fetch(`${API_URL}/bookings/slots?date=${dateStr}`);
    const data = await res.json();
    if (!data.workingDay) {
      list.innerHTML = '<p class="sub">An diesem Tag gibt es keine Termine.</p>';
      return;
    }

    if (!data.slots.length) {
      list.innerHTML = '<p class="sub">Keine Slots an diesem Tag.</p>';
      return;
    }

    list.innerHTML = data.slots
      .map((slot) => {
        const cls = slot.available ? 'slot-btn slot-free' : 'slot-btn slot-busy';
        const disabled = slot.available ? '' : 'disabled';
        return `<button type="button" class="${cls}" data-start="${slot.start}" ${disabled}>
          ${slot.start} – ${slot.end}${slot.available ? '' : ' (belegt)'}
        </button>`;
      })
      .join('');

    list.querySelectorAll('.slot-free').forEach((btn) => {
      btn.addEventListener('click', () => selectSlot(dateStr, btn.dataset.start));
    });
  } catch (e) {
    list.innerHTML = '<p class="sub">Zeiten konnten nicht geladen werden.</p>';
  }
}

function selectSlot(dateStr, startTime) {
  selectedDate = dateStr;
  selectedStart = startTime;
  document.getElementById('bookDate').value = dateStr;
  document.getElementById('bookStart').value = startTime;
  document.getElementById('bookingSummary').textContent = `${formatDateLabel(dateStr)}, ${startTime} Uhr`;
  document.getElementById('bookingFormPanel').style.display = 'block';
  document.getElementById('bookingMessage').hidden = true;
  document.getElementById('bookingFormPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function submitBooking(e) {
  e.preventDefault();
  const msg = document.getElementById('bookingMessage');
  const btn = document.getElementById('bookSubmit');
  btn.disabled = true;
  msg.hidden = true;

  const body = {
    name: document.getElementById('bookName').value,
    email: document.getElementById('bookEmail').value,
    phone: document.getElementById('bookPhone').value,
    message: document.getElementById('bookMessage').value,
    date: document.getElementById('bookDate').value,
    startTime: document.getElementById('bookStart').value,
  };

  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Buchung fehlgeschlagen');
    }
    msg.textContent = data.message || 'Termin angefragt. Vielen Dank!';
    msg.className = 'booking-alert booking-alert-success';
    msg.hidden = false;
    document.getElementById('bookingForm').reset();
    selectedStart = null;
    await loadMonth(currentMonth);
    if (selectedDate) selectDay(selectedDate);
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'booking-alert booking-alert-error';
    msg.hidden = false;
  } finally {
    btn.disabled = false;
  }
}

async function loadBookingConfig() {
  try {
    const res = await fetch(`${API_URL}/bookings/config`);
    const cfg = await res.json();
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const hint = document.getElementById('slotsHint');
    if (cfg.schedule?.length && hint) {
      const parts = cfg.schedule.map(
        (s) => `${s.label || dayNames[s.day]} ${s.start}–${s.end}`
      );
      hint.innerHTML = `Buchbar: ${parts.join(' · ')} (je ${cfg.slotMinutes} Minuten).`;
    }
  } catch (e) {
    /* Standard-Hinweis in HTML bleibt */
  }
}

function initBookingPage() {
  const form = document.getElementById('bookingForm');
  const prevMonth = document.getElementById('prevMonth');
  const nextMonth = document.getElementById('nextMonth');
  if (!form || !prevMonth || !nextMonth) return;

  prevMonth.addEventListener('click', () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    loadMonth(formatMonth(d));
  });

  nextMonth.addEventListener('click', () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    loadMonth(formatMonth(d));
  });

  form.addEventListener('submit', submitBooking);
  loadBookingConfig();
  loadMonth(currentMonth);
}

document.addEventListener('DOMContentLoaded', initBookingPage);
