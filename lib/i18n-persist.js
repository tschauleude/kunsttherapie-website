/**
 * Dauerhafte Website-Texte: JSON im Repo + Einbacken in i18n-Quelldateien.
 * Admin-Speichern → data/i18n-overrides.json (für Git) + JS-Defaults aktualisieren.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { containsRentedCopy, sanitizeRentedText, scrubRentedOverrides } = require('./i18n-scrub');

const ROOT = path.join(__dirname, '..');
const OVERRIDES_FILE = path.join(ROOT, 'data', 'i18n-overrides.json');
const PAGES_FILE = path.join(ROOT, 'assets/js', 'i18n-messages-pages.js');
const JS_DIR = path.join(ROOT, 'assets/js');

function emptyOverrides() {
  return { de: {}, en: {} };
}

function readOverridesFile() {
  if (!fs.existsSync(OVERRIDES_FILE)) return emptyOverrides();
  try {
    const parsed = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));
    return scrubRentedOverrides({
      de: parsed.de && typeof parsed.de === 'object' ? parsed.de : {},
      en: parsed.en && typeof parsed.en === 'object' ? parsed.en : {},
    }).overrides;
  } catch {
    return emptyOverrides();
  }
}

function writeOverridesFile(overrides) {
  fs.mkdirSync(path.dirname(OVERRIDES_FILE), { recursive: true });
  const payload = {
    de: overrides.de || {},
    en: overrides.en || {},
    _meta: {
      updatedAt: new Date().toISOString(),
      hint: 'Wird beim Speichern im Admin automatisch aktualisiert. In Git committen für dauerhafte Texte.',
    },
  };
  fs.writeFileSync(OVERRIDES_FILE, `${JSON.stringify(payload, null, 2)}\n`);
}

function loadPagesExtra() {
  const code = fs.readFileSync(PAGES_FILE, 'utf8');
  const match = code.match(/const extra = (\{[\s\S]*?\n  \});/);
  if (!match) throw new Error('i18n-messages-pages.js konnte nicht gelesen werden');
  // eslint-disable-next-line no-eval
  return eval(`(${match[1]})`);
}

function pageForKey(key) {
  if (key.startsWith('consent.') || key.startsWith('a11y.') || key.startsWith('ui.')) return 'shared';
  if (key.startsWith('nav.') || key.startsWith('btn.') || key.startsWith('form.')) return 'shared';
  if (key.startsWith('lang.')) return 'shared';
  if (key.startsWith('map.')) return 'shared';
  if (key.startsWith('meta.home.') || key.startsWith('home.')) return 'home';
  if (key.startsWith('meta.therapy.') || key.startsWith('kt.') || key.startsWith('offer.')) return 'therapy';
  if (key.startsWith('meta.about.') || key.startsWith('about.')) return 'about';
  if (key.startsWith('meta.booking.') || key.startsWith('book.')) return 'booking';
  if (key.startsWith('meta.contact.') || key.startsWith('contact.')) return 'contact';
  if (key.startsWith('meta.prices.') || key.startsWith('prices.')) return 'prices';
  if (key.startsWith('meta.news.') || key.startsWith('newsPage.')) return 'news';
  if (key.startsWith('meta.events.') || key.startsWith('eventsPage.')) return 'events';
  if (key.startsWith('meta.atelier.')) return 'atelier';
  if (key.startsWith('meta.imprint.') || key.startsWith('legal.imprint.')) return 'imprint';
  if (key.startsWith('meta.privacy.') || key.startsWith('legal.privacy.')) return 'privacy';
  if (key.startsWith('costs.') || key.startsWith('meta.costs.')) return 'kostenerstattung';
  return 'shared';
}

function writeI18nChunk(name, de, en) {
  if (!Object.keys(de).length && !Object.keys(en).length) return null;
  const file = path.join(JS_DIR, `i18n-messages-${name}.js`);
  const body = `(function () {
  if (!window.I18N_MESSAGES) window.I18N_MESSAGES = { de: {}, en: {} };
  const extra = { de: ${JSON.stringify(de, null, 2)}, en: ${JSON.stringify(en, null, 2)} };
  Object.assign(window.I18N_MESSAGES.de, extra.de);
  Object.assign(window.I18N_MESSAGES.en, extra.en);
})();\n`;
  fs.writeFileSync(file, body);
  return file;
}

/** Regeneriert i18n-messages-*.js aus pages.js + Overrides. */
function rebuildSplitI18nFiles(overrides) {
  const cleanOverrides = scrubRentedOverrides(overrides || emptyOverrides()).overrides;
  const extra = loadPagesExtra();
  for (const lang of ['de', 'en']) {
    Object.assign(extra[lang], cleanOverrides[lang] || {});
    for (const [key, val] of Object.entries(extra[lang] || {})) {
      if (typeof val !== 'string') continue;
      const sanitized = sanitizeRentedText(val);
      if (containsRentedCopy(sanitized)) {
        delete extra[lang][key];
        continue;
      }
      extra[lang][key] = sanitized;
    }
  }

  const buckets = { shared: { de: {}, en: {} } };
  [
    'home',
    'therapy',
    'about',
    'booking',
    'contact',
    'prices',
    'news',
    'events',
    'atelier',
    'imprint',
    'privacy',
    'kostenerstattung',
  ].forEach((p) => {
    buckets[p] = { de: {}, en: {} };
  });

  for (const lang of ['de', 'en']) {
    for (const [key, val] of Object.entries(extra[lang] || {})) {
      const page = pageForKey(key);
      if (!buckets[page]) buckets[page] = { de: {}, en: {} };
      buckets[page][lang][key] = val;
    }
  }

  for (const [name, data] of Object.entries(buckets)) {
    writeI18nChunk(name, data.de, data.en);
  }
}

function mergeOverrideLayers(...layers) {
  const out = emptyOverrides();
  for (const layer of layers) {
    for (const lang of ['de', 'en']) {
      Object.assign(out[lang], layer[lang] || {});
    }
  }
  return out;
}

/**
 * Nach Admin-Speichern: JSON + Quellcode + Split-Dateien aktualisieren.
 */
function persistOverrides(overrides) {
  const clean = scrubRentedOverrides(overrides || emptyOverrides()).overrides;
  writeOverridesFile(clean);
  rebuildSplitI18nFiles(clean);
}

function loadDefaultsFromJs() {
  const pages = loadPagesExtra();
  return {
    de: { ...(pages.de || {}) },
    en: { ...(pages.en || {}) },
  };
}

module.exports = {
  OVERRIDES_FILE,
  emptyOverrides,
  readOverridesFile,
  writeOverridesFile,
  mergeOverrideLayers,
  persistOverrides,
  loadDefaultsFromJs,
  loadPagesExtra,
  rebuildSplitI18nFiles,
};
