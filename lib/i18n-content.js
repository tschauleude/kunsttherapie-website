/**
 * Kuratierte Website-Texte für Admin-Bearbeitung + Defaults aus i18n-JS.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const JS_DIR = path.join(ROOT, 'assets/js');
const SETTINGS_KEY = 'i18n_overrides';

/** @type {{ id: string, title: string, description?: string, fields: { key: string, label: string, hint?: string, html?: boolean }[] }[]} */
const CATALOG = [
  {
    id: 'home',
    title: 'Startseite',
    description: 'Hero, Zielgruppen, Leistungen, Vertrauen, Atelier-Teaser',
    fields: [
      { key: 'home.hero.kicker', label: 'Hero – Kicker' },
      { key: 'home.hero.titleHtml', label: 'Hero – Überschrift', html: true, hint: 'Akzent: <span class="text-accent">…</span>' },
      { key: 'home.hero.lead', label: 'Hero – emotionaler Satz' },
      { key: 'home.hero.sub', label: 'Hero – Einleitung', html: true },
      { key: 'home.hero.note', label: 'Hero – Hinweis unten' },
      { key: 'home.audience.title', label: 'Zielgruppen – Überschrift' },
      { key: 'home.audience.privat', label: 'Karte Privat – Titel' },
      { key: 'home.audience.privat.desc', label: 'Karte Privat – Text' },
      { key: 'home.audience.firmen', label: 'Karte Unternehmen – Titel' },
      { key: 'home.audience.firmen.desc', label: 'Karte Unternehmen – Text' },
      { key: 'home.audience.klinik', label: 'Karte Kliniken – Titel' },
      { key: 'home.audience.klinik.desc', label: 'Karte Kliniken – Text' },
      { key: 'home.services.title', label: 'Leistungen – Überschrift' },
      { key: 'home.services.di.title', label: 'Dienstag – Titel' },
      { key: 'home.services.di.text', label: 'Dienstag – Text' },
      { key: 'home.services.do.title', label: 'Donnerstag – Titel' },
      { key: 'home.services.do.text', label: 'Donnerstag – Text' },
      { key: 'home.services.priceHint', label: 'Leistungen – Preis-Hinweis' },
      { key: 'home.trust.title', label: 'Vertrauen – Überschrift' },
      { key: 'home.trust.text', label: 'Vertrauen – Text' },
      { key: 'home.proof.title', label: 'Stimmen – Überschrift' },
      { key: 'home.proof.sub', label: 'Stimmen – Untertitel' },
      { key: 'home.proof.1.text', label: 'Stimme 1 – Zitat' },
      { key: 'home.proof.1.author', label: 'Stimme 1 – Autor' },
      { key: 'home.proof.2.text', label: 'Stimme 2 – Zitat' },
      { key: 'home.proof.2.author', label: 'Stimme 2 – Autor' },
      { key: 'home.proof.3.text', label: 'Stimme 3 – Zitat' },
      { key: 'home.proof.3.author', label: 'Stimme 3 – Autor' },
      { key: 'home.proof.partners', label: 'Stimmen – Kooperationen' },
      { key: 'home.praxis.title', label: 'Atelier-Block – Überschrift' },
      { key: 'home.praxis.sub', label: 'Atelier-Block – Text' },
      { key: 'home.gallery.title', label: 'Galerie – Überschrift' },
      { key: 'home.gallery.sub', label: 'Galerie – Untertitel' },
      { key: 'home.gallery.img1.alt', label: 'Galerie – Bild 1 Alt-Text' },
      { key: 'home.gallery.img2.alt', label: 'Galerie – Bild 2 Alt-Text' },
      { key: 'home.gallery.img3.alt', label: 'Galerie – Bild 3 Alt-Text' },
      { key: 'home.gallery.img4.alt', label: 'Galerie – Bild 4 Alt-Text' },
      { key: 'home.gallery.img5.alt', label: 'Galerie – Bild 5 Alt-Text' },
      { key: 'home.gallery.img6.alt', label: 'Galerie – Bild 6 Alt-Text' },
    ],
  },
  {
    id: 'therapy',
    title: 'Kunsttherapie & Angebote',
    description: 'Hero, fünf Angebote, Atelier, Abschluss-CTA (FAQs → eigener Bereich „FAQ“)',
    fields: [
      { key: 'kt.hero.kicker', label: 'Hero – Kicker' },
      { key: 'kt.hero.title', label: 'Hero – Überschrift', html: true },
      { key: 'kt.hero.sub', label: 'Hero – Einleitung' },
      { key: 'kt.audience', label: 'Zielgruppen-Zeile' },
      { key: 'kt.offers.title', label: 'Angebote – Überschrift' },
      { key: 'kt.offers.sub', label: 'Angebote – Untertitel' },
      { key: 'offer.1.title', label: 'Angebot 1 – Titel' },
      { key: 'offer.1.teaser', label: 'Angebot 1 – Teaser' },
      { key: 'offer.1.body', label: 'Angebot 1 – Details', html: true },
      { key: 'offer.2.title', label: 'Angebot 2 – Titel' },
      { key: 'offer.2.teaser', label: 'Angebot 2 – Teaser' },
      { key: 'offer.2.body', label: 'Angebot 2 – Details', html: true },
      { key: 'offer.3.title', label: 'Angebot 3 – Titel' },
      { key: 'offer.3.teaser', label: 'Angebot 3 – Teaser' },
      { key: 'offer.3.body', label: 'Angebot 3 – Details', html: true },
      { key: 'offer.4.title', label: 'Angebot 4 – Titel' },
      { key: 'offer.4.teaser', label: 'Angebot 4 – Teaser' },
      { key: 'offer.4.body', label: 'Angebot 4 – Details', html: true },
      { key: 'offer.5.title', label: 'Angebot 5 – Titel' },
      { key: 'offer.5.teaser', label: 'Angebot 5 – Teaser' },
      { key: 'offer.5.body', label: 'Angebot 5 – Details', html: true },
      { key: 'kt.effects.title', label: 'Wirkung – Überschrift' },
      { key: 'kt.effects.sub', label: 'Wirkung – Untertitel' },
      { key: 'kt.praxis.title', label: 'Atelier – Überschrift' },
      { key: 'kt.praxis.sub', label: 'Atelier – Einleitung', html: true },
      { key: 'kt.praxis.headline', label: 'Atelier – Headline' },
      { key: 'kt.praxis.p1', label: 'Atelier – Absatz 1', html: true },
      { key: 'kt.praxis.p2', label: 'Atelier – Absatz 2', html: true },
      { key: 'kt.highlight1.title', label: 'Highlight 1 – Titel' },
      { key: 'kt.highlight1.text', label: 'Highlight 1 – Text' },
      { key: 'kt.highlight2.title', label: 'Highlight 2 – Titel' },
      { key: 'kt.highlight2.text', label: 'Highlight 2 – Text' },
      { key: 'kt.highlight3.title', label: 'Highlight 3 – Titel' },
      { key: 'kt.highlight3.text', label: 'Highlight 3 – Text' },
      { key: 'kt.highlight4.title', label: 'Highlight 4 – Titel' },
      { key: 'kt.highlight4.text', label: 'Highlight 4 – Text', html: true },
      { key: 'kt.cta.title', label: 'Abschluss – Überschrift' },
      { key: 'kt.cta.sub', label: 'Abschluss – Text' },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ (Kunsttherapie)',
    description:
      'Alle 12 Fragen & Antworten im FAQ-Bereich auf kunsttherapie.html – Änderungen sind sofort sichtbar (Seite neu laden).',
    fields: [
      { key: 'kt.effects.title', label: 'Bereich – Überschrift' },
      { key: 'kt.effects.sub', label: 'Bereich – Untertitel' },
      ...Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const faqHint =
          'HTML erlaubt: Absätze <p>…</p>, Listen <ul><li>…</li></ul>, Hervorhebung <strong>…</strong>';
        return [
          { key: `kt.faq${n}.q`, label: `FAQ ${n} – Frage` },
          { key: `kt.faq${n}.a`, label: `FAQ ${n} – Antwort`, html: true, hint: faqHint },
        ];
      }).flat(),
    ],
  },
  {
    id: 'about',
    title: 'Über mich',
    fields: [
      { key: 'about.kicker', label: 'Kicker unter dem Namen' },
      { key: 'about.name', label: 'Name – Hauptüberschrift (H1)' },
      { key: 'about.intro', label: 'Einleitung' },
      { key: 'about.journey.title', label: 'Mein Weg – Überschrift' },
      { key: 'about.journey.p1', label: 'Mein Weg – Absatz 1' },
      { key: 'about.journey.p2', label: 'Mein Weg – Absatz 2' },
      { key: 'about.passion.title', label: 'Leidenschaft – Überschrift' },
      { key: 'about.passion.p1', label: 'Leidenschaft – Absatz 1' },
      { key: 'about.passion.p2', label: 'Leidenschaft – Absatz 2' },
      { key: 'about.quote', label: 'Zitat' },
      { key: 'about.qual.title', label: 'Qualifikationen – Überschrift' },
      { key: 'about.qual.list', label: 'Qualifikationen – Liste', html: true, hint: 'Als HTML-Liste (<ul><li>…</li></ul>)' },
    ],
  },
  {
    id: 'prices',
    title: 'Preise',
    fields: [
      { key: 'prices.title', label: 'Überschrift' },
      { key: 'prices.sub', label: 'Einleitung' },
      { key: 'prices.tableBody', label: 'Preistabelle', html: true, hint: 'Tabellenzeilen als <tr><td>…</td></tr>' },
      { key: 'prices.onRequest', label: 'Hinweis zu „auf Anfrage“' },
      { key: 'prices.unit', label: 'Hinweis unter der Tabelle (pro Person & Sitzung)' },
      { key: 'prices.note', label: 'Hinweis unten' },
    ],
  },
  {
    id: 'contact',
    title: 'Kontakt',
    fields: [
      { key: 'contact.title', label: 'Überschrift' },
      { key: 'contact.sub', label: 'Einleitung', html: true },
      { key: 'contact.hours', label: 'Atelierzeiten-Hinweis' },
      { key: 'contact.form.messageLabel', label: 'Formular – Nachricht Label' },
      { key: 'contact.messagePlaceholder', label: 'Formular – Platzhalter' },
    ],
  },
  {
    id: 'booking',
    title: 'Terminbuchung',
    fields: [
      { key: 'book.title', label: 'Überschrift' },
      { key: 'book.sub', label: 'Einleitung', html: true },
      { key: 'book.introNote', label: 'Hinweis Kennenlernen' },
      { key: 'book.slotsHint', label: 'Hinweis Zeitslots', html: true },
      { key: 'book.messagePlaceholder', label: 'Nachricht – Platzhalter' },
    ],
  },
  {
    id: 'seo',
    title: 'Seitentitel & Google-Vorschau',
    description: 'Titel und Kurzbeschreibung für Suchmaschinen (pro Seite)',
    fields: [
      { key: 'meta.home.title', label: 'Startseite – Titel' },
      { key: 'meta.home.description', label: 'Startseite – Beschreibung' },
      { key: 'meta.therapy.title', label: 'Kunsttherapie – Titel' },
      { key: 'meta.therapy.description', label: 'Kunsttherapie – Beschreibung' },
      { key: 'meta.about.title', label: 'Über mich – Titel' },
      { key: 'meta.about.description', label: 'Über mich – Beschreibung' },
      { key: 'meta.prices.title', label: 'Preise – Titel' },
      { key: 'meta.prices.description', label: 'Preise – Beschreibung' },
      { key: 'meta.contact.title', label: 'Kontakt – Titel' },
      { key: 'meta.contact.description', label: 'Kontakt – Beschreibung' },
      { key: 'meta.booking.title', label: 'Buchung – Titel' },
      { key: 'meta.booking.description', label: 'Buchung – Beschreibung' },
    ],
  },
];

const GROUP_BY_ID = Object.fromEntries(CATALOG.map((g) => [g.id, g]));
const ALL_KEYS = new Set(CATALOG.flatMap((g) => g.fields.map((f) => f.key)));

function loadDefaultMessages() {
  const ctx = { window: { I18N_MESSAGES: { de: {}, en: {} } } };
  vm.runInNewContext(fs.readFileSync(path.join(JS_DIR, 'i18n-messages.js'), 'utf8'), ctx);

  const splitFiles = fs
    .readdirSync(JS_DIR)
    .filter((f) => f.startsWith('i18n-messages-') && f.endsWith('.js') && f !== 'i18n-messages-pages.js')
    .sort();

  for (const file of splitFiles) {
    vm.runInNewContext(fs.readFileSync(path.join(JS_DIR, file), 'utf8'), ctx);
  }

  return ctx.window.I18N_MESSAGES;
}

let defaultsCache = null;

function getDefaults() {
  if (!defaultsCache) defaultsCache = loadDefaultMessages();
  return defaultsCache;
}

function emptyOverrides() {
  return { de: {}, en: {} };
}

// Alle Wortformen (angemieteter, gemietet, Mietvertrag …) und EN-Varianten
const RENTED_COPY_PATTERN =
  /\b(angemietet\w*|gemietet\w*|gemiet\w*|vermiet\w*|untermiet\w*|miete\w*|mieter\w*|pacht\w*|rent(?:ed|ing|s|al)?|leas(?:ed|ing|e)?)\b/i;

function containsRentedCopy(val) {
  return typeof val === 'string' && RENTED_COPY_PATTERN.test(val);
}

/** Entfernt CMS-Overrides mit Miet-/Vermiet-Formulierungen – Datei-Defaults gelten dann wieder. */
function scrubRentedOverrides(overrides) {
  const cleaned = emptyOverrides();
  let changed = false;
  for (const lang of ['de', 'en']) {
    for (const [key, val] of Object.entries(overrides[lang] || {})) {
      if (!ALL_KEYS.has(key) || typeof val !== 'string' || !val.trim()) continue;
      if (containsRentedCopy(val)) {
        changed = true;
        continue;
      }
      cleaned[lang][key] = val;
    }
  }
  return { overrides: cleaned, changed };
}

function parseOverrides(raw) {
  if (!raw) return emptyOverrides();
  try {
    const parsed = JSON.parse(raw);
    const base = {
      de: parsed.de && typeof parsed.de === 'object' ? parsed.de : {},
      en: parsed.en && typeof parsed.en === 'object' ? parsed.en : {},
    };
    return scrubRentedOverrides(base).overrides;
  } catch {
    return emptyOverrides();
  }
}

async function readOverrides(dbGet) {
  const row = await dbGet(`SELECT value FROM settings WHERE key = ?`, [SETTINGS_KEY]);
  return parseOverrides(row?.value);
}

async function migrateRentedOverrides(dbGet, dbRun) {
  const row = await dbGet(`SELECT value FROM settings WHERE key = ?`, [SETTINGS_KEY]);
  if (!row?.value) return false;
  let parsed;
  try {
    parsed = JSON.parse(row.value);
  } catch {
    return false;
  }
  const current = {
    de: parsed.de && typeof parsed.de === 'object' ? parsed.de : {},
    en: parsed.en && typeof parsed.en === 'object' ? parsed.en : {},
  };
  const { overrides, changed } = scrubRentedOverrides(current);
  if (!changed) return false;
  await writeOverrides(dbRun, overrides);
  return true;
}

async function writeOverrides(dbRun, overrides) {
  const scrubbed = scrubRentedOverrides(overrides).overrides;
  const clean = emptyOverrides();
  for (const lang of ['de', 'en']) {
    for (const [key, val] of Object.entries(scrubbed[lang] || {})) {
      if (!ALL_KEYS.has(key)) continue;
      if (typeof val !== 'string' || !val.trim()) continue;
      clean[lang][key] = val;
    }
  }
  await dbRun(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [
    SETTINGS_KEY,
    JSON.stringify(clean),
  ]);
  return clean;
}

function getGroupValues(groupId, lang, overrides) {
  const group = GROUP_BY_ID[groupId];
  if (!group) return null;
  const defaults = getDefaults();
  const ov = overrides[lang] || {};
  const base = defaults[lang] || {};
  const fields = group.fields.map((field) => {
    const defaultValue = base[field.key] ?? defaults.de[field.key] ?? '';
    const value = ov[field.key] != null ? ov[field.key] : defaultValue;
    const isOverride = ov[field.key] != null;
    return {
      ...field,
      value,
      defaultValue,
      isOverride,
    };
  });
  return { group, fields };
}

function validateGroupPayload(groupId, lang, values) {
  if (!GROUP_BY_ID[groupId]) return 'Unbekannte Gruppe';
  if (lang !== 'de' && lang !== 'en') return 'Sprache muss de oder en sein';
  if (!values || typeof values !== 'object') return 'Werte fehlen';

  const allowed = new Set(GROUP_BY_ID[groupId].fields.map((f) => f.key));
  for (const key of Object.keys(values)) {
    if (!allowed.has(key)) return `Schlüssel nicht erlaubt: ${key}`;
    if (typeof values[key] !== 'string') return `Ungültiger Wert für ${key}`;
  }
  return null;
}

function mergeOverridesForPublic(overrides) {
  const scrubbed = scrubRentedOverrides(overrides).overrides;
  const out = emptyOverrides();
  for (const lang of ['de', 'en']) {
    for (const [key, val] of Object.entries(scrubbed[lang] || {})) {
      if (ALL_KEYS.has(key) && typeof val === 'string' && val.trim()) {
        out[lang][key] = val;
      }
    }
  }
  return out;
}

function invalidateDefaultsCache() {
  defaultsCache = null;
}

async function saveGroupOverrides(dbGet, dbRun, groupId, lang, values) {
  const overrides = await readOverrides(dbGet);
  const defaults = getDefaults();
  const group = GROUP_BY_ID[groupId];
  if (!group) throw new Error('Unbekannte Gruppe');

  for (const field of group.fields) {
    if (!(field.key in values)) continue;
    const val = String(values[field.key] ?? '');
    const defaultVal = String(defaults[lang]?.[field.key] ?? defaults.de[field.key] ?? '');

    if (val.trim() === defaultVal.trim()) {
      delete overrides[lang][field.key];
    } else if (val.trim()) {
      overrides[lang][field.key] = val;
    } else {
      delete overrides[lang][field.key];
    }
  }

  return writeOverrides(dbRun, overrides);
}

async function resetGroupOverrides(dbGet, dbRun, groupId, lang) {
  const overrides = await readOverrides(dbGet);
  const group = GROUP_BY_ID[groupId];
  if (!group) throw new Error('Unbekannte Gruppe');

  for (const field of group.fields) {
    delete overrides[lang][field.key];
  }

  return writeOverrides(dbRun, overrides);
}

module.exports = {
  CATALOG,
  SETTINGS_KEY,
  ALL_KEYS,
  getDefaults,
  readOverrides,
  writeOverrides,
  saveGroupOverrides,
  resetGroupOverrides,
  getGroupValues,
  validateGroupPayload,
  mergeOverridesForPublic,
  migrateRentedOverrides,
  scrubRentedOverrides,
  invalidateDefaultsCache,
};
