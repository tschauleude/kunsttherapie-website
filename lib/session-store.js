'use strict';

/**
 * Sitzungsspeicher für express-session in der vorhandenen SQLite-Datenbank.
 *
 * Vorher lagen die Sitzungen nur im Arbeitsspeicher des Servers – das ist die
 * Voreinstellung von express-session. Jeder Neustart und damit jeder Deploy hat
 * angemeldete Benutzer deshalb hinausgeworfen, ohne dass das Admin-Panel das
 * bemerkt hätte: Die Oberfläche blieb offen stehen, und jede Aktion endete in
 * "Fehler: Unauthorized".
 *
 * Bewusst ohne zusätzliches Paket: Der Speicher benutzt dieselbe
 * Datenbankverbindung wie der Rest der Anwendung. Gespeichert wird nur, was
 * express-session übergibt – bei uns Benutzer-ID und Name, keine Passwörter.
 */

const session = require('express-session');

const TABELLE_SQL = `
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    laeuft_ab INTEGER NOT NULL,
    daten TEXT NOT NULL
  )
`;

const INDEX_SQL = `CREATE INDEX IF NOT EXISTS idx_sessions_laeuft_ab ON sessions (laeuft_ab)`;

/** Fällt eine Sitzung ohne eigene Lebensdauer an, gilt ein Tag. */
const STANDARD_LAUFZEIT_MS = 24 * 60 * 60 * 1000;

function ablaufZeitpunkt(sess) {
  const cookie = sess && sess.cookie;
  if (cookie) {
    if (cookie.expires) {
      const t = new Date(cookie.expires).getTime();
      if (Number.isFinite(t)) return t;
    }
    if (Number.isFinite(cookie.originalMaxAge)) return Date.now() + cookie.originalMaxAge;
    if (Number.isFinite(cookie.maxAge)) return Date.now() + cookie.maxAge;
  }
  return Date.now() + STANDARD_LAUFZEIT_MS;
}

/**
 * @param {import('sqlite3').Database} db  offene Datenbankverbindung
 * @param {{ aufraeumenAlleMs?: number }} [optionen]
 */
function erzeugeSessionStore(db, optionen = {}) {
  const aufraeumenAlleMs = Number.isFinite(optionen.aufraeumenAlleMs)
    ? optionen.aufraeumenAlleMs
    : 60 * 60 * 1000;

  class SqliteSessionStore extends session.Store {
    constructor() {
      super();
      // Die Anweisungen landen in der Warteschlange der Verbindung und laufen
      // vor allen späteren Abfragen – auch wenn die Datei noch geöffnet wird.
      db.run(TABELLE_SQL, (err) => {
        if (err) console.error('Sitzungstabelle anlegen:', err.message);
      });
      db.run(INDEX_SQL, () => {});
      this.abgelaufeneEntfernen();
      this.aufraeumer = setInterval(() => this.abgelaufeneEntfernen(), aufraeumenAlleMs);
      // Der Aufräumer darf den Prozess nicht am Beenden hindern.
      if (typeof this.aufraeumer.unref === 'function') this.aufraeumer.unref();
    }

    abgelaufeneEntfernen(cb = () => {}) {
      db.run(`DELETE FROM sessions WHERE laeuft_ab <= ?`, [Date.now()], (err) => cb(err || null));
    }

    get(sid, cb) {
      db.get(`SELECT daten, laeuft_ab FROM sessions WHERE sid = ?`, [sid], (err, row) => {
        if (err) return cb(err);
        if (!row) return cb(null, null);
        // Abgelaufenes gilt als nicht vorhanden – und fliegt gleich raus.
        if (row.laeuft_ab <= Date.now()) return this.destroy(sid, () => cb(null, null));
        let daten;
        try {
          daten = JSON.parse(row.daten);
        } catch (e) {
          return this.destroy(sid, () => cb(null, null));
        }
        cb(null, daten);
      });
    }

    set(sid, sess, cb = () => {}) {
      let daten;
      try {
        daten = JSON.stringify(sess);
      } catch (e) {
        return cb(e);
      }
      db.run(
        `INSERT OR REPLACE INTO sessions (sid, laeuft_ab, daten) VALUES (?, ?, ?)`,
        [sid, ablaufZeitpunkt(sess), daten],
        (err) => cb(err || null)
      );
    }

    /** Hält eine aktive Sitzung am Leben, ohne die Daten neu zu schreiben. */
    touch(sid, sess, cb = () => {}) {
      db.run(
        `UPDATE sessions SET laeuft_ab = ? WHERE sid = ?`,
        [ablaufZeitpunkt(sess), sid],
        (err) => cb(err || null)
      );
    }

    destroy(sid, cb = () => {}) {
      db.run(`DELETE FROM sessions WHERE sid = ?`, [sid], (err) => cb(err || null));
    }

    length(cb = () => {}) {
      db.get(`SELECT COUNT(*) AS anzahl FROM sessions WHERE laeuft_ab > ?`, [Date.now()], (err, row) => {
        if (err) return cb(err);
        cb(null, row ? row.anzahl : 0);
      });
    }

    clear(cb = () => {}) {
      db.run(`DELETE FROM sessions`, (err) => cb(err || null));
    }

    all(cb = () => {}) {
      db.all(`SELECT sid, daten FROM sessions WHERE laeuft_ab > ?`, [Date.now()], (err, rows) => {
        if (err) return cb(err);
        const alle = {};
        for (const row of rows || []) {
          try {
            alle[row.sid] = JSON.parse(row.daten);
          } catch (e) {
            // Unlesbare Zeile überspringen.
          }
        }
        cb(null, alle);
      });
    }
  }

  return new SqliteSessionStore();
}

module.exports = { erzeugeSessionStore, TABELLE_SQL, STANDARD_LAUFZEIT_MS };
