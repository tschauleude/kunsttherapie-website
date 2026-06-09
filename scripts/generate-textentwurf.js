#!/usr/bin/env node
/**
 * Erzeugt textentwurf-martina.txt aus CMS-Katalog + aktuellen Texten (Defaults + Overrides).
 * Ausführen: npm run textentwurf
 */
const fs = require('fs');
const path = require('path');
const i18nContent = require('../lib/i18n-content');
const i18nPersist = require('../lib/i18n-persist');

const OUT = path.join(__dirname, '..', 'textentwurf-martina.txt');

function line(char, n) {
  return char.repeat(n);
}

function block(label, key, value, html) {
  const lines = [
    `[${key}]`,
    `Label: ${label}${html ? ' (HTML erlaubt)' : ''}`,
    '---',
    value || '(noch leer)',
    '---',
    '',
  ];
  return lines.join('\n');
}

function main() {
  const defaults = i18nContent.getDefaults();
  const overrides = i18nPersist.readOverridesFile();
  const merged = i18nPersist.mergeOverrideLayers(defaults, overrides);

  const parts = [
    'TEXTENTWURF MARTINA – Kunsttherapie Website',
    line('=', 60),
    '',
    'So nutzt du diese Datei:',
    '1. Texte hier bearbeiten oder ergänzen (Abschnitte mit ---).',
    '2. Geänderte Passagen ins Admin-Panel unter „Website-Texte“ übernehmen,',
    '   ODER die Datei an die Website-Betreuung schicken.',
    '3. Beim Speichern im Admin werden Texte zusätzlich dauerhaft gespeichert in:',
    '   - data/i18n-overrides.json (für GitHub / Deploy)',
    '   - assets/js/i18n-messages-*.js (Website-Code)',
    '',
    `Stand: ${new Date().toLocaleString('de-DE')}`,
    line('=', 60),
    '',
  ];

  for (const group of i18nContent.CATALOG) {
    parts.push(line('-', 60));
    parts.push(`BEREICH: ${group.title} (${group.id})`);
    if (group.description) parts.push(group.description);
    parts.push('');

    for (const field of group.fields) {
      const de = merged.de[field.key] ?? defaults.de[field.key] ?? '';
      parts.push(block(field.label, field.key, de, field.html));
    }
  }

  parts.push(line('=', 60));
  parts.push('ENGLISCH – nur bei Bedarf (Kopie der Schlüssel, Werte aus EN-Version)');
  parts.push('');

  for (const group of i18nContent.CATALOG) {
    parts.push(`--- ${group.title} (EN) ---`);
    for (const field of group.fields) {
      const en = merged.en[field.key] ?? defaults.en[field.key] ?? '';
      if (!en) continue;
      parts.push(block(field.label, field.key, en, field.html));
    }
  }

  fs.writeFileSync(OUT, `${parts.join('\n')}\n`);
  console.log(`Geschrieben: ${OUT}`);
}

main();
