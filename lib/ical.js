const crypto = require('crypto');
const { zonedToUtc } = require('./timezone');
const { resolveAppSecret } = require('./secret');

const PRACTICE_NAME = 'Kunsttherapie Paderborn';
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
  // Wanduhrzeit der Praxis-Zeitzone → korrekter absoluter UTC-Zeitpunkt,
  // damit Kalender-Apps die richtige Uhrzeit anzeigen (auch auf UTC-Servern).
  const start = zonedToUtc(booking.date, booking.start_time, tz);
  const end = zonedToUtc(booking.date, booking.end_time, tz);
  return { start, end, tz };
}

function buildIcs(booking, options = {}) {
  const { start, end } = parseBookingTimes(booking, options.timeZone);
  const uid = options.uid || `booking-${booking.id}@kunsttherapie-pb.de`;
  const stamp = toIcsUtc(new Date());
  const dtStart = toIcsUtc(start);
  const dtEnd = toIcsUtc(end);
  const summary = options.summary || `Termin Kunsttherapie – ${booking.name}`;
  const description = [
    `Termin Kunsttherapie Paderborn`,
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
    `Termin im Atelier Kunsttherapie Paderborn.\n${PRACTICE_ADDRESS}`
  );
  const location = encodeURIComponent(PRACTICE_ADDRESS);
  const dates = `${fmt(start)}/${fmt(end)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}

function signBookingToken(bookingId) {
  // Starkes, persistiertes App-Secret statt hartcodiertem Fallback – sonst
  // könnte jeder Token fälschen und fremde Buchungs-PII per .ics abrufen.
  const secret = resolveAppSecret();
  return crypto.createHmac('sha256', secret).update(`ical:${bookingId}`).digest('hex').slice(0, 20);
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
