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

function getAuthUrl() {
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

async function fetchBusyIntervals(refreshToken, timeMin, timeMax) {
  const auth = buildOAuthClient(refreshToken);
  if (!auth) return [];

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (res.data.items || [])
    .filter((ev) => ev.status !== 'cancelled')
    .map((ev) => {
      const startRaw = ev.start.dateTime || `${ev.start.date}T00:00:00`;
      const endRaw = ev.end.dateTime || `${ev.end.date}T23:59:59`;
      return {
        start: new Date(startRaw),
        end: new Date(endRaw),
        source: 'google',
        summary: ev.summary || 'Termin',
        googleEventId: ev.id,
      };
    });
}

async function createCalendarEvent(refreshToken, booking) {
  const auth = buildOAuthClient(refreshToken);
  if (!auth) return null;

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const calendar = google.calendar({ version: 'v3', auth });

  const timeZone = process.env.BOOKING_TIMEZONE || 'Europe/Berlin';
  const start = `${booking.date}T${booking.start_time}:00`;
  const end = `${booking.date}T${booking.end_time}:00`;

  const event = {
    summary: `Kunsttherapie: ${booking.name}`,
    description: [
      `Name: ${booking.name}`,
      `E-Mail: ${booking.email}`,
      booking.phone ? `Telefon: ${booking.phone}` : null,
      booking.message ? `Nachricht: ${booking.message}` : null,
      `Buchung #${booking.id} (Website)`,
    ]
      .filter(Boolean)
      .join('\n'),
    start: { dateTime: start, timeZone },
    end: { dateTime: end, timeZone },
  };

  const res = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return res.data.id;
}

async function deleteCalendarEvent(refreshToken, eventId) {
  if (!eventId) return;
  const auth = buildOAuthClient(refreshToken);
  if (!auth) return;

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
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
  deleteCalendarEvent,
};
