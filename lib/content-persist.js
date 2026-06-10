/**
 * Dauerhafte CMS-Inhalte: SQLite + JSON-Dateien + rotierende Backups.
 * Überlebt Deploys/Neustarts, solange data/ (und uploads/) erhalten bleiben.
 */
const fs = require('fs');
const path = require('path');

const i18nContent = require('./i18n-content');
const i18nPersist = require('./i18n-persist');
const siteImages = require('./site-images');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const SITE_IMAGES_FILE = path.join(DATA_DIR, 'site-images-overrides.json');
const BUNDLE_FILE = path.join(DATA_DIR, 'content-bundle.json');
const MAX_FILE_BACKUPS = 24;

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, payload) {
  ensureDirs();
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function fileMtimeIso(filePath) {
  try {
    return fs.statSync(filePath).mtime.toISOString();
  } catch {
    return null;
  }
}

async function captureSiteImagesPayload(dbGet, dbAll) {
  const rows = await dbAll(`SELECT slot, url, updatedAt FROM site_images ORDER BY slot`);
  const galleryCount = await siteImages.getGalleryCount(dbGet);
  const slots = {};
  for (const row of rows) {
    slots[row.slot] = { url: row.url, updatedAt: row.updatedAt || null };
  }
  return { slots, galleryCount };
}

async function captureBundle(dbGet, dbAll) {
  const [overrides, sitePayload] = await Promise.all([
    i18nContent.readOverrides(dbGet),
    captureSiteImagesPayload(dbGet, dbAll),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    i18n: { overrides },
    site_images: sitePayload,
  };
}

function writeSiteImagesFile(payload) {
  writeJsonFile(SITE_IMAGES_FILE, {
    slots: payload.slots || {},
    galleryCount: payload.galleryCount ?? siteImages.DEFAULT_GALLERY_COUNT,
    _meta: {
      updatedAt: new Date().toISOString(),
      hint: 'Wird beim Speichern im Admin automatisch aktualisiert. Für Deploys data/ sichern.',
    },
  });
}

function readSiteImagesFile() {
  const parsed = readJsonFile(SITE_IMAGES_FILE, null);
  if (!parsed || typeof parsed !== 'object') {
    return { slots: {}, galleryCount: siteImages.DEFAULT_GALLERY_COUNT };
  }
  return {
    slots: parsed.slots && typeof parsed.slots === 'object' ? parsed.slots : {},
    galleryCount: parsed.galleryCount ?? siteImages.DEFAULT_GALLERY_COUNT,
  };
}

function pruneFileBackups() {
  ensureDirs();
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((name) => name.startsWith('content-') && name.endsWith('.json'))
    .map((name) => ({
      name,
      path: path.join(BACKUP_DIR, name),
      mtime: fs.statSync(path.join(BACKUP_DIR, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  files.slice(MAX_FILE_BACKUPS).forEach((file) => {
    try {
      fs.unlinkSync(file.path);
    } catch (_) {
      /* ignore */
    }
  });
}

function writeTimestampedBackup(bundle) {
  ensureDirs();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(BACKUP_DIR, `content-${stamp}.json`);
  writeJsonFile(filePath, bundle);
  pruneFileBackups();
  return filePath;
}

/**
 * Nach Admin-Änderung: DB → JSON-Dateien + rotierendes Backup.
 */
async function persistAll(dbGet, dbAll, { writeBackup = true } = {}) {
  const bundle = await captureBundle(dbGet, dbAll);

  try {
    writeSiteImagesFile(bundle.site_images);
  } catch (e) {
    console.error('content-persist site-images file:', e.message);
  }

  try {
    writeJsonFile(BUNDLE_FILE, {
      ...bundle,
      _meta: {
        updatedAt: bundle.exportedAt,
        hint: 'Vollständiger CMS-Stand (Texte + Bilder). Automatisch bei Speichern aktualisiert.',
      },
    });
  } catch (e) {
    console.error('content-persist bundle file:', e.message);
  }

  let backupPath = null;
  if (writeBackup) {
    try {
      backupPath = writeTimestampedBackup(bundle);
    } catch (e) {
      console.error('content-persist backup file:', e.message);
    }
  }

  return { bundle, backupPath };
}

async function applySiteImagesPayload(dbGet, dbRun, dbAll, payload, uploadDir) {
  const slots = payload?.slots || {};
  await dbRun(`DELETE FROM site_images`);
  for (const [slot, data] of Object.entries(slots)) {
    if (!siteImages.getSlot(slot) || !data?.url) continue;
    await siteImages.setSlotUrl(dbGet, dbRun, slot, data.url, uploadDir);
  }
  if (payload?.galleryCount != null) {
    await siteImages.setGalleryCount(dbRun, payload.galleryCount);
  }
  return captureSiteImagesPayload(dbGet, dbAll);
}

async function seedSiteImagesFromFile(dbGet, dbRun, dbAll, uploadDir) {
  const fromFile = readSiteImagesFile();
  const hasFile = Object.keys(fromFile.slots).length > 0;
  if (!hasFile) return false;

  const row = await dbGet(`SELECT COUNT(*) AS count FROM site_images`);
  if (row?.count > 0) return false;

  await applySiteImagesPayload(dbGet, dbRun, dbAll, fromFile, uploadDir);
  return true;
}

async function syncFilesFromDatabase(dbGet, dbAll) {
  const dbPayload = await captureSiteImagesPayload(dbGet, dbAll);
  const filePayload = readSiteImagesFile();
  const dbHasData = Object.keys(dbPayload.slots).length > 0;
  const fileHasData = Object.keys(filePayload.slots).length > 0;

  if (dbHasData) {
    await persistAll(dbGet, dbAll, { writeBackup: false });
    return 'db_to_files';
  }

  if (fileHasData) {
    return 'files_ready';
  }

  return 'empty';
}

async function restoreBundle(dbGet, dbRun, dbAll, bundle, uploadDir) {
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('Ungültiges Backup');
  }

  if (bundle.i18n?.overrides) {
    await i18nContent.writeOverrides(dbRun, bundle.i18n.overrides);
  }

  if (bundle.site_images) {
    await applySiteImagesPayload(dbGet, dbRun, dbAll, bundle.site_images, uploadDir);
  }

  await persistAll(dbGet, dbAll, { writeBackup: true });
}

async function getStatus(dbGet, dbAll) {
  const [dbPayload, overrides] = await Promise.all([
    captureSiteImagesPayload(dbGet, dbAll),
    i18nContent.readOverrides(dbGet),
  ]);

  const i18nFile = readJsonFile(i18nPersist.OVERRIDES_FILE, { de: {}, en: {} });
  const siteFile = readSiteImagesFile();

  const i18nDbCount =
    Object.keys(overrides.de || {}).length + Object.keys(overrides.en || {}).length;
  const i18nFileCount =
    Object.keys(i18nFile.de || {}).length + Object.keys(i18nFile.en || {}).length;

  ensureDirs();
  const backups = fs
    .readdirSync(BACKUP_DIR)
    .filter((name) => name.startsWith('content-') && name.endsWith('.json'))
    .map((name) => ({
      name,
      updatedAt: fileMtimeIso(path.join(BACKUP_DIR, name)),
    }))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

  return {
    persistence: {
      texts: {
        database: i18nDbCount > 0,
        file: i18nFileCount > 0,
        filePath: 'data/i18n-overrides.json',
        fileUpdatedAt: fileMtimeIso(i18nPersist.OVERRIDES_FILE),
        keysDatabase: i18nDbCount,
        keysFile: i18nFileCount,
      },
      images: {
        database: Object.keys(dbPayload.slots).length > 0,
        file: Object.keys(siteFile.slots).length > 0,
        filePath: 'data/site-images-overrides.json',
        fileUpdatedAt: fileMtimeIso(SITE_IMAGES_FILE),
        slotsDatabase: Object.keys(dbPayload.slots).length,
        slotsFile: Object.keys(siteFile.slots).length,
        galleryCount: dbPayload.galleryCount,
      },
      bundle: {
        filePath: 'data/content-bundle.json',
        fileUpdatedAt: fileMtimeIso(BUNDLE_FILE),
      },
      backups: {
        directory: 'data/backups/',
        count: backups.length,
        latest: backups[0] || null,
      },
    },
  };
}

async function bootstrap(dbGet, dbRun, dbAll, uploadDir, contentVersions) {
  ensureDirs();

  const seededImages = await seedSiteImagesFromFile(dbGet, dbRun, dbAll, uploadDir);
  if (seededImages) {
    console.log('content-persist: Bilder aus data/site-images-overrides.json in die Datenbank übernommen');
  }

  const syncResult = await syncFilesFromDatabase(dbGet, dbAll);
  if (syncResult === 'db_to_files') {
    console.log('content-persist: JSON-Dateien aus Datenbank synchronisiert');
  }

  try {
    await persistAll(dbGet, dbAll, { writeBackup: false });
  } catch (e) {
    console.error('content-persist bootstrap export:', e.message);
  }

  if (contentVersions) {
    try {
      const rows = await dbAll(`SELECT COUNT(*) AS count FROM content_versions`);
      if (!rows[0]?.count) {
        const id = await contentVersions.createVersion(dbRun, {
          kind: 'content_bundle',
          label: 'Automatischer Start-Sicherungspunkt',
          snapshot: await contentVersions.captureBundle(dbGet, dbAll),
          createdBy: 'system',
          meta: { action: 'startup_seed' },
        });
        console.log(`content-persist: Erster Versions-Sicherungspunkt #${id} angelegt`);
      }
    } catch (e) {
      console.error('content-persist startup version:', e.message);
    }
  }
}

module.exports = {
  DATA_DIR,
  BACKUP_DIR,
  SITE_IMAGES_FILE,
  BUNDLE_FILE,
  captureBundle,
  persistAll,
  restoreBundle,
  seedSiteImagesFromFile,
  syncFilesFromDatabase,
  getStatus,
  bootstrap,
  readSiteImagesFile,
  writeTimestampedBackup,
};
