/**
 * Adds missing data-i18n attributes to nav and footer elements across all public HTML pages.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PAGES = [
  'index.html','ueber-mich.html','kunsttherapie.html','neuigkeiten.html',
  'events.html','buchung.html','kontakt.html','preise.html',
  'atelier.html','impressum.html','datenschutz.html','angebote.html',
];

// Each entry: [find string, replace string]
const REPLACEMENTS = [
  // ── NAV ITEMS ──────────────────────────────────────────────────────────────
  [
    '<a href="ueber-mich" data-nav="ansatz">Mein Ansatz</a>',
    '<a href="ueber-mich" data-nav="ansatz" data-i18n="nav.ansatz">Mein Ansatz</a>',
  ],
  [
    '<a href="kunsttherapie" data-nav="kunsttherapie">Kunsttherapie</a>',
    '<a href="kunsttherapie" data-nav="kunsttherapie" data-i18n="nav.therapy">Kunsttherapie</a>',
  ],
  [
    '<a href="kunsttherapie#atelier" data-nav="praxis">Das Atelier</a>',
    '<a href="kunsttherapie#atelier" data-nav="praxis" data-i18n="nav.practice">Das Atelier</a>',
  ],
  [
    '<a href="neuigkeiten" data-nav="neuigkeiten">Neuigkeiten</a>',
    '<a href="neuigkeiten" data-nav="neuigkeiten" data-i18n="nav.news">Neuigkeiten</a>',
  ],
  [
    '<a href="buchung" class="nav-cta" data-nav="termin">Termin</a>',
    '<a href="buchung" class="nav-cta" data-nav="termin" data-i18n="nav.booking">Termin</a>',
  ],
  [
    '<a href="kontakt" data-nav="kontakt">Kontakt</a>',
    '<a href="kontakt" data-nav="kontakt" data-i18n="nav.contact">Kontakt</a>',
  ],

  // ── NAV / LANG-SWITCH ARIA LABELS ─────────────────────────────────────────
  [
    'aria-label="Hauptnavigation"',
    'data-i18n-aria-label="nav.aria" aria-label="Hauptnavigation"',
  ],
  [
    'aria-label="Sprache wählen"',
    'data-i18n-aria-label="lang.switch" aria-label="Sprache wählen"',
  ],

  // ── FOOTER H4 HEADINGS ─────────────────────────────────────────────────────
  ['<h4>Atelier</h4>', '<h4 data-i18n="footer.practice">Atelier</h4>'],
  ['<h4>Kontakt</h4>', '<h4 data-i18n="footer.contact">Kontakt</h4>'],
  ['<h4>Angebot</h4>', '<h4 data-i18n="footer.offer">Angebot</h4>'],
  ['<h4>Rechtliches</h4>', '<h4 data-i18n="footer.legal">Rechtliches</h4>'],

  // ── FOOTER ROLE TEXT ───────────────────────────────────────────────────────
  [
    '<p>Psychosoziale &amp; Klinische Kunsttherapeutin</p>',
    '<p data-i18n="footer.role">Psychosoziale &amp; Klinische Kunsttherapeutin</p>',
  ],

  // ── FOOTER LINKS ───────────────────────────────────────────────────────────
  [
    '<a href="kunsttherapie">Kunsttherapie</a>',
    '<a href="kunsttherapie" data-i18n="nav.therapy">Kunsttherapie</a>',
  ],
  [
    '<a href="buchung">Termin buchen</a>',
    '<a href="buchung" data-i18n="btn.book">Termin buchen</a>',
  ],
  [
    '<a href="events">Veranstaltungen</a>',
    '<a href="events" data-i18n="nav.events">Veranstaltungen</a>',
  ],
  [
    '<a href="neuigkeiten">Neuigkeiten</a>',
    '<a href="neuigkeiten" data-i18n="nav.news">Neuigkeiten</a>',
  ],
  [
    '<a href="preise">Preise</a>',
    '<a href="preise" data-i18n="footer.prices">Preise</a>',
  ],
  [
    '<a href="impressum">Impressum</a>',
    '<a href="impressum" data-i18n="footer.imprint">Impressum</a>',
  ],
  [
    '<a href="datenschutz">Datenschutz</a>',
    '<a href="datenschutz" data-i18n="footer.privacy">Datenschutz</a>',
  ],

  // ── FOOTER TAGLINE ─────────────────────────────────────────────────────────
  [
    '<span class="footer-tagline-text"> Kunsttherapie Paderborn</span>',
    '<span class="footer-tagline-text" data-i18n="footer.tagline"> Kunsttherapie Paderborn</span>',
  ],
];

let totalFiles = 0;
let totalChanges = 0;

for (const page of PAGES) {
  const filePath = path.join(ROOT, page);
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  let changed = 0;

  for (const [find, replace] of REPLACEMENTS) {
    if (html.includes(find)) {
      html = html.split(find).join(replace);
      changed++;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`  ${page}: ${changed} replacement(s)`);
    totalFiles++;
    totalChanges += changed;
  }
}

console.log(`\nDone: ${totalChanges} replacements across ${totalFiles} files.`);
