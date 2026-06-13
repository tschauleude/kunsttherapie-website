/**
 * Mediathek: Upload-Dateien unter /uploads/ auflisten und löschen.
 */
const fs = require('fs');
const path = require('path');
const imageMeta = require('./image-meta');

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
  const entries = fs
    .readdirSync(uploadDir, { withFileTypes: true })
    .filter((d) => d.isFile() && isImageFile(d.name));

  const files = await Promise.all(entries.map(async (d) => {
    const filePath = path.join(uploadDir, d.name);
    const stat = fs.statSync(filePath);
    const url = urlFromFilename(d.name);
    const usedBy = usage.get(url) || [];
    return {
      filename: d.name,
      url,
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
      type: imageMeta.fileType(d.name),
      dimensions: await imageMeta.getDimensions(filePath),
      inUse: usedBy.length > 0,
      usedBy,
    };
  }));

  files.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return files;
}

module.exports = {
  isImageFile,
  urlFromFilename,
  filenameFromUrl,
  listMedia,
  collectUsage,
};
