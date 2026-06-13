/**
 * Automatische SQLite-Backups via VACUUM INTO – erzeugt einen konsistenten
 * Snapshot (auch während Schreibzugriffen sicher) und hält die letzten N.
 */
const fs = require('fs');
const path = require('path');

function pruneOld(backupDir, keep) {
  try {
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => /^database-.*\.sqlite$/.test(f))
      .map((f) => ({ f, t: fs.statSync(path.join(backupDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    files.slice(keep).forEach(({ f }) => {
      try { fs.unlinkSync(path.join(backupDir, f)); } catch (_) { /* ignore */ }
    });
  } catch (_) { /* ignore */ }
}

// Letzter Backup-Status, damit Fehler nicht nur im Log verschwinden, sondern
// z. B. über /health sichtbar gemacht werden können.
let lastBackup = { at: null, ok: null, file: null, error: null };

function getLastBackup() {
  return { ...lastBackup };
}

function runBackup(db, dbPath, { dir, keep = 7 } = {}) {
  return new Promise((resolve) => {
    const fail = (msg) => {
      lastBackup = { at: new Date().toISOString(), ok: false, file: null, error: msg };
      console.error('DB-Backup fehlgeschlagen:', msg);
      resolve(null);
    };
    try {
      if (!dbPath || !fs.existsSync(dbPath)) return fail('DB-Datei nicht gefunden');
      const backupDir = dir || path.join(path.dirname(dbPath), 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const target = path.join(backupDir, `database-${stamp}.sqlite`);
      db.run('VACUUM INTO ?', [target], (err) => {
        if (err) return fail(err.message);
        pruneOld(backupDir, keep);
        lastBackup = { at: new Date().toISOString(), ok: true, file: path.basename(target), error: null };
        console.log(`DB-Backup erstellt: ${path.basename(target)}`);
        resolve(target);
      });
    } catch (e) {
      fail(e.message);
    }
  });
}

function scheduleBackups(db, dbPath, { intervalMs = 24 * 60 * 60 * 1000, keep = 7 } = {}) {
  runBackup(db, dbPath, { keep });
  const timer = setInterval(() => runBackup(db, dbPath, { keep }), intervalMs);
  if (timer.unref) timer.unref();
  return timer;
}

module.exports = { runBackup, scheduleBackups, pruneOld, getLastBackup };
