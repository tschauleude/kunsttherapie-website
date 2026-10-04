#!/usr/bin/env node
/**
 * Prüft alle Bildpfade aus der Datenbank gegen das Dateisystem.
 *   npm run check-media
 *
 * Hintergrund: Ein im Admin-Panel hochgeladenes Bild steht in der Datenbank,
 * die Datei liegt aber unter public/uploads. Verschwindet sie – etwa weil ein
 * Deployment das Verzeichnis neu anlegt –, zeigt die Website ein kaputtes Bild
 * statt des Standardbilds. Dieses Skript findet solche Lücken, bevor es
 * jemandem auf der Seite auffällt.
 *
 * Exit-Code 0 = alles vorhanden, 1 = mindestens eine Datei fehlt.
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const ROOT = path.join(__dirname, '..');
const DB_PATH = process.env.DATABASE_PATH || path.join(ROOT, 'database.sqlite');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(ROOT, 'public', 'uploads');

const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const bad = (m) => console.log('  \x1b[31m✗\x1b[0m ' + m);
const info = (m) => console.log('    ' + m);

function pfadZuDatei(url) {
  if (typeof url !== 'string' || !url) return null;
  const sauber = url.split('?')[0];
  if (sauber.includes('..')) return null;
  if (sauber.startsWith('/uploads/')) return path.join(UPLOAD_DIR, sauber.slice('/uploads/'.length));
  if (sauber.startsWith('/assets/') || sauber.startsWith('assets/')) {
    return path.join(ROOT, sauber.replace(/^\//, ''));
  }
  return null; // externe Adresse – nicht prüfbar
}

const ABFRAGEN = [
  { tabelle: 'site_images', sql: 'SELECT slot AS ref, url FROM site_images', was: 'Website-Bild' },
  { tabelle: 'news', sql: "SELECT id AS ref, image AS url FROM news WHERE image IS NOT NULL AND image != ''", was: 'Neuigkeit' },
  { tabelle: 'events', sql: "SELECT id AS ref, image AS url FROM events WHERE image IS NOT NULL AND image != ''", was: 'Veranstaltung' },
  { tabelle: 'flyers', sql: "SELECT id AS ref, url FROM flyers WHERE url IS NOT NULL AND url != ''", was: 'Flyer' },
  { tabelle: 'atelier_submissions', sql: "SELECT id AS ref, ('/uploads/' || image_path) AS url FROM atelier_submissions WHERE image_path IS NOT NULL AND image_path != ''", was: 'Mini-Atelier' },
];

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Datenbank nicht lesbar: ' + err.message);
    console.error('Pfad: ' + DB_PATH);
    process.exit(1);
  }
});

const alle = (sql) =>
  new Promise((resolve) => db.all(sql, (err, rows) => resolve(err ? { fehler: err.message } : rows)));

(async () => {
  console.log('\nBilder und Dateien aus der Datenbank prüfen');
  console.log('  Datenbank: ' + DB_PATH);
  console.log('  Uploads:   ' + UPLOAD_DIR + '\n');

  let fehlend = 0;
  let geprueft = 0;

  for (const { tabelle, sql, was } of ABFRAGEN) {
    const rows = await alle(sql);
    if (rows && rows.fehler) {
      info(`${was}: Tabelle "${tabelle}" nicht lesbar (${rows.fehler}) – übersprungen`);
      continue;
    }
    if (!rows.length) {
      info(`${was}: keine Einträge`);
      continue;
    }

    const kaputt = [];
    for (const row of rows) {
      const datei = pfadZuDatei(row.url);
      if (!datei) continue; // externe Adresse
      geprueft += 1;
      if (!fs.existsSync(datei)) kaputt.push(row);
    }

    if (kaputt.length) {
      bad(`${was}: ${kaputt.length} von ${rows.length} Datei(en) fehlen`);
      kaputt.forEach((r) => info(`· ${r.ref} → ${r.url}`));
      fehlend += kaputt.length;
    } else {
      ok(`${was}: alle ${rows.length} Datei(en) vorhanden`);
    }
  }

  db.close();
  console.log('');
  if (fehlend) {
    console.log(`Ergebnis: \x1b[31m${fehlend} fehlende Datei(en)\x1b[0m von ${geprueft} geprüften.`);
    console.log('Website-Bilder fallen automatisch auf das Standardbild zurück.');
    console.log('Im Admin-Panel unter „Bilder" sind die betroffenen Slots markiert.\n');
    process.exit(1);
  }
  console.log(`Ergebnis: \x1b[32malle ${geprueft} Dateien vorhanden\x1b[0m\n`);
})();
