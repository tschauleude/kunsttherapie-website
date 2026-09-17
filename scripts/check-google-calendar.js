#!/usr/bin/env node
/**
 * Diagnose der Google-Kalender-Anbindung.
 *   node scripts/check-google-calendar.js
 *
 * Prüft der Reihe nach: .env-Zugangsdaten, gespeicherter Refresh-Token und ein
 * echter Lesezugriff auf den Kalender. Der letzte Punkt ist der entscheidende –
 * die Website behandelt einen Fehler beim Kalenderabruf still als "keine
 * Termine" und zeigt dann alle Slots als frei an.
 *
 * Exit-Code 0 = alles in Ordnung, 1 = Problem gefunden.
 */
require('dotenv').config();

const path = require('path');
const sqlite3 = require('sqlite3');
const googleCalendar = require(path.join(__dirname, '..', 'lib', 'google-calendar'));

const ROOT = path.join(__dirname, '..');
const DB_PATH = process.env.DATABASE_PATH || path.join(ROOT, 'database.sqlite');

const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const bad = (m) => console.log('  \x1b[31m✗\x1b[0m ' + m);
const info = (m) => console.log('    ' + m);

function readToken() {
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    return Promise.resolve({ token: process.env.GOOGLE_REFRESH_TOKEN, quelle: '.env' });
  }
  return new Promise((resolve) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) return resolve({ token: null, quelle: null, fehler: err.message });
    });
    db.get(`SELECT value FROM settings WHERE key = 'google_refresh_token'`, (err, row) => {
      db.close();
      if (err) return resolve({ token: null, quelle: null, fehler: err.message });
      resolve({ token: row ? row.value : null, quelle: row ? 'Datenbank' : null });
    });
  });
}

(async () => {
  let problem = false;
  console.log('\nGoogle-Kalender – Diagnose\n');

  // 1) Zugangsdaten
  console.log('1. Zugangsdaten in der .env');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  if (clientId) ok('GOOGLE_CLIENT_ID gesetzt (…' + clientId.slice(-28) + ')');
  else { bad('GOOGLE_CLIENT_ID fehlt'); problem = true; }

  if (clientSecret) ok('GOOGLE_CLIENT_SECRET gesetzt (' + clientSecret.length + ' Zeichen)');
  else { bad('GOOGLE_CLIENT_SECRET fehlt'); problem = true; }

  if (redirectUri) {
    ok('GOOGLE_REDIRECT_URI: ' + redirectUri);
    if (!/\/api\/admin\/google\/callback$/.test(redirectUri)) {
      bad('Die URI endet nicht auf /api/admin/google/callback – Google bricht mit redirect_uri_mismatch ab');
      problem = true;
    }
  } else {
    bad('GOOGLE_REDIRECT_URI fehlt – es gilt der localhost-Standard, der in Produktion nicht funktioniert');
    problem = true;
  }
  info('Kalender: ' + calendarId);

  if (!clientId || !clientSecret) {
    console.log('\nOhne Client-ID und Secret kann nicht weitergeprüft werden.');
    console.log('Siehe docs/08-google-kalender.md, Schritt 5.\n');
    process.exit(1);
  }

  // 2) Refresh-Token
  console.log('\n2. Gespeicherter Zugang');
  const { token, quelle, fehler } = await readToken();
  if (fehler) { bad('Datenbank nicht lesbar: ' + fehler); info('DB-Pfad: ' + DB_PATH); process.exit(1); }
  if (!token) {
    bad('Kein Refresh-Token vorhanden – der Kalender ist noch nicht verbunden');
    info('Admin-Panel → Buchungen → „Mit Google verbinden"');
    console.log('');
    process.exit(1);
  }
  ok('Refresh-Token vorhanden (Quelle: ' + quelle + ')');

  // 3) Echter Zugriff – das ist der Punkt, der zählt
  console.log('\n3. Echter Zugriff auf den Kalender');
  const von = new Date();
  const bis = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  try {
    const busy = await googleCalendar.fetchBusyIntervals(token, von, bis);
    ok('Zugriff erfolgreich – ' + busy.length + ' Termin(e) in den nächsten 14 Tagen gelesen');
    busy.slice(0, 5).forEach((b) => {
      info('· ' + b.start.toLocaleString('de-DE') + '  ' + (b.summary || 'ohne Titel'));
    });
    if (busy.length > 5) info('… und ' + (busy.length - 5) + ' weitere');
    if (busy.length === 0) {
      info('Hinweis: 0 Termine kann richtig sein – zum echten Beweis einen Testtermin');
      info('am nächsten Di 11:00 oder Do 18:00 anlegen und erneut prüfen.');
    }
  } catch (e) {
    bad('Zugriff fehlgeschlagen: ' + e.message);
    problem = true;
    const m = String(e.message || '');
    if (/invalid_client/i.test(m)) {
      info('→ Client-ID oder Secret stimmen nicht. Werte in der .env mit denen in der');
      info('  Google Cloud Console (APIs & Dienste → Anmeldedaten) abgleichen und');
      info('  danach den Server neu starten: pm2 restart kunsttherapie');
    } else if (/invalid_grant/i.test(m)) {
      info('→ Der Token ist abgelaufen oder wurde widerrufen. Häufigste Ursache:');
      info('  Die OAuth-App steht in Google auf „Testing" – dort verfallen Token');
      info('  nach 7 Tagen. Status auf „Produktion" setzen und neu verbinden.');
    } else if (/not ?found/i.test(m)) {
      info('→ Kalender „' + calendarId + '" nicht gefunden. GOOGLE_CALENDAR_ID prüfen.');
    } else if (/insufficient|forbidden|403/i.test(m)) {
      info('→ Fehlende Berechtigung. Beim Verbinden muss der Kalenderzugriff erlaubt werden.');
    }
    info('');
    info('WICHTIG: Solange dieser Fehler besteht, zeigt die Website ALLE Zeiten');
    info('als frei an – Termine aus dem Kalender blockieren nichts. Doppelbuchungen');
    info('sind dann möglich.');
  }

  console.log('');
  if (problem) {
    console.log('Ergebnis: \x1b[31mProblem gefunden\x1b[0m – Details siehe oben, Hilfe in docs/08-google-kalender.md\n');
    process.exit(1);
  }
  console.log('Ergebnis: \x1b[32mVerbindung funktioniert\x1b[0m\n');
})();
