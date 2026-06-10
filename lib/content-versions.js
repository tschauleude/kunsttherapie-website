/**
 * Versionierung für Website-Inhalte (Texte, Bilder) mit Wiederherstellung.
 */
const i18nContent = require('./i18n-content');
const siteImages = require('./site-images');
const contentPersist = require('./content-persist');

const MAX_VERSIONS = 80;
const KINDS = ['i18n', 'site_images', 'content_bundle'];

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function captureI18n(dbGet) {
  const overrides = await i18nContent.readOverrides(dbGet);
  return { overrides };
}

async function captureSiteImages(dbGet, dbAll) {
  const rows = await dbAll(`SELECT slot, url, updatedAt FROM site_images ORDER BY slot`);
  const galleryCount = await siteImages.getGalleryCount(dbGet);
  return { rows, galleryCount };
}

async function captureBundle(dbGet, dbAll) {
  const [i18n, images] = await Promise.all([
    captureI18n(dbGet),
    captureSiteImages(dbGet, dbAll),
  ]);
  return { i18n, site_images: images };
}

async function pruneOldVersions(dbRun) {
  await dbRun(
    `DELETE FROM content_versions WHERE id NOT IN (
      SELECT id FROM content_versions ORDER BY createdAt DESC, id DESC LIMIT ?
    )`,
    [MAX_VERSIONS]
  );
}

async function createVersion(dbRun, { kind, label, snapshot, createdBy = null, meta = null }) {
  if (!KINDS.includes(kind)) throw new Error('Unbekannte Versions-Art');
  const payload = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
  const result = await dbRun(
    `INSERT INTO content_versions (kind, label, snapshot, meta, createdBy)
     VALUES (?, ?, ?, ?, ?)`,
    [
      kind,
      String(label || kind).slice(0, 240),
      payload,
      meta ? JSON.stringify(meta) : null,
      createdBy,
    ]
  );
  await pruneOldVersions(dbRun);
  return result.lastID;
}

async function listVersions(dbAll, { kind, limit = 40 } = {}) {
  const safeLimit = Math.min(80, Math.max(1, Number.parseInt(limit, 10) || 40));
  if (kind && KINDS.includes(kind)) {
    return dbAll(
      `SELECT id, kind, label, createdBy, createdAt, meta
       FROM content_versions WHERE kind = ?
       ORDER BY createdAt DESC, id DESC LIMIT ?`,
      [kind, safeLimit]
    );
  }
  return dbAll(
    `SELECT id, kind, label, createdBy, createdAt, meta
     FROM content_versions
     ORDER BY createdAt DESC, id DESC LIMIT ?`,
    [safeLimit]
  );
}

async function getVersion(dbGet, id) {
  return dbGet(`SELECT * FROM content_versions WHERE id = ?`, [id]);
}

async function restoreI18n(dbGet, dbRun, snapshot) {
  const overrides = snapshot?.overrides;
  if (!overrides || typeof overrides !== 'object') {
    throw new Error('Ungültiger Text-Snapshot');
  }
  await i18nContent.writeOverrides(dbRun, overrides);
  return overrides;
}

async function restoreSiteImages(dbGet, dbRun, snapshot) {
  const rows = Array.isArray(snapshot?.rows) ? snapshot.rows : [];
  const galleryCount = snapshot?.galleryCount ?? siteImages.DEFAULT_GALLERY_COUNT;

  await dbRun(`DELETE FROM site_images`);
  for (const row of rows) {
    if (!row?.slot || !row?.url) continue;
    await dbRun(
      `INSERT INTO site_images (slot, url, updatedAt) VALUES (?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [row.slot, row.url, row.updatedAt || null]
    );
  }
  await siteImages.setGalleryCount(dbRun, galleryCount);
  return { rows, galleryCount };
}

async function restoreVersion(dbGet, dbRun, dbAll, id, { createdBy = null } = {}) {
  const row = await getVersion(dbGet, id);
  if (!row) throw new Error('Version nicht gefunden');

  const snapshot = parseJson(row.snapshot, null);
  if (!snapshot) throw new Error('Snapshot beschädigt');

  const before = await captureBundle(dbGet, dbAll);
  await createVersion(dbRun, {
    kind: 'content_bundle',
    label: `Vor Wiederherstellung (#${id})`,
    snapshot: before,
    createdBy,
    meta: { action: 'pre_restore', restoreOf: id },
  });

  if (row.kind === 'i18n') {
    await restoreI18n(dbGet, dbRun, snapshot);
    await contentPersist.persistAll(dbGet, dbAll, { writeBackup: true });
    return { kind: 'i18n', restored: true };
  }

  if (row.kind === 'site_images') {
    await restoreSiteImages(dbGet, dbRun, snapshot);
    await contentPersist.persistAll(dbGet, dbAll, { writeBackup: true });
    return { kind: 'site_images', restored: true };
  }

  if (row.kind === 'content_bundle') {
    if (snapshot.i18n) await restoreI18n(dbGet, dbRun, snapshot.i18n);
    if (snapshot.site_images) await restoreSiteImages(dbGet, dbRun, snapshot.site_images);
    await contentPersist.persistAll(dbGet, dbAll, { writeBackup: true });
    return { kind: 'content_bundle', restored: true };
  }

  throw new Error('Versionstyp nicht unterstützt');
}

async function snapshotBeforeChange(dbRun, dbGet, dbAll, { kind, label, createdBy, meta }) {
  let snapshot;
  if (kind === 'i18n') snapshot = await captureI18n(dbGet);
  else if (kind === 'site_images') snapshot = await captureSiteImages(dbGet, dbAll);
  else if (kind === 'content_bundle') snapshot = await captureBundle(dbGet, dbAll);
  else throw new Error('Unbekannte Versions-Art');

  const id = await createVersion(dbRun, { kind, label, snapshot, createdBy, meta });
  return id;
}

module.exports = {
  KINDS,
  MAX_VERSIONS,
  captureI18n,
  captureSiteImages,
  captureBundle,
  createVersion,
  listVersions,
  getVersion,
  restoreVersion,
  snapshotBeforeChange,
};
