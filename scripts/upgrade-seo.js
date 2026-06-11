#!/usr/bin/env node
/**
 * Ergänzt fehlende SEO-Tags: og:image, twitter:image, hreflang (de/en/x-default).
 * Ausführen: node scripts/upgrade-seo.js
 */
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://kunsttherapie.mkmpb.de';
const OG_IMAGE = `${ORIGIN}/assets/img/Gruppen-und-Einzeltherapie-768x524.jpg`;
const OG_IMAGE_ALT = 'Kunsttherapie in Paderborn – Gruppen- und Einzeltherapie';

const PAGES = [
  { file: 'index.html', path: '/' },
  { file: 'kunsttherapie.html', path: '/kunsttherapie' },
  { file: 'ueber-mich.html', path: '/ueber-mich' },
  { file: 'buchung.html', path: '/buchung' },
  { file: 'kontakt.html', path: '/kontakt' },
  { file: 'preise.html', path: '/preise' },
  { file: 'neuigkeiten.html', path: '/neuigkeiten' },
  { file: 'events.html', path: '/events' },
  { file: 'atelier.html', path: '/atelier' },
  { file: 'impressum.html', path: '/impressum' },
  { file: 'datenschutz.html', path: '/datenschutz' },
];

const ROOT = path.join(__dirname, '..');

function pageUrl(page) {
  return ORIGIN + (page.path === '/' ? '/' : page.path);
}

function hreflangBlock(url) {
  return `  <link rel="alternate" hreflang="de" href="${url}"/>
  <link rel="alternate" hreflang="en" href="${url}"/>
  <link rel="alternate" hreflang="x-default" href="${url}"/>`;
}

function ogImageBlock() {
  return `  <meta property="og:image" content="${OG_IMAGE}"/>
  <meta property="og:image:width" content="768"/>
  <meta property="og:image:height" content="524"/>
  <meta property="og:image:alt" content="${OG_IMAGE_ALT}"/>
  <meta name="twitter:image" content="${OG_IMAGE}"/>
  <meta name="twitter:image:alt" content="${OG_IMAGE_ALT}"/>`;
}

PAGES.forEach((page) => {
  const filePath = path.join(ROOT, page.file);
  if (!fs.existsSync(filePath)) {
    console.log('Skip (missing):', page.file);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  const url = pageUrl(page);
  let changed = false;

  if (!html.includes('hreflang="de"')) {
    if (html.includes('rel="canonical"')) {
      html = html.replace(
        /(<link rel="canonical" href="[^"]*"\/>)/,
        `$1\n${hreflangBlock(url)}`
      );
    } else {
      html = html.replace(
        /(<link rel="icon"[^>]*\/>)/,
        `$1\n  <link rel="canonical" href="${url}"/>\n${hreflangBlock(url)}`
      );
    }
    changed = true;
  }

  if (!html.includes('hreflang="en"') && html.includes('hreflang="de"')) {
    html = html.replace(
      /(<link rel="alternate" hreflang="de" href="[^"]*"\/>)/,
      `$1\n  <link rel="alternate" hreflang="en" href="${url}"/>`
    );
    changed = true;
  }

  if (!html.includes('hreflang="x-default"') && html.includes('hreflang="de"')) {
    const afterEn = html.includes('hreflang="en"')
      ? /(<link rel="alternate" hreflang="en" href="[^"]*"\/>)/
      : /(<link rel="alternate" hreflang="de" href="[^"]*"\/>)/;
    html = html.replace(afterEn, `$1\n  <link rel="alternate" hreflang="x-default" href="${url}"/>`);
    changed = true;
  }

  if (!html.includes('property="og:image"')) {
    if (html.includes('property="og:url"')) {
      html = html.replace(
        /(<meta property="og:url" content="[^"]*"\/>)/,
        `$1\n${ogImageBlock()}`
      );
    } else if (html.includes('rel="canonical"')) {
      html = html.replace(
        /(<link rel="canonical" href="[^"]*"\/>)/,
        `$1\n  <meta property="og:type" content="website"/>
  <meta property="og:locale" content="de_DE"/>
  <meta property="og:site_name" content="Kunsttherapie Paderborn"/>
  <meta property="og:url" content="${url}"/>
${ogImageBlock()}
  <meta name="twitter:card" content="summary_large_image"/>`
      );
    }
    changed = true;
  }

  if (html.includes('twitter:card" content="summary"') && html.includes('og:image')) {
    html = html.replace(
      /<meta name="twitter:card" content="summary"\/>/,
      '<meta name="twitter:card" content="summary_large_image"/>'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html);
    console.log('Upgraded SEO:', page.file);
  } else {
    console.log('Already complete:', page.file);
  }
});
