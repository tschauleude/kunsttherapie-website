#!/usr/bin/env node
/**
 * Fügt Canonical- und Open-Graph-Meta-Tags in öffentliche HTML-Seiten ein.
 * Ausführen nach neuen Seiten: node scripts/apply-seo-head.js
 */
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://kunsttherapie.mkmpb.de';
const SITE_NAME = 'Kunsttherapie Paderborn';

const OG_IMAGE = `${ORIGIN}/assets/img/Gruppen-und-Einzeltherapie-768x524.jpg`;
const OG_IMAGE_ALT = 'Kunsttherapie in Paderborn – Gruppen- und Einzeltherapie';

const PAGES = [
  { file: 'index.html', path: '/', title: 'Kunsttherapie Paderborn', desc: 'Kunsttherapie in Paderborn: Di 11:00–12:30 und Do 18:00–19:30. Gruppen, Auszeit, Einzel, Teambuilding – Termin online buchen.' },
  { file: 'kunsttherapie.html', path: '/kunsttherapie', title: 'Kunsttherapie & Angebote – Paderborn', desc: 'Gruppen Dienstag morgens, Auszeit Donnerstag abends, Teambuilding und Einzelsitzungen. Atelier Otto-Stadler-Straße 23c, Paderborn.' },
  { file: 'ueber-mich.html', path: '/ueber-mich', title: 'Über mich – Kunsttherapeutin Paderborn', desc: 'Ich bin psychosoziale und klinische Kunsttherapeutin mit über 16 Jahren Erfahrung – Palliativ, Psychoonkologie, mein eigenes Atelier in Paderborn.' },
  { file: 'buchung.html', path: '/buchung', title: 'Termin buchen – Kunsttherapie Paderborn', desc: 'Online-Termin anfragen: Dienstag morgens und Donnerstag abends. Freie Zeiten im Kalender – Bestätigung per E-Mail.' },
  { file: 'kontakt.html', path: '/kontakt', title: 'Kontakt – Kunsttherapie Paderborn', desc: 'Nachricht senden, anrufen oder Anfahrt zum Atelier Otto-Stadler-Straße 23c, Paderborn.' },
  { file: 'preise.html', path: '/preise', title: 'Preise – Kunsttherapie Paderborn', desc: 'Transparente Preise für Gruppensitzungen ab 55 €, Programme und Einzelsitzungen auf Anfrage.' },
  { file: 'neuigkeiten.html', path: '/neuigkeiten', title: 'Neuigkeiten – Kunsttherapie Paderborn', desc: 'Aktuelles aus dem Atelier: Termine, Raum und Ankündigungen.' },
  { file: 'events.html', path: '/events', title: 'Veranstaltungen – Kunsttherapie Paderborn', desc: 'Workshops, Teambuilding und Veranstaltungen in Paderborn.' },
  { file: 'atelier.html', path: '/atelier', title: 'Mini-Atelier – Kunsttherapie Paderborn', desc: 'Ausprobieren im Mini-Atelier: Malen, Zeichnen und Kollage – optional anonym an das Atelier senden.' },
  { file: 'impressum.html', path: '/impressum', title: 'Impressum – Kunsttherapie Paderborn', desc: 'Impressum der Website Kunsttherapie Paderborn.' },
  { file: 'datenschutz.html', path: '/datenschutz', title: 'Datenschutz – Kunsttherapie Paderborn', desc: 'Datenschutzerklärung der Website Kunsttherapie Paderborn.' },
];

const ROOT = path.join(__dirname, '..');

function buildSeoBlock(page) {
  const url = ORIGIN + (page.path === '/' ? '/' : page.path);
  return `
  <link rel="canonical" href="${url}"/>
  <link rel="alternate" hreflang="de" href="${url}"/>
  <link rel="alternate" hreflang="en" href="${url}"/>
  <link rel="alternate" hreflang="x-default" href="${url}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:locale" content="de_DE"/>
  <meta property="og:site_name" content="${SITE_NAME}"/>
  <meta property="og:title" content="${page.title}"/>
  <meta property="og:description" content="${page.desc}"/>
  <meta property="og:url" content="${url}"/>
  <meta property="og:image" content="${OG_IMAGE}"/>
  <meta property="og:image:width" content="768"/>
  <meta property="og:image:height" content="524"/>
  <meta property="og:image:alt" content="${OG_IMAGE_ALT}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${page.title}"/>
  <meta name="twitter:description" content="${page.desc}"/>
  <meta name="twitter:image" content="${OG_IMAGE}"/>
  <meta name="twitter:image:alt" content="${OG_IMAGE_ALT}"/>`;
}

PAGES.forEach((page) => {
  const filePath = path.join(ROOT, page.file);
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  if (html.includes('rel="canonical"')) {
    console.log('Skip (canonical exists):', page.file);
    return;
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (titleMatch && titleMatch[1] !== page.title) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`);
  }

  if (!html.includes('name="description"')) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>\n  <meta name="description" content="${page.desc}"/>`);
  } else {
    html = html.replace(
      /<meta name="description" content="[^"]*"\/>/,
      `<meta name="description" content="${page.desc}"/>`
    );
  }

  html = html.replace(/<link rel="stylesheet" href="assets\/css\/style\.css"\/>/, (m) => buildSeoBlock(page) + '\n  ' + m);

  if (!html.includes('assets/js/seo.js')) {
    html = html.replace(
      /<script src="assets\/js\/consent\.js"><\/script>/,
      '<script src="assets/js/seo.js"></script>\n  <script src="assets/js/consent.js"></script>'
    );
  }

  fs.writeFileSync(filePath, html);
  console.log('Patched', page.file);
});
