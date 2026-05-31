const API_URL = window.location.origin + '/api';

function tr(key) {
  const v = window.ktI18n?.t(key);
  return v != null ? v : '';
}

function locale() {
  return window.ktI18n?.getLocale?.() || 'de-DE';
}

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
  return new Date(y, m - 1, d).toLocaleDateString(locale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function monthLabel(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function nextMonthStr(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return formatMonth(new Date(y, m, 1));
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

function monthHasBookableDays(data) {
  if (!data?.days) return false;
  return Object.values(data.days).some((day) => day.workingDay && day.hasAvailability);
}

async function fetchMonth(monthStr) {
  const res = await fetch(`${API_URL}/bookings/availability?month=${monthStr}`);
  if (!res.ok) throw new Error('Laden fehlgeschlagen');
  return res.json();
}

async function loadMonth(monthStr, prefetched) {
  const status = document.getElementById('calendarStatus');
  if (!status) return;
  status.textContent = tr('book.loading') || 'Kalender wird geladen …';

  try {
    monthData = prefetched || (await fetchMonth(monthStr));
    currentMonth = monthStr;
    document.getElementById('monthLabel').textContent = monthLabel(monthStr);
    renderCalendar();
    const bookable = monthHasBookableDays(monthData);
    status.textContent = bookable ? tr('book.hintFree') : tr('book.hintNone');
  } catch (e) {
    status.textContent = tr('book.statusError');
    console.error(e);
  }
}

async function loadInitialMonth() {
  let month = formatMonth(new Date());
  for (let i = 0; i < 8; i += 1) {
    try {
      const data = await fetchMonth(month);
      if (monthHasBookableDays(data)) {
        await loadMonth(month, data);
        return;
      }
      month = nextMonthStr(month);
    } catch (e) {
      await loadMonth(month);
      return;
    }
  }
  await loadMonth(month);
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  if (!grid || !monthData) return;

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
      let hint = tr('book.dayNoOffer');

      if (!day || !day.workingDay) {
        cls += ' booking-day-off';
        hint = tr('book.dayOff');
      } else {
        disabled = false;
        if (day.hasAvailability) {
          cls += ' booking-day-free';
          hint = tr('book.dayFree');
        } else {
          cls += ' booking-day-busy';
          hint = tr('book.dayBusy');
        }
      }

      if (cell.date === todayStr) cls += ' booking-day-today';
      if (cell.date === selectedDate) cls += ' booking-day-selected';

      const label = parseInt(cell.date.split('-')[2], 10);
      return `<button type="button" class="${cls}" data-date="${cell.date}" ${
        disabled ? 'disabled' : ''
      } role="gridcell" aria-label="${hint}: ${cell.date}">${label}</button>`;
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
  list.innerHTML = `<p class="sub">${tr('book.loadingSlots')}</p>`;

  try {
    const res = await fetch(`${API_URL}/bookings/slots?date=${dateStr}`);
    const data = await res.json();
    if (!data.workingDay) {
      list.innerHTML = `<p class="sub">${tr('book.noSlotsDay')}</p>`;
      return;
    }

    if (!data.slots.length) {
      list.innerHTML = `<p class="sub">${tr('book.noSlots')}</p>`;
      return;
    }

    const freeCount = data.slots.filter((s) => s.available).length;
    if (!freeCount) {
      list.innerHTML = `<p class="sub">${tr('book.allBusy')}</p>`;
      return;
    }

    list.innerHTML = data.slots
      .map((slot) => {
        const cls = slot.available ? 'slot-btn slot-free' : 'slot-btn slot-busy';
        const disabled = slot.available ? '' : 'disabled';
        const busy = slot.available ? '' : tr('book.slotBusy');
        return `<button type="button" class="${cls}" data-start="${slot.start}" ${disabled}>
          ${slot.start} – ${slot.end}${busy}
        </button>`;
      })
      .join('');

    list.querySelectorAll('.slot-free').forEach((btn) => {
      btn.addEventListener('click', () => selectSlot(dateStr, btn.dataset.start));
    });
  } catch (e) {
    list.innerHTML = `<p class="sub">${tr('book.slotsError')}</p>`;
  }
}

function selectSlot(dateStr, startTime) {
  selectedDate = dateStr;
  selectedStart = startTime;
  document.getElementById('bookDate').value = dateStr;
  document.getElementById('bookStart').value = startTime;
  const timeSuffix = tr('book.timeUnit');
  document.getElementById('bookingSummary').textContent = `${formatDateLabel(dateStr)}, ${startTime}${timeSuffix}`;
  document.getElementById('bookingFormPanel').style.display = 'block';
  document.getElementById('bookingMessage').hidden = true;
  document.getElementById('bookingFormPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showCalendarLinks(links, emailSent) {
  const panel = document.getElementById('bookingFormPanel');
  let box = document.getElementById('bookingCalendarLinks');
  if (!box) {
    box = document.createElement('div');
    box.id = 'bookingCalendarLinks';
    box.className = 'booking-calendar-links';
    panel.appendChild(box);
  }

  const mailNote = emailSent
    ? `<p class="note">${tr('book.confirmedNote')}</p>`
    : `<p class="note">${tr('book.saveCalendar')}</p>`;

  box.innerHTML = `
    ${mailNote}
    <div class="booking-calendar-actions">
      <a class="btn outline" href="${links.googleUrl}" target="_blank" rel="noopener noreferrer">${tr('book.googleCal')}</a>
      <a class="btn outline" href="${links.icsUrl}" download>${tr('book.icsCal')}</a>
    </div>
  `;
  box.hidden = false;
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
      throw new Error(data.error || tr('book.error'));
    }
    msg.textContent = data.message || tr('book.success');
    msg.className = 'booking-alert booking-alert-success';
    msg.hidden = false;
    const linksBox = document.getElementById('bookingCalendarLinks');
    if (linksBox) linksBox.hidden = true;
    if (data.calendarLinks && data.status === 'confirmed') {
      showCalendarLinks(data.calendarLinks, data.emailSent);
    }
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
      hint.innerHTML = `Buchbar: ${parts.join(' · ')} (je ${cfg.slotMinutes} Minuten). <strong>Nur grüne Tage</strong> im Kalender anklicken.`;
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
    loadMonth(nextMonthStr(currentMonth));
  });

  form.addEventListener('submit', submitBooking);
  loadBookingConfig();
  loadInitialMonth();
}

document.addEventListener('DOMContentLoaded', initBookingPage);
document.addEventListener('kt-lang-change', () => {
  if (!document.getElementById('bookingForm')) return;
  const label = document.getElementById('selectedDayLabel');
  if (label && !selectedDate) label.textContent = tr('book.pickDay');
  if (monthData) {
    loadMonth(currentMonth, monthData);
    if (selectedDate) selectDay(selectedDate);
  }
});
