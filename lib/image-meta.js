/**
 * Bild-Metadaten (Maße) per sharp lesen – mit mtime-basiertem Cache,
 * damit wiederholte Admin-Listenaufrufe nicht jedes Bild neu parsen.
 */
const fs = require('fs');
const fsp = fs.promises;

let sharp = null;
try {
  sharp = require('sharp');
} catch (_) {
  sharp = null;
}

const DIM_EXT = /\.(jpe?g|png|gif|webp|svg)$/i;
const MAX_CACHE = 500;
const cache = new Map(); // filePath -> { mtimeMs, dim }

async function getDimensions(filePath) {
  if (!sharp || !filePath || !DIM_EXT.test(filePath)) return null;
  let stat;
  try {
    stat = await fsp.stat(filePath);
  } catch (_) {
    return null;
  }
  const cached = cache.get(filePath);
  if (cached && cached.mtimeMs === stat.mtimeMs) return cached.dim;

  let dim = null;
  try {
    const meta = await sharp(filePath).metadata();
    if (meta.width && meta.height) {
      dim = { width: meta.width, height: meta.height };
    }
  } catch (_) {
    dim = null;
  }
  // Cache begrenzen: ältesten Eintrag entfernen, wenn das Limit erreicht ist.
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(filePath, { mtimeMs: stat.mtimeMs, dim });
  return dim;
}

function fileType(filename) {
  const m = /\.([a-z0-9]+)$/i.exec(filename || '');
  return m ? m[1].toLowerCase() : '';
}

module.exports = { getDimensions, fileType };
