#!/usr/bin/env node
/**
 * Fügt den Sprachumschalter fest in den Header ein (falls noch fehlt).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const LANG_BLOCK = `      <div class="header-tools">
        <div class="lang-switch" role="group" aria-label="Sprache wählen">
          <div class="lang-switch-btns">
            <button type="button" class="lang-switch-btn is-active" data-lang="de" aria-pressed="true">DE</button>
            <button type="button" class="lang-switch-btn" data-lang="en" aria-pressed="false">EN</button>
          </div>
        </div>
      </div>
`;

const files = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && f !== 'admin.html' && !f.startsWith('public/'));

let updated = 0;
for (const file of files) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes('header-inner') || html.includes('class="lang-switch"')) continue;

  const re = /(<a class="brand[^>]*>[\s\S]*?<\/a>\s*)(<nav[^>]*data-site-nav)/i;
  if (!re.test(html)) {
    console.warn('Skip (no match):', file);
    continue;
  }
  html = html.replace(re, `$1${LANG_BLOCK}$2`);
  fs.writeFileSync(filePath, html);
  console.log('Patched', file);
  updated += 1;
}

console.log(`Done: ${updated} file(s).`);
