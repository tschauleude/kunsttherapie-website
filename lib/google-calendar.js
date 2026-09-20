const { google } = require('googleapis');

function isConfigured(dbGetSetting) {
  if (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return true;
  }
  return !!dbGetSetting;
}

function buildOAuthClient(refreshToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `http://localhost:${process.env.PORT || 3000}/api/admin/google/callback`;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

function getAuthUrl(state) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `http://localhost:${process.env.PORT || 3000}/api/admin/google/callback`;

  if (!clientId || !clientSecret) {
    return null;
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: state || undefined,
  });
}

async function getRefreshTokenFromCode(code) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `http://localhost:${process.env.PORT || 3000}/api/admin/google/callback`;

  if (!clientId || !clientSecret) return null;

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2.getToken(code);
  return tokens.refresh_token || null;
}

/**
 * Kalender, die gelesen werden. GOOGLE_CALENDAR_ID darf mehrere durch Komma
 * getrennte IDs enthalten – wichtig, wenn Termine über mehrere Kalender
 * verteilt sind. Sonst blockieren Termine aus den übrigen Kalendern die
 * Website nicht, und es käme zu Doppelbuchungen.
 *
 * Geschrieben wird immer in den ERSTEN Eintrag der Liste.
 */
function calendarIds() {
  const raw = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const ids = raw.split(',').map((x) => x.trim()).filter(Boolean);
  return ids.length ? ids : ['primary'];
}

function writeCalendarId() {
  return calendarIds()[0];
}

/** Alle Kalender des verbundenen Kontos auflisten – für die Einrichtung. */
async function listCalendars(refreshToken) {
  const auth = buildOAuthClient(refreshToken);
  if (!auth) return [];
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.calendarList.list({ maxResults: 250 });
  return (res.data.items || []).map((c) => ({
    id: c.id,
    name: c.summary,
    primary: Boolean(c.primary),
    zugriff: c.accessRole,
    ausgewaehlt: c.selected !== false,
  }));
}

async function fetchBusyIntervals(refreshToken, timeMin, timeMax) {
  const auth = buildOAuthClient(refreshToken);
  if (!auth) return [];

  const calendar = google.calendar({ version: 'v3', auth });
  const ids = calendarIds();
  const alle = [];

  for (const calendarId of ids) {
    let res;
    try {
      res = await calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
    } catch (err) {
      // Ein unerreichbarer Kalender (gelöscht, Zugriff entzogen) darf die
      // übrigen nicht mitreißen – sonst fiele die ganze Belegung weg.
      console.error(`Google Kalender "${calendarId}" nicht lesbar:`, err.message);
      continue;
    }

    for (const ev of res.data.items || []) {
      if (ev.status === 'cancelled') continue;
      // Als "Frei" markierte Termine blockieren nicht – so kann sie Notizen
      // im Kalender führen, ohne Buchungszeiten zu sperren.
      if (ev.transparency === 'transparent') continue;

      const startRaw = ev.start.dateTime || `${ev.start.date}T00:00:00`;
      const endRaw = ev.end.dateTime || `${ev.end.date}T23:59:59`;
      alle.push({
        start: new Date(startRaw),
        end: new Date(endRaw),
        source: 'google',
        calendarId,
        summary: ev.summary || 'Termin',
        googleEventId: ev.id,
      });
    }
  }

  return alle;
}

/**
 * Titel eines Termins. Der Status ist im Kalender sofort erkennbar, damit
 * Martina auf dem Handy eine offene Anfrage von einem zugesagten Termin
 * unterscheiden kann.
 */
function eventSummary(booking) {
  if (booking.is_block) return booking.message ? `Blockiert: ${booking.message}` : 'Blockiert';
  if (booking.status === 'confirmed') return `Kunsttherapie: ${booking.name}`;
  return `Anfrage: ${booking.name}`;
}

function eventBody(booking) {
  const timeZone = process.env.BOOKING_TIMEZONE || 'Europe/Berlin';
  return {
    summary: eventSummary(booking),
    description: [
      booking.is_block ? 'Über das Admin-Panel blockiert' : `Name: ${booking.name}`,
      booking.is_block ? null : `E-Mail: ${booking.email}`,
      booking.phone ? `Telefon: ${booking.phone}` : null,
      booking.message ? `Nachricht: ${booking.message}` : null,
      booking.status === 'pending' && !booking.is_block
        ? 'Noch nicht bestätigt – im Admin-Panel unter „Buchungen“ zusagen oder absagen.'
        : null,
      `Buchung #${booking.id} (Website)`,
    ]
      .filter(Boolean)
      .join('\n'),
    start: { dateTime: `${booking.date}T${booking.start_time}:00`, timeZone },
    end: { dateTime: `${booking.date}T${booking.end_time}:00`, timeZone },
  };
}

async function createCalendarEvent(refreshToken, booking) {
  const auth = buildOAuthClient(refreshToken);
  if (!auth) return null;

  const calendarId = writeCalendarId();
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.insert({
    calendarId,
    requestBody: eventBody(booking),
  });

  return res.data.id;
}

/**
 * Bestehenden Termin aktualisieren – aus „Anfrage: …“ wird beim Zusagen
 * „Kunsttherapie: …“, ohne den Eintrag zu löschen und neu anzulegen.
 */
async function updateCalendarEvent(refreshToken, eventId, booking) {
  if (!eventId) return null;
  const auth = buildOAuthClient(refreshToken);
  if (!auth) return null;

  const calendarId = writeCalendarId();
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const res = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: eventBody(booking),
    });
    return res.data.id;
  } catch (err) {
    // Wurde der Termin in Google von Hand gelöscht, neu anlegen statt scheitern.
    if (err.code === 404 || err.code === 410) {
      return createCalendarEvent(refreshToken, booking);
    }
    throw err;
  }
}

/**
 * Ganztägiger Eintrag für gesperrte Zeiträume (Urlaub). Google erwartet bei
 * ganztägigen Terminen ein Enddatum, das einen Tag NACH dem letzten Tag liegt.
 */
async function createAllDayEvent(refreshToken, { dateFrom, dateTo, summary, description }) {
  const auth = buildOAuthClient(refreshToken);
  if (!auth) return null;

  const calendarId = writeCalendarId();
  const calendar = google.calendar({ version: 'v3', auth });

  const endExclusive = new Date(`${dateTo}T00:00:00Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description: description || undefined,
      start: { date: dateFrom },
      end: { date: endExclusive.toISOString().slice(0, 10) },
      transparency: 'opaque',
    },
  });

  return res.data.id;
}

async function deleteCalendarEvent(refreshToken, eventId) {
  if (!eventId) return;
  const auth = buildOAuthClient(refreshToken);
  if (!auth) return;

  const calendarId = writeCalendarId();
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    await calendar.events.delete({ calendarId, eventId });
  } catch (err) {
    if (err.code !== 404) throw err;
  }
}

module.exports = {
  isConfigured,
  buildOAuthClient,
  getAuthUrl,
  getRefreshTokenFromCode,
  fetchBusyIntervals,
  createCalendarEvent,
  updateCalendarEvent,
  listCalendars,
  calendarIds,
  writeCalendarId,
  createAllDayEvent,
  deleteCalendarEvent,
  eventSummary,
};
