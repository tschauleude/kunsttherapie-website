/**
 * Hochgeladene Bilder serverseitig verkleinern und neu komprimieren.
 *
 * Ohne diesen Schritt geht eine Datei unverändert an jeden Besucher – ein Foto
 * direkt aus der Handy-Kamera sind schnell 4–8 MB.
 *
 * Bewusste Entscheidungen:
 * - `.rotate()` VOR dem Verwerfen der Metadaten. Handy-Fotos speichern ihre
 *   Ausrichtung in den EXIF-Daten; würden die einfach entfernt, lägen Hochkant-
 *   Aufnahmen anschließend auf der Seite.
 * - Das Format bleibt erhalten (JPG bleibt JPG). Eine Umwandlung nach WebP
 *   spart mehr, würde aber die Dateiendung und damit gespeicherte URLs ändern.
 * - GIFs werden nicht angefasst – eine Animation ginge dabei verloren.
 * - Kleinere Bilder werden nicht hochskaliert.
 * - Schlägt etwas fehl, bleibt die Originaldatei liegen. Ein misslungener
 *   Optimierungsversuch darf den Upload nie scheitern lassen.
 */
const fs = require('fs');
const path = require('path');

let sharp = null;
try {
  sharp = require('sharp');
} catch (_) {
  sharp = null;
}

const MAX_WIDTH = parseInt(process.env.UPLOAD_MAX_WIDTH || '1600', 10);
const MAX_HEIGHT = parseInt(process.env.UPLOAD_MAX_HEIGHT || '1600', 10);
const QUALITY = parseInt(process.env.UPLOAD_QUALITY || '82', 10);

function isAvailable() {
  return Boolean(sharp);
}

async function optimizeUpload(filePath) {
  const result = { optimized: false, beforeBytes: null, afterBytes: null, width: null, height: null, reason: null };
  if (!sharp) {
    result.reason = 'sharp nicht verfügbar';
    return result;
  }
  if (!filePath || !fs.existsSync(filePath)) {
    result.reason = 'Datei nicht gefunden';
    return result;
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.gif') {
    result.reason = 'GIF wird nicht verändert (Animation bliebe sonst auf der Strecke)';
    return result;
  }

  const tmpPath = `${filePath}.opt`;
  try {
    result.beforeBytes = fs.statSync(filePath).size;
    const meta = await sharp(filePath).metadata();

    let pipeline = sharp(filePath)
      // Erst drehen, dann Metadaten fallen lassen – sonst kippen Handy-Fotos.
      .rotate();

    if ((meta.width && meta.width > MAX_WIDTH) || (meta.height && meta.height > MAX_HEIGHT)) {
      pipeline = pipeline.resize({
        width: MAX_WIDTH,
        height: MAX_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (ext === '.png') {
      pipeline = pipeline.png({ compressionLevel: 9, palette: true });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: QUALITY });
    } else {
      pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
    }

    const out = await pipeline.toBuffer({ resolveWithObject: true });

    // Nur übernehmen, wenn wirklich etwas gewonnen ist. Bei bereits gut
    // optimierten Dateien kann das Neucodieren sonst sogar größer werden.
    if (out.data.length >= result.beforeBytes && !meta.orientation) {
      result.reason = 'Original war bereits kompakt genug';
      result.afterBytes = result.beforeBytes;
      result.width = meta.width || null;
      result.height = meta.height || null;
      return result;
    }

    fs.writeFileSync(tmpPath, out.data);
    fs.renameSync(tmpPath, filePath);

    result.optimized = true;
    result.afterBytes = out.data.length;
    result.width = out.info.width;
    result.height = out.info.height;
    return result;
  } catch (e) {
    result.reason = e.message;
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch (_) {
      /* ignore */
    }
    return result;
  }
}

/** Ergebnis für das Serverlog aufbereiten. */
function describe(filename, r) {
  const kb = (n) => (n == null ? '?' : `${Math.round(n / 1024)} KB`);
  if (r.optimized) {
    const saved = r.beforeBytes ? Math.round((1 - r.afterBytes / r.beforeBytes) * 100) : 0;
    return `Bild optimiert: ${filename} ${kb(r.beforeBytes)} → ${kb(r.afterBytes)} (−${saved}%), ${r.width}×${r.height}`;
  }
  return `Bild unverändert: ${filename} (${r.reason})`;
}

module.exports = { optimizeUpload, isAvailable, describe, MAX_WIDTH, MAX_HEIGHT };
