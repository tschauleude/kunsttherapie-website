#!/usr/bin/env node
/** Einheitliche Einrückung für header-tools + lang-switch */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOCK = `      <div class="header-tools">
        <div class="lang-switch" role="group" aria-label="Sprache wählen">
          <span class="lang-switch-hint" data-i18n="lang.hint">Sprache</span>
          <div class="lang-switch-btns">
            <button type="button" class="lang-switch-btn is-active" data-lang="de" aria-pressed="true">DE</button>
            <button type="button" class="lang-switch-btn" data-lang="en" aria-pressed="false">EN</button>
          </div>
        </div>
      </div>
`;

const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && f !== 'admin.html');

for (const file of files) {
  const p = path.join(ROOT, file);
  let html = fs.readFileSync(p, 'utf8');
  if (!html.includes('header-tools')) continue;

  html = html.replace(
    /[ \t]*<div class="header-tools">[\s\S]*?<\/div>\s*(?=<nav[^>]*data-site-nav)/i,
    `${BLOCK}\n`
  );
  fs.writeFileSync(p, html);
  console.log('Normalized', file);
}
