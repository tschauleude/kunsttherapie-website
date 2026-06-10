const API_URL = window.location.origin + '/api';

async function parseJsonResponse(res, fallbackError) {
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    if (!res.ok) throw new Error(fallbackError);
    return data;
  }
  if (!res.ok) throw new Error(data.error || fallbackError);
  return data;
}

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
let bookingConfigCache = null;
let formLoadedAt = 0;

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

function hideBookingForm() {
  const panel = document.getElementById('bookingFormPanel');
  if (panel) panel.classList.remove('is-visible');
}

function showBookingForm() {
  const panel = document.getElementById('bookingFormPanel');
  if (!panel) return;
  panel.classList.add('is-visible');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function selectDay(dateStr) {
  const dayLabel = document.getElementById('selectedDayLabel');
  const list = document.getElementById('slotsList');
  if (!dayLabel || !list) return;

  selectedDate = dateStr;
  selectedStart = null;
  hideBookingForm();
  dayLabel.textContent = formatDateLabel(dateStr);
  renderCalendar();

  list.innerHTML = `<p class="sub">${tr('book.loadingSlots')}</p>`;

  try {
    const res = await fetch(`${API_URL}/bookings/slots?date=${dateStr}`);
    const data = await parseJsonResponse(res, tr('book.slotsError') || 'Zeiten konnten nicht geladen werden.');
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
  const bookDate = document.getElementById('bookDate');
  const bookStart = document.getElementById('bookStart');
  const bookingSummary = document.getElementById('bookingSummary');
  const bookingMessage = document.getElementById('bookingMessage');
  if (!bookDate || !bookStart || !bookingSummary) return;

  selectedDate = dateStr;
  selectedStart = startTime;
  formLoadedAt = Date.now();
  bookDate.value = dateStr;
  bookStart.value = startTime;
  const formAt = document.getElementById('bookFormAt');
  if (formAt) formAt.value = String(formLoadedAt);
  const timeSuffix = tr('book.timeUnit');
  bookingSummary.textContent = `${formatDateLabel(dateStr)}, ${startTime}${timeSuffix}`;
  if (bookingMessage) bookingMessage.hidden = true;
  showBookingForm();
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
  if (!msg || !btn) return;
  btn.disabled = true;
  msg.hidden = true;

  const body = {
    name: document.getElementById('bookName').value,
    email: document.getElementById('bookEmail').value,
    phone: document.getElementById('bookPhone').value,
    message: document.getElementById('bookMessage').value,
    date: document.getElementById('bookDate').value,
    startTime: document.getElementById('bookStart').value,
    website: document.getElementById('bookWebsite')?.value || '',
    _formAt: Number(document.getElementById('bookFormAt')?.value) || formLoadedAt || 0,
  };

  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await parseJsonResponse(res, tr('book.error') || 'Buchung fehlgeschlagen.');
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

function weekdayLabels() {
  return locale().startsWith('en')
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
}

const SCHEDULE_SLOT_KEYS = { 2: 'book.scheduleSlot.2', 4: 'book.scheduleSlot.4' };

function fullWeekdayName(dayIndex) {
  const ref = new Date(2024, 0, 7 + dayIndex);
  return ref.toLocaleDateString(locale(), { weekday: 'long' });
}

function timeOfDayLabel(start) {
  const hour = parseInt(String(start).split(':')[0], 10);
  const key = hour < 13 ? 'book.timeOfDay.morning' : 'book.timeOfDay.evening';
  return tr(key);
}

function scheduleSlotLabel(slot) {
  const key = SCHEDULE_SLOT_KEYS[slot.day];
  if (key) {
    const label = tr(key);
    if (label) return label;
  }
  const tod = timeOfDayLabel(slot.start);
  const day = fullWeekdayName(slot.day);
  return tod ? `${day} ${tod}` : day;
}

function applySlotsHint(cfg) {
  const hint = document.getElementById('slotsHint');
  if (!hint) return;

  if (!cfg?.schedule?.length) {
    const val = tr('book.slotsHint');
    if (val) hint.innerHTML = val;
    return;
  }

  const parts = cfg.schedule.map((s) => `${scheduleSlotLabel(s)} ${s.start}–${s.end}`);
  const tpl = tr('book.slotsHintDynamic');
  if (!tpl) return;
  hint.innerHTML = tpl
    .replace('{schedule}', parts.join(' · '))
    .replace('{minutes}', String(cfg.slotMinutes));
}

async function loadBookingConfig() {
  try {
    const res = await fetch(`${API_URL}/bookings/config`);
    bookingConfigCache = await res.json();
    applySlotsHint(bookingConfigCache);
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
  if (selectedDate) label.textContent = formatDateLabel(selectedDate);

  if (bookingConfigCache) applySlotsHint(bookingConfigCache);
  else {
    const slotsHint = document.getElementById('slotsHint');
    const hintVal = tr('book.slotsHint');
    if (slotsHint && hintVal) slotsHint.innerHTML = hintVal;
  }

  const prev = document.getElementById('prevMonth');
  const next = document.getElementById('nextMonth');
  if (prev) prev.setAttribute('aria-label', tr('book.prevMonth'));
  if (next) next.setAttribute('aria-label', tr('book.nextMonth'));

  const legend = document.querySelector('.booking-legend');
  if (legend) {
    const legVal = tr('book.legend');
    if (legVal) legend.innerHTML = legVal;
  }

  const weekdays = document.querySelector('.booking-weekdays');
  if (weekdays) {
    const wdVal = tr('book.weekdays');
    if (wdVal) weekdays.innerHTML = wdVal;
  }

  if (monthData) {
    renderCalendar();
    const status = document.getElementById('calendarStatus');
    if (status) {
      const bookable = monthHasBookableDays(monthData);
      status.textContent = bookable ? tr('book.hintFree') : tr('book.hintNone');
    }
  }
});
