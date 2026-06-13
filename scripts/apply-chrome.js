#!/usr/bin/env node
/**
 * Synchronisiert Header/Footer auf allen öffentlichen HTML-Seiten.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  'index',
  'kunsttherapie',
  'ueber-mich',
  'neuigkeiten',
  'events',
  'preise',
  'kontakt',
  'buchung',
  'impressum',
  'datenschutz',
  'atelier',
];

// Schutz: partials/* sind nicht mehr die Quelle der Wahrheit – Header/Footer
// werden direkt in den Seiten gepflegt (inkl. Logo-Bild und data-i18n-Attributen).
// Ein blindes Überschreiben würde diese verlieren. Nur mit --force ausführen.
if (!process.argv.includes('--force')) {
  console.error('apply-chrome.js ist veraltet und würde Header/Body-Attribute überschreiben.');
  console.error('Header/Footer werden direkt in den Seiten gepflegt. Mit --force trotzdem ausführen.');
  process.exit(1);
}

const HEADER = fs.readFileSync(path.join(ROOT, 'partials/header.html'), 'utf8');
const FOOTER = fs.readFileSync(path.join(ROOT, 'partials/footer.html'), 'utf8');

function apply(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Nur den <header>-Block ersetzen, <body ...>-Attribute und Skip-Link erhalten.
  html = html.replace(
    /<body[^>]*>[\s\S]*?<header>[\s\S]*?<\/header>/i,
    (match) => match.replace(/<header>[\s\S]*?<\/header>/i, HEADER.trim())
  );
  html = html.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/i, FOOTER.trim());

  html = html.replace(/<script>document\.getElementById\(["']y["']\)[\s\S]*?<\/script>\s*/gi, '');
  html = html.replace(/<script>document\.getElementById\(["']year["']\)[\s\S]*?<\/script>\s*/gi, '');

  if (!html.includes('assets/js/site.js')) {
    html = html.replace(
      /(<script src="assets\/js\/consent\.js"><\/script>)/,
      '$1\n  <script src="assets/js/site.js"></script>'
    );
  }

  fs.writeFileSync(filePath, html);
  console.log('Updated', path.basename(filePath));
}

require('child_process').execSync('node scripts/build-chrome.js', { cwd: ROOT, stdio: 'inherit' });

PAGES.forEach((name) => {
  const file = path.join(ROOT, `${name}.html`);
  if (fs.existsSync(file)) apply(file);
});
