#!/usr/bin/env node
/**
 * Prüft i18n-Schlüssel (DE/EN) und Page-Bindings.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const jsDir = path.join(root, 'assets/js');

function loadMessages() {
  const ctx = { window: { I18N_MESSAGES: { de: {}, en: {} } } };
  vm.runInNewContext(fs.readFileSync(path.join(jsDir, 'i18n-messages.js'), 'utf8'), ctx);

  const splitFiles = fs
    .readdirSync(jsDir)
    .filter((f) => f.startsWith('i18n-messages-') && f.endsWith('.js') && f !== 'i18n-messages-pages.js')
    .sort();

  if (splitFiles.length) {
    for (const file of splitFiles) {
      vm.runInNewContext(fs.readFileSync(path.join(jsDir, file), 'utf8'), ctx);
    }
  } else {
    vm.runInNewContext(fs.readFileSync(path.join(jsDir, 'i18n-messages-pages.js'), 'utf8'), ctx);
  }

  return ctx.window.I18N_MESSAGES;
}

function loadBindings() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(jsDir, 'i18n-page-bindings.js'), 'utf8'), ctx);
  return ctx.window.I18N_PAGE_BINDINGS || {};
}

const RENTED_COPY_PATTERN =
  /\b(angemietet\w*|gemietet\w*|gemiet\w*|vermiet\w*|untermiet\w*|miete\w*|mieter\w*|pacht\w*|rent(?:ed|ing|s|al)?|leas(?:ed|ing|e)?)\b/i;

const msgs = loadMessages();
const de = Object.keys(msgs.de);
const en = Object.keys(msgs.en);
const deOnly = de.filter((k) => !(k in msgs.en));
const enOnly = en.filter((k) => !(k in msgs.de));

let exit = 0;

for (const lang of ['de', 'en']) {
  for (const [key, val] of Object.entries(msgs[lang] || {})) {
    if (typeof val === 'string' && RENTED_COPY_PATTERN.test(val)) {
      console.error(`Miet-/Vermiet-Formulierung in ${lang} "${key}": ${val.slice(0, 80)}…`);
      exit = 1;
    }
  }
}
if (deOnly.length) {
  console.error('Nur DE:', deOnly.slice(0, 10).join(', '), deOnly.length > 10 ? `…+${deOnly.length - 10}` : '');
  exit = 1;
}
if (enOnly.length) {
  console.error('Nur EN:', enOnly.slice(0, 10).join(', '), enOnly.length > 10 ? `…+${enOnly.length - 10}` : '');
  exit = 1;
}

const bindings = loadBindings();
for (const [page, list] of Object.entries(bindings)) {
  for (const { key } of list) {
    if (!(key in msgs.de)) {
      console.error(`Binding ${page}: fehlender DE-Schlüssel "${key}"`);
      exit = 1;
    }
    if (!(key in msgs.en)) {
      console.error(`Binding ${page}: fehlender EN-Schlüssel "${key}"`);
      exit = 1;
    }
  }
}

const REDIRECT_ONLY = new Set(['angebote.html']);

const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith('.html') && f !== 'admin.html');
const missingI18n = htmlFiles.filter((f) => {
  if (REDIRECT_ONLY.has(f)) return false;
  const p = path.join(root, f);
  if (!fs.existsSync(p)) return false;
  const c = fs.readFileSync(p, 'utf8');
  if (c.includes('admin-app')) return false;
  if (/http-equiv=["']refresh["']/i.test(c) && !c.includes('site-core') && !c.includes('i18n-messages')) return false;
  return !c.includes('site-core') && !c.includes('i18n-messages-shared.js');
});
if (missingI18n.length) {
  console.error('HTML ohne i18n:', missingI18n.join(', '));
  exit = 1;
}

if (!exit) {
  console.log(`OK: ${de.length} Schlüssel DE/EN, ${Object.keys(bindings).length} Seiten-Bindings`);
}
process.exit(exit);
