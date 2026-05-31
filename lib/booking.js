/**
 * Termin-Slots: Werktage, Öffnungszeiten, Überschneidungen mit Buchungen & Google.
 */

const SLOT_MINUTES = parseInt(process.env.BOOKING_SLOT_MINUTES || '60', 10);
const START_HOUR = parseInt(process.env.BOOKING_START_HOUR || '9', 10);
const END_HOUR = parseInt(process.env.BOOKING_END_HOUR || '17', 10);
const WORK_DAYS = (process.env.BOOKING_WORK_DAYS || '1,2,3,4,5')
  .split(',')
  .map((d) => parseInt(d.trim(), 10))
  .filter((n) => !Number.isNaN(n));

const MIN_ADVANCE_HOURS = parseInt(process.env.BOOKING_MIN_ADVANCE_HOURS || '24', 10);

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

function isWorkingDay(dateStr) {
  const day = toLocalDate(dateStr).getDay();
  return WORK_DAYS.includes(day);
}

function generateSlotsForDay(dateStr) {
  if (!isWorkingDay(dateStr)) return [];

  const slots = [];
  for (let minutes = START_HOUR * 60; minutes + SLOT_MINUTES <= END_HOUR * 60; minutes += SLOT_MINUTES) {
    const startH = Math.floor(minutes / 60);
    const startM = minutes % 60;
    const endTotal = minutes + SLOT_MINUTES;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    slots.push({
      start: `${pad2(startH)}:${pad2(startM)}`,
      end: `${pad2(endH)}:${pad2(endM)}`,
    });
  }
  return slots;
}

function isSlotInPast(dateStr, startTime) {
  const slotStart = parseDateTime(dateStr, startTime);
  const minStart = new Date(Date.now() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
  return slotStart < minStart;
}

/**
 * @param {string} dateStr YYYY-MM-DD
 * @param {Array} busyIntervals { start: Date, end: Date }[]
 */
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
  const first = new Date(y, m - 1, 1);
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

module.exports = {
  SLOT_MINUTES,
  START_HOUR,
  END_HOUR,
  WORK_DAYS,
  MIN_ADVANCE_HOURS,
  parseDateTime,
  overlaps,
  isWorkingDay,
  generateSlotsForDay,
  slotsWithAvailability,
  monthRange,
  eachDayInRange,
  bookingsToIntervals,
  isSlotInPast,
};
