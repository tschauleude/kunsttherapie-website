/**
 * Termin-Slots: nur Dienstag vormittags & Donnerstag früher Abend (konfigurierbar).
 */

const SLOT_MINUTES = parseInt(process.env.BOOKING_SLOT_MINUTES || '90', 10);
const MIN_ADVANCE_HOURS = parseInt(process.env.BOOKING_MIN_ADVANCE_HOURS || '24', 10);

// 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa
const DEFAULT_DAY_SCHEDULE = {
  2: { start: '11:00', end: '12:30', label: 'Dienstag Vormittag' },
  4: { start: '18:00', end: '19:30', label: 'Donnerstag Abend' },
};

function parseTimeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseDaySchedule() {
  if (process.env.BOOKING_SCHEDULE) {
    try {
      const raw = JSON.parse(process.env.BOOKING_SCHEDULE);
      const out = {};
      Object.keys(raw).forEach((key) => {
        const day = parseInt(key, 10);
        const block = raw[key];
        if (!Number.isNaN(day) && block?.start && block?.end) {
          out[day] = {
            start: block.start,
            end: block.end,
            label: block.label || '',
          };
        }
      });
      if (Object.keys(out).length) return out;
    } catch (e) {
      console.error('BOOKING_SCHEDULE JSON ungültig, nutze Standard:', e.message);
    }
  }
  return { ...DEFAULT_DAY_SCHEDULE };
}

const DAY_SCHEDULE = parseDaySchedule();

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function parseDateTime(dateStr, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const base = toLocalDate(dateStr);
  base.setHours(h, m, 0, 0);
  return base;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function getDaySchedule(dateStr) {
  const day = toLocalDate(dateStr).getDay();
  return DAY_SCHEDULE[day] || null;
}

function isWorkingDay(dateStr) {
  return Boolean(getDaySchedule(dateStr));
}

function generateSlotsForDay(dateStr) {
  const block = getDaySchedule(dateStr);
  if (!block) return [];

  const startMin = parseTimeToMinutes(block.start);
  const endMin = parseTimeToMinutes(block.end);
  const slots = [];

  for (let minutes = startMin; minutes + SLOT_MINUTES <= endMin; minutes += SLOT_MINUTES) {
    slots.push({
      start: minutesToTime(minutes),
      end: minutesToTime(minutes + SLOT_MINUTES),
    });
  }
  return slots;
}

function isSlotInPast(dateStr, startTime) {
  const slotStart = parseDateTime(dateStr, startTime);
  const minStart = new Date(Date.now() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
  return slotStart < minStart;
}

function slotsWithAvailability(dateStr, busyIntervals = []) {
  const template = generateSlotsForDay(dateStr);
  return template.map((slot) => {
    const slotStart = parseDateTime(dateStr, slot.start);
    const slotEnd = parseDateTime(dateStr, slot.end);
    const busy = busyIntervals.some((b) => overlaps(slotStart, slotEnd, b.start, b.end));
    const past = isSlotInPast(dateStr, slot.start);
    return {
      ...slot,
      available: !busy && !past,
    };
  });
}

function monthRange(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const last = new Date(y, m, 0);
  const from = `${y}-${pad2(m)}-01`;
  const to = `${y}-${pad2(m)}-${pad2(last.getDate())}`;
  return { from, to, year: y, month: m, daysInMonth: last.getDate() };
}

function eachDayInRange(fromStr, toStr) {
  const days = [];
  const cur = toLocalDate(fromStr);
  const end = toLocalDate(toStr);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    const d = cur.getDate();
    days.push(`${y}-${pad2(m)}-${pad2(d)}`);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function bookingsToIntervals(rows) {
  return rows
    .filter((b) => b.status !== 'cancelled')
    .map((b) => ({
      start: parseDateTime(b.date, b.start_time),
      end: parseDateTime(b.date, b.end_time),
      source: 'booking',
      id: b.id,
    }));
}

function getScheduleForApi() {
  return Object.entries(DAY_SCHEDULE).map(([day, block]) => ({
    day: parseInt(day, 10),
    start: block.start,
    end: block.end,
    label: block.label,
  }));
}

/** Akzeptiert startTime, time, start_time, slot sowie datetime als Fallback. */
function normalizeBookingPayload(body = {}) {
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phone = body.phone != null && String(body.phone).trim() ? String(body.phone).trim() : null;
  const message = body.message != null && String(body.message).trim() ? String(body.message).trim() : null;

  let date = body.date != null ? String(body.date).trim() : '';
  let startTime =
    body.startTime ?? body.start_time ?? body.time ?? body.slot ?? body.start ?? null;
  startTime = startTime != null ? String(startTime).trim() : '';

  if ((!date || !startTime) && body.datetime) {
    const raw = String(body.datetime).trim();
    const iso = raw.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    if (iso) {
      date = date || iso[1];
      startTime = startTime || iso[2];
    }
  }

  return { name, email, phone, message, date, startTime };
}

module.exports = {
  SLOT_MINUTES,
  MIN_ADVANCE_HOURS,
  DAY_SCHEDULE,
  parseDateTime,
  overlaps,
  isWorkingDay,
  getDaySchedule,
  generateSlotsForDay,
  slotsWithAvailability,
  monthRange,
  eachDayInRange,
  bookingsToIntervals,
  isSlotInPast,
  getScheduleForApi,
  normalizeBookingPayload,
};
