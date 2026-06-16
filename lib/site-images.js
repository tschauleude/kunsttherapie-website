/**
 * Feste Bild-Slots für die Website (Galerie, Hero, Portrait, Atelier).
 * Admin-Uploads landen unter /uploads/; Standard bleibt assets/img/.
 */

const SITE_IMAGE_SLOTS = [
  {
    slot: 'header.logo',
    label: 'Website-Logo (Header)',
    group: 'Header',
    defaultUrl: '/assets/img/logo.svg',
  },
  {
    slot: 'home.hero',
    label: 'Startseite – großes Bild oben (Hero)',
    group: 'Startseite',
    defaultUrl: '/assets/img/Gruppen-und-Einzeltherapie-768x524.jpg',
  },
  {
    slot: 'home.gallery.1',
    label: 'Galerie – Bild 1 (Material / Atelier)',
    group: 'Startseite – Galerie',
    defaultUrl: '/assets/img/galerie-material.jpg',
  },
  {
    slot: 'home.gallery.2',
    label: 'Galerie – Bild 2 (Kunst & Kreativität)',
    group: 'Startseite – Galerie',
    defaultUrl: '/assets/img/martina-malstudie.jpg',
  },
  {
    slot: 'home.gallery.3',
    label: 'Galerie – Bild 3 (Vision Board)',
    group: 'Startseite – Galerie',
    defaultUrl: '/assets/img/martina-vision-board.jpg',
  },
  {
    slot: 'home.gallery.4',
    label: 'Galerie – Bild 4 (Pastell / Gruppe)',
    group: 'Startseite – Galerie',
    defaultUrl: '/assets/img/martina-pastell-gruppe.jpg',
  },
  {
    slot: 'home.gallery.5',
    label: 'Galerie – Bild 5 (Atelier außen)',
    group: 'Startseite – Galerie',
    defaultUrl: '/assets/img/hero-atelier-aussen.jpg',
  },
  {
    slot: 'home.gallery.6',
    label: 'Galerie – Bild 6 (Abstraktes Aquarell)',
    group: 'Startseite – Galerie',
    defaultUrl: '/assets/img/galerie-abstrakt.jpg',
  },
  {
    slot: 'about.portrait',
    label: 'Über mich – Portraitfoto',
    group: 'Über mich',
    defaultUrl: '/assets/img/martina-portrait.jpg',
  },
  {
    slot: 'therapy.raum.eingang',
    label: 'Kunsttherapie – Atelier-Eingang (Vergleich links)',
    group: 'Kunsttherapie – Atelier',
    defaultUrl: '/assets/img/atelier-eingang.jpg',
  },
  {
    slot: 'therapy.raum.vision',
    label: 'Kunsttherapie – Stimmungsvision (Vergleich rechts)',
    group: 'Kunsttherapie – Atelier',
    defaultUrl: '/assets/img/atelier-eingang-vision.jpg',
  },
  {
    slot: 'therapy.raum.innen',
    label: 'Kunsttherapie – Atelier innen',
    group: 'Kunsttherapie – Atelier',
    defaultUrl: '/assets/img/Gruppen-und-Einzeltherapie-768x524.jpg',
  },
  {
    slot: 'therapy.raum.gestalten',
    label: 'Kunsttherapie – Gestalten / Kunstwerk',
    group: 'Kunsttherapie – Atelier',
    defaultUrl: '/assets/img/galerie-abstrakt.jpg',
  },
];

const GALLERY_MAX = 6;
const DEFAULT_GALLERY_COUNT = 6;
const GALLERY_COUNT_KEY = 'home.gallery.count';

const SLOT_MAP = Object.fromEntries(SITE_IMAGE_SLOTS.map((s) => [s.slot, s]));

function gallerySlots() {
  return SITE_IMAGE_SLOTS.filter((s) => s.slot.startsWith('home.gallery.'));
}

function clampGalleryCount(n) {
  const val = Number.parseInt(n, 10);
  if (!Number.isFinite(val)) return DEFAULT_GALLERY_COUNT;
  return Math.min(GALLERY_MAX, Math.max(1, val));
}

function getSlot(slot) {
  return SLOT_MAP[slot] || null;
}

function isCustomUpload(url) {
  return typeof url === 'string' && url.startsWith('/uploads/');
}

function uploadPathFromUrl(url, uploadDir) {
  if (!isCustomUpload(url)) return null;
  const rel = url.replace(/^\/uploads\//, '');
  return require('path').join(uploadDir, rel);
}

function safeUnlink(filePath) {
  const fs = require('fs');
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (_) {
      /* ignore */
    }
  }
}

async function readOverrides(dbAll) {
  const rows = await dbAll(`SELECT slot, url, alt_text, updatedAt FROM site_images`);
  return Object.fromEntries(rows.map((r) => [r.slot, r]));
}

async function getGalleryCount(dbGet) {
  const row = await dbGet(`SELECT value FROM settings WHERE key = ?`, [GALLERY_COUNT_KEY]);
  return clampGalleryCount(row?.value ?? DEFAULT_GALLERY_COUNT);
}

async function setGalleryCount(dbRun, count) {
  const safe = clampGalleryCount(count);
  await dbRun(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [
    GALLERY_COUNT_KEY,
    String(safe),
  ]);
  return safe;
}

async function getPublicImages(dbAll, dbGet) {
  const overrides = await readOverrides(dbAll);
  const images = {};
  const altTexts = {};
  for (const def of SITE_IMAGE_SLOTS) {
    const row = overrides[def.slot];
    images[def.slot] = row?.url || def.defaultUrl;
    if (row?.alt_text) altTexts[def.slot] = row.alt_text;
  }
  const galleryCount = dbGet ? await getGalleryCount(dbGet) : DEFAULT_GALLERY_COUNT;
  return { images, altTexts, galleryCount };
}

async function getAdminSlots(dbAll) {
  const overrides = await readOverrides(dbAll);
  return SITE_IMAGE_SLOTS.map((def) => {
    const row = overrides[def.slot];
    const customUrl = row?.url || null;
    return {
      slot: def.slot,
      label: def.label,
      group: def.group,
      defaultUrl: def.defaultUrl,
      url: customUrl || def.defaultUrl,
      customUrl,
      isCustom: Boolean(customUrl),
      altText: row?.alt_text || '',
      updatedAt: row?.updatedAt || null,
    };
  });
}

async function setSlotUrl(dbGet, dbRun, slot, url, uploadDir) {
  const def = getSlot(slot);
  if (!def) throw new Error('Unbekannter Bild-Slot');
  if (!url || typeof url !== 'string') throw new Error('Bild-URL fehlt');
  if (!url.startsWith('/uploads/') && !url.startsWith('/assets/')) {
    throw new Error('Ungültige Bild-URL');
  }

  const existing = await dbGet(`SELECT url FROM site_images WHERE slot = ?`, [slot]);
  if (existing?.url && existing.url !== url && isCustomUpload(existing.url)) {
    safeUnlink(uploadPathFromUrl(existing.url, uploadDir));
  }

  await dbRun(
    `INSERT INTO site_images (slot, url, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(slot) DO UPDATE SET url = excluded.url, updatedAt = CURRENT_TIMESTAMP`,
    [slot, url]
  );

  return { slot, url, isCustom: true };
}

async function setSlotAltText(dbRun, slot, altText) {
  const def = getSlot(slot);
  if (!def) throw new Error('Unbekannter Bild-Slot');
  const text = (altText || '').trim().slice(0, 500);
  await dbRun(
    `INSERT INTO site_images (slot, url, alt_text, updatedAt)
     VALUES (?, (SELECT COALESCE((SELECT url FROM site_images WHERE slot = ?), ?)), ?, CURRENT_TIMESTAMP)
     ON CONFLICT(slot) DO UPDATE SET alt_text = excluded.alt_text, updatedAt = CURRENT_TIMESTAMP`,
    [slot, slot, def.defaultUrl, text]
  );
  return { slot, altText: text };
}

async function resetSlot(dbGet, dbRun, slot, uploadDir) {
  const def = getSlot(slot);
  if (!def) throw new Error('Unbekannter Bild-Slot');

  const existing = await dbGet(`SELECT url FROM site_images WHERE slot = ?`, [slot]);
  if (existing?.url && isCustomUpload(existing.url)) {
    safeUnlink(uploadPathFromUrl(existing.url, uploadDir));
  }

  await dbRun(`DELETE FROM site_images WHERE slot = ?`, [slot]);
  return { slot, url: def.defaultUrl, isCustom: false };
}

module.exports = {
  SITE_IMAGE_SLOTS,
  GALLERY_MAX,
  DEFAULT_GALLERY_COUNT,
  getSlot,
  gallerySlots,
  getGalleryCount,
  setGalleryCount,
  getPublicImages,
  getAdminSlots,
  setSlotUrl,
  setSlotAltText,
  resetSlot,
};
