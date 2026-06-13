/**
 * Zentrales App-Secret: bevorzugt process.env.SESSION_SECRET, sonst ein
 * einmalig erzeugtes, dauerhaft in data/.session-secret (Modus 0600)
 * gespeichertes Zufalls-Secret. Wird für Session-Cookies UND für die
 * Signatur der Kalender-Token (ical.js) genutzt – kein hartcodiertes
 * Fallback-Secret mehr, damit Token nicht fälschbar sind.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
let cached = null;

function resolveAppSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (cached) return cached;

  const dataDir = path.join(ROOT, 'data');
  const secretFile = path.join(dataDir, '.session-secret');
  try {
    if (fs.existsSync(secretFile)) {
      const existing = fs.readFileSync(secretFile, 'utf8').trim();
      if (existing) {
        cached = existing;
        return cached;
      }
    }
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    cached = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(secretFile, cached, { mode: 0o600 });
    console.log('App-Secret generiert und in data/.session-secret gespeichert.');
    return cached;
  } catch (e) {
    console.error('App-Secret konnte nicht persistiert werden, nutze Laufzeit-Zufallswert:', e.message);
    cached = crypto.randomBytes(48).toString('hex');
    return cached;
  }
}

module.exports = { resolveAppSecret };
