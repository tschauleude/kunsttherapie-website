#!/usr/bin/env node
/**
 * Frontend build: i18n split, JS bundle, image WebP, hashed assets, HTML patches.
 * Run: node scripts/build-frontend.js
 * Skip (e.g. emergency restart): SKIP_FRONTEND_BUILD=1 npm start
 */
if (process.env.SKIP_FRONTEND_BUILD === '1') {
  console.log('SKIP_FRONTEND_BUILD=1 — skipping frontend build');
  process.exit(0);
}

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { minify: minifyJs } = require('terser');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const SITE_PRICING = require(path.join(ROOT, 'lib', 'site-pricing'));
const {
  containsRentedCopy,
  sanitizeRentedText,
  scrubRentedOverrides,
} = require(path.join(ROOT, 'lib', 'i18n-scrub'));
const JS_DIR = path.join(ASSETS, 'js');
const CSS_DIR = path.join(ASSETS, 'css');
const IMG_DIR = path.join(ASSETS, 'img');

const SITE_PAGES = [
  'index',
  'kunsttherapie',
  'ueber-mich',
  'neuigkeiten',
  'events',
  'preise',
  'kontakt',
  'buchung',
  'atelier',
  'impressum',
  'datenschutz',
];

const PAGE_I18N = {
  index: 'home',
  kunsttherapie: 'therapy',
  'ueber-mich': 'about',
  buchung: 'booking',
  kontakt: 'contact',
  preise: 'prices',
  neuigkeiten: 'news',
  events: 'events',
  atelier: 'atelier',
  impressum: 'imprint',
  datenschutz: 'privacy',
};

const PAGE_EXTRA_SCRIPTS = {
  index: ['gallery.js', 'quotes.js', 'main.js', 'news.js'],
  kunsttherapie: ['kunsttherapie.js', 'quotes.js', 'raum-showcase.js'],
  kontakt: ['contact.js'],
  buchung: ['booking.js'],
  atelier: ['atelier.js'],
  neuigkeiten: ['news.js'],
  events: ['events.js'],
};

const CORE_BUNDLE_SOURCES = [
  'i18n-messages.js',
  'i18n-page-bindings.js',
  'i18n.js',
  'seo.js',
  'flow-motion.js',
  'consent.js',
  'accessibility.js',
  'site.js',
  'site-images.js',
  'reveal.js',
  'scroll-top.js',
];

function hashContent(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
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
  return 'shared';
}

function loadI18nOverridesJson() {
  const file = path.join(ROOT, 'data', 'i18n-overrides.json');
  if (!fs.existsSync(file)) return { de: {}, en: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      de: parsed.de && typeof parsed.de === 'object' ? parsed.de : {},
      en: parsed.en && typeof parsed.en === 'object' ? parsed.en : {},
    };
  } catch {
    return { de: {}, en: {} };
  }
}

function loadI18nExtra() {
  const src = path.join(JS_DIR, 'i18n-messages-pages.js');
  const code = fs.readFileSync(src, 'utf8');
  const match = code.match(/const extra = (\{[\s\S]*?\n  \});/);
  if (!match) throw new Error('Could not parse i18n-messages-pages.js');
  // eslint-disable-next-line no-eval
  const extra = eval(`(${match[1]})`);
  const overrides = scrubRentedOverrides(loadI18nOverridesJson()).overrides;
  for (const lang of ['de', 'en']) {
    Object.assign(extra[lang], overrides[lang] || {});
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
  return extra;
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
  return `i18n-messages-${name}.js`;
}

function splitI18n() {
  const extra = loadI18nExtra();
  const buckets = { shared: { de: {}, en: {} } };
  ['home', 'therapy', 'about', 'booking', 'contact', 'prices', 'news', 'events', 'atelier', 'imprint', 'privacy'].forEach(
    (p) => {
      buckets[p] = { de: {}, en: {} };
    }
  );

  for (const lang of ['de', 'en']) {
    for (const [key, val] of Object.entries(extra[lang] || {})) {
      const page = pageForKey(key);
      if (!buckets[page]) buckets[page] = { de: {}, en: {} };
      buckets[page][lang][key] = val;
    }
  }

  const files = [];
  for (const [name, data] of Object.entries(buckets)) {
    const f = writeI18nChunk(name, data.de, data.en);
    if (f) files.push(f);
  }
  return files;
}

async function buildCoreBundle() {
  const parts = CORE_BUNDLE_SOURCES.map((f) => {
    const p = path.join(JS_DIR, f);
    if (!fs.existsSync(p)) throw new Error(`Missing ${f}`);
    return fs.readFileSync(p, 'utf8');
  });
  const combined = parts.join('\n;\n');
  const { code } = await minifyJs(combined, {
    compress: true,
    mangle: true,
    format: { comments: false },
  });
  const minified = code || combined;
  const hash = hashContent(minified);
  const outName = `site-core.${hash}.js`;
  fs.writeFileSync(path.join(JS_DIR, outName), minified);
  fs.readdirSync(JS_DIR)
    .filter((f) => f.startsWith('site-core.') && f.endsWith('.js') && f !== outName)
    .forEach((f) => fs.unlinkSync(path.join(JS_DIR, f)));
  return outName;
}

function hashCss() {
  const src = path.join(CSS_DIR, 'style.css');
  const css = fs.readFileSync(src, 'utf8');
  const { code } = esbuild.transformSync(css, { loader: 'css', minify: true });
  const minified = code || css;
  const hash = hashContent(minified);
  const outName = `style.${hash}.css`;
  fs.writeFileSync(path.join(CSS_DIR, outName), minified);
  fs.readdirSync(CSS_DIR)
    .filter((f) => f.startsWith('style.') && f.endsWith('.css') && f !== 'style.css' && f !== outName)
    .forEach((f) => fs.unlinkSync(path.join(CSS_DIR, f)));
  return outName;
}

async function optimizeImages() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.warn('sharp not available – skipping WebP conversion');
    return {};
  }

  const targets = [
    'hero-atelier-aussen.jpg',
    'galerie-abstrakt.jpg',
    'galerie-schmerzstation.jpg',
    'galerie-material.jpg',
    'Potenziale-Kunsttherapie-Paderborn.jpg',
    'Sonnige_Pinsel.jpg',
    'atelier-eingang.jpg',
    'martina-portrait.jpg',
  ];
  const manifest = {};

  for (const file of targets) {
    const srcPath = path.join(IMG_DIR, file);
    if (!fs.existsSync(srcPath)) continue;
    const base = path.basename(file, path.extname(file));
    const meta = await sharp(srcPath).metadata();
    const widths = [meta.width];
    if (meta.width > 768) widths.unshift(768);
    if (meta.width > 480) widths.unshift(480);

    const uniqueWidths = [...new Set(widths)].sort((a, b) => a - b);
    const sources = [];

    for (const w of uniqueWidths) {
      const webpName = `${base}-${w}w.webp`;
      const webpPath = path.join(IMG_DIR, webpName);
      await sharp(srcPath)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(webpPath);
      sources.push({ w, webp: webpName });
    }

    manifest[file] = {
      width: meta.width,
      height: meta.height,
      sources,
      fallback: file,
    };
  }

  fs.writeFileSync(path.join(IMG_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

function buildScriptTags(pageName, coreBundle, cssFile) {
  const i18nPage = PAGE_I18N[pageName];
  const scripts = [
    `assets/js/${coreBundle}`,
    'assets/js/i18n-messages-shared.js',
  ];
  if (i18nPage) scripts.push(`assets/js/i18n-messages-${i18nPage}.js`);
  (PAGE_EXTRA_SCRIPTS[pageName] || []).forEach((s) => scripts.push(`assets/js/${s}`));
  return scripts.map((s) => `  <script src="${s}" defer></script>`).join('\n');
}

function patchHtml(coreBundle, cssFile) {
  for (const pageName of SITE_PAGES) {
    const filePath = path.join(ROOT, `${pageName}.html`);
    if (!fs.existsSync(filePath)) continue;
    let html = fs.readFileSync(filePath, 'utf8');
    const i18nPage = PAGE_I18N[pageName];

    // data-i18n-page on body
    if (i18nPage) {
      html = html.replace(/<body([^>]*)>/, (m, attrs) => {
        if (/data-i18n-page=/.test(attrs)) {
          return m.replace(/data-i18n-page="[^"]*"/, `data-i18n-page="${i18nPage}"`);
        }
        return `<body data-i18n-page="${i18nPage}"${attrs}>`;
      });
    }

    // Remove duplicate skip links – keep first only
    const skipMatches = html.match(/<a class="skip-link"[^>]*>[\s\S]*?<\/a>/g) || [];
    if (skipMatches.length > 1) {
      let first = true;
      html = html.replace(/<a class="skip-link"[^>]*>[\s\S]*?<\/a>\n?/g, (match) => {
        if (!first) return '';
        first = false;
        return match.includes('data-i18n') ? match : match.replace('<a class="skip-link"', '<a class="skip-link" data-i18n="a11y.skip"');
      });
    } else if (skipMatches.length === 1 && !skipMatches[0].includes('data-i18n')) {
      html = html.replace(
        '<a class="skip-link"',
        '<a class="skip-link" data-i18n="a11y.skip"'
      );
    }

    // hreflang: only de + x-default (client-side i18n)
    html = html.replace(/\s*<link rel="alternate" hreflang="en"[^>]*>\n?/g, '');
    html = html.replace(
      /(<link rel="alternate" hreflang="de"[^>]*\/>)\s*(<link rel="alternate" hreflang="x-default")/,
      '$1\n  $2'
    );

    // theme-color aligned with WCAG-adjusted teal
    html = html.replace(/<meta name="theme-color" content="#557a76"\/>/g, '<meta name="theme-color" content="#4a6e6a"/>');

    // Hashed CSS
    html = html.replace(
      /<link rel="stylesheet" href="assets\/css\/style[^"]*\.css"\s*\/?>/,
      `<link rel="stylesheet" href="assets/css/${cssFile}"/>`
    );

    // Replace all script blocks at end of body
    const scriptBlock = buildScriptTags(pageName, coreBundle, cssFile);
    html = html.replace(/(?:^[ \t]*)*<script src="assets\/js\/[^<]+<\/script>\n?/gm, '');
    html = html.replace(/<\/body>/, `${scriptBlock}\n</body>`);

    // Email obfuscation class
    html = html.replace(
      /<a href="mailto:info@kunsttherapie-pb\.de">info@kunsttherapie-pb\.de<\/a>/g,
      '<a href="mailto:info@kunsttherapie-pb.de" data-i18n="footer.emailLabel">E-Mail schreiben</a>'
    );

    fs.writeFileSync(filePath, html);
  }
}

function syncPricing() {
  const schemaPath = path.join(ROOT, 'partials', 'schema-local-business.html');
  let schema = fs.readFileSync(schemaPath, 'utf8');
  schema = schema.replace(/"priceRange":\s*"[^"]*"/, `"priceRange": "${SITE_PRICING.priceRange}"`);
  fs.writeFileSync(schemaPath, schema);

  const htmlFiles = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith('.html') && f !== 'admin.html');
  for (const file of htmlFiles) {
    const filePath = path.join(ROOT, file);
    let html = fs.readFileSync(filePath, 'utf8');
    if (!html.includes('"priceRange"')) continue;
    const next = html.replace(/"priceRange":\s*"[^"]*"/g, `"priceRange": "${SITE_PRICING.priceRange}"`);
    if (next !== html) fs.writeFileSync(filePath, next);
  }

  const i18nPages = fs.readFileSync(path.join(JS_DIR, 'i18n-messages-pages.js'), 'utf8');
  const checks = [
    ['home.services.priceHint', SITE_PRICING.priceHintDe],
    ['kt.facts.meta', SITE_PRICING.factsMetaDe],
    ['prices.tableBody', SITE_PRICING.groupPriceDe],
  ];
  for (const [key, needle] of checks) {
    if (!i18nPages.includes(needle)) {
      throw new Error(`Pricing mismatch: i18n-messages-pages.js missing "${needle}" for ${key}`);
    }
  }
  console.log('Pricing synced:', SITE_PRICING.priceRange);
}

async function main() {
  console.log('Syncing pricing…');
  syncPricing();

  console.log('Splitting i18n…');
  splitI18n();

  console.log('Building JS core bundle…');
  const coreBundle = await buildCoreBundle();

  console.log('Hashing CSS…');
  const cssFile = hashCss();

  console.log('Optimizing images…');
  await optimizeImages();

  console.log('Patching HTML…');
  patchHtml(coreBundle, cssFile);

  const manifest = {
    coreBundle,
    cssFile,
    builtAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(ASSETS, 'asset-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Done:', manifest);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
