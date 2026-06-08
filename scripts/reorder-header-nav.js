#!/usr/bin/env node
/**
 * Verschiebt die Navigation vor den Sprachschalter im Header (Desktop-Layout).
 * Erhält Seiten-spezifische data-i18n-Attribute.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = fs
  .readdirSync(ROOT)
  .filter((name) => name.endsWith('.html') && name !== 'admin.html' && !name.startsWith('.'))
  .map((name) => path.join(ROOT, name));

const INNER_RE =
  /(<div class="container header-inner">[\s\S]*?<\/a>\s*)(<div class="header-tools">[\s\S]*?<\/div>\s*)(<nav id="site-nav"[\s\S]*?<\/nav>)(\s*<\/div>\s*<\/header>)/i;

let updated = 0;

FILES.forEach((filePath) => {
  let html = fs.readFileSync(filePath, 'utf8');
  if (!INNER_RE.test(html)) return;
  html = html.replace(INNER_RE, '$1$3$2$4');
  fs.writeFileSync(filePath, html);
  updated += 1;
  console.log('Reordered header in', path.basename(filePath));
});

console.log(`Done: ${updated} file(s)`);
