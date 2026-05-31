const crypto = require('crypto');

const PRACTICE_NAME = 'Kunsttherapie Paderborn – Martina Schwierzke';
const PRACTICE_ADDRESS = 'Otto-Stadler-Straße 23c, 33102 Paderborn';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toIcsUtc(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function parseBookingTimes(booking, timeZone) {
  const tz = timeZone || process.env.BOOKING_TIMEZONE || 'Europe/Berlin';
  const start = new Date(`${booking.date}T${booking.start_time}:00`);
  const end = new Date(`${booking.date}T${booking.end_time}:00`);
  return { start, end, tz };
}

function buildIcs(booking, options = {}) {
  const { start, end, tz } = parseBookingTimes(booking, options.timeZone);
  const uid = options.uid || `booking-${booking.id}@kunsttherapie-pb.de`;
  const stamp = toIcsUtc(new Date());
  const dtStart = toIcsUtc(start);
  const dtEnd = toIcsUtc(end);
  const summary = options.summary || `Termin Kunsttherapie – ${booking.name}`;
  const description = [
    `Termin mit Martina Schwierzke`,
    `Name: ${booking.name}`,
    `E-Mail: ${booking.email}`,
    booking.phone ? `Telefon: ${booking.phone}` : null,
    booking.message ? `Nachricht: ${booking.message}` : null,
    `Buchungs-Nr. ${booking.id}`,
  ]
    .filter(Boolean)
    .join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kunsttherapie Paderborn//Buchung//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(PRACTICE_ADDRESS)}`,
    `TZID:${tz}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function escapeIcsText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function googleCalendarUrl(booking) {
  const { start, end } = parseBookingTimes(booking);
  const fmt = (d) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');

  const text = encodeURIComponent(`Kunsttherapie – Termin (${booking.name})`);
  const details = encodeURIComponent(
    `Termin in der Praxis von Martina Schwierzke.\n${PRACTICE_ADDRESS}`
  );
  const location = encodeURIComponent(PRACTICE_ADDRESS);
  const dates = `${fmt(start)}/${fmt(end)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}

function signBookingToken(bookingId) {
  const secret = process.env.SESSION_SECRET || 'kunsttherapie-calendar';
  return crypto.createHmac('sha256', secret).update(String(bookingId)).digest('hex').slice(0, 20);
}

function verifyBookingToken(bookingId, token) {
  if (!token) return false;
  const expected = signBookingToken(bookingId);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch (e) {
    return false;
  }
}

function buildCalendarLinks(booking, baseUrl) {
  const origin = (baseUrl || '').replace(/\/$/, '');
  const token = signBookingToken(booking.id);
  return {
    icsUrl: `${origin}/api/bookings/${booking.id}/calendar.ics?token=${token}`,
    googleUrl: googleCalendarUrl(booking),
    label: PRACTICE_NAME,
    address: PRACTICE_ADDRESS,
  };
}

module.exports = {
  buildIcs,
  googleCalendarUrl,
  signBookingToken,
  verifyBookingToken,
  buildCalendarLinks,
};
