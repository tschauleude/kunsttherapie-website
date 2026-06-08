/**
 * Mediathek: Upload-Dateien unter /uploads/ auflisten und löschen.
 */
const fs = require('fs');
const path = require('path');

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

function isImageFile(name) {
  return IMAGE_EXT.test(name);
}

function urlFromFilename(filename) {
  return `/uploads/${filename}`;
}

function filenameFromUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return null;
  const name = path.basename(url);
  if (!name || name.includes('..')) return null;
  return name;
}

function addUsage(map, url, type, ref) {
  if (!url || !url.startsWith('/uploads/')) return;
  if (!map.has(url)) map.set(url, []);
  map.get(url).push({ type, ref: String(ref) });
}

async function collectUsage(dbAll) {
  const usage = new Map();

  const siteRows = await dbAll(`SELECT slot, url FROM site_images`);
  siteRows.forEach((r) => addUsage(usage, r.url, 'site', r.slot));

  const newsRows = await dbAll(`SELECT id, title, image FROM news WHERE image IS NOT NULL AND image != ''`);
  newsRows.forEach((r) => addUsage(usage, r.image, 'news', r.id));

  const eventRows = await dbAll(`SELECT id, title, image FROM events WHERE image IS NOT NULL AND image != ''`);
  eventRows.forEach((r) => addUsage(usage, r.image, 'events', r.id));

  return usage;
}

async function listMedia(uploadDir, dbAll) {
  if (!fs.existsSync(uploadDir)) return [];

  const usage = await collectUsage(dbAll);
  const files = fs
    .readdirSync(uploadDir, { withFileTypes: true })
    .filter((d) => d.isFile() && isImageFile(d.name))
    .map((d) => {
      const filePath = path.join(uploadDir, d.name);
      const stat = fs.statSync(filePath);
      const url = urlFromFilename(d.name);
      const usedBy = usage.get(url) || [];
      return {
        filename: d.name,
        url,
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
        inUse: usedBy.length > 0,
        usedBy,
      };
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return files;
}

async function deleteMediaFile(filename, uploadDir, dbAll, { force = false } = {}) {
  if (!filename || filename.includes('..') || filename.includes('/')) {
    throw new Error('Ungültiger Dateiname');
  }
  if (!isImageFile(filename)) throw new Error('Nur Bilddateien können gelöscht werden');

  const url = urlFromFilename(filename);
  const usage = await collectUsage(dbAll);
  const usedBy = usage.get(url) || [];

  if (usedBy.length && !force) {
    const refs = usedBy.map((u) => `${u.type}:${u.ref}`).join(', ');
    throw new Error(`Datei wird noch verwendet (${refs}). Zuerst Zuweisung entfernen.`);
  }

  if (force && usedBy.length) {
    for (const u of usedBy) {
      if (u.type === 'site') {
        await dbAll; // noop – reset via siteImages in caller
      }
    }
  }

  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) throw new Error('Datei nicht gefunden');
  fs.unlinkSync(filePath);
  return { filename, url, deleted: true };
}

module.exports = {
  isImageFile,
  urlFromFilename,
  filenameFromUrl,
  listMedia,
  collectUsage,
  deleteMediaFile,
};
