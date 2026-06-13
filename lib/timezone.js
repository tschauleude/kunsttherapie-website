/**
 * Zeitzonen-Helfer: wandelt eine Wanduhrzeit (z. B. 11:00 in Europe/Berlin)
 * in den korrekten absoluten UTC-Zeitpunkt um – DST-sicher, ohne externe
 * Bibliothek (nutzt Intl). Wird von booking.js (Slot-/Belegt-Vergleich) und
 * ical.js (Kalenderausgabe) gemeinsam genutzt, damit lokale Termine und
 * Google-Kalender-Zeiten auf jedem Server (auch UTC) übereinstimmen.
 */

const DEFAULT_TZ = process.env.BOOKING_TIMEZONE || 'Europe/Berlin';

// Offset (ms) der Zeitzone `tz` gegenüber UTC zum gegebenen UTC-Zeitpunkt.
function tzOffsetMs(date, tz) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p = dtf.formatToParts(date).reduce((acc, x) => {
    acc[x.type] = x.value;
    return acc;
  }, {});
  const asTz = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    p.hour === '24' ? 0 : Number(p.hour),
    Number(p.minute),
    Number(p.second)
  );
  return asTz - date.getTime();
}

// Wanduhrzeit (dateStr=YYYY-MM-DD, timeStr=HH:MM) in `tz` → korrektes UTC-Date.
function zonedToUtc(dateStr, timeStr, tz = DEFAULT_TZ) {
  const [y, mo, d] = String(dateStr).split('-').map(Number);
  const [h, mi] = String(timeStr).split(':').map(Number);
  // Erste Näherung: Wanduhrzeit so behandeln, als wäre sie bereits UTC.
  const guess = new Date(Date.UTC(y, (mo || 1) - 1, d || 1, h || 0, mi || 0, 0, 0));
  const off1 = tzOffsetMs(guess, tz);
  const utc = new Date(guess.getTime() - off1);
  // Zweiter Durchlauf fängt DST-Übergänge ab (Offset am Zielzeitpunkt prüfen).
  const off2 = tzOffsetMs(utc, tz);
  if (off2 !== off1) return new Date(guess.getTime() - off2);
  return utc;
}

module.exports = { DEFAULT_TZ, zonedToUtc, tzOffsetMs };
