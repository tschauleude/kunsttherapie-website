#!/usr/bin/env node
/**
 * Fügt statisches LocalBusiness-JSON-LD vor </head> ein (falls noch nicht vorhanden).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCHEMA = fs.readFileSync(path.join(ROOT, 'partials/schema-local-business.html'), 'utf8').trim();

const PAGES = [
  'index.html',
  'kunsttherapie.html',
  'ueber-mich.html',
  'buchung.html',
  'kontakt.html',
  'preise.html',
  'neuigkeiten.html',
  'events.html',
  'atelier.html',
  'impressum.html',
  'datenschutz.html',
];

for (const file of PAGES) {
  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) continue;
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('"@type": ["MedicalBusiness", "ProfessionalService"]')) {
    console.log('Skip (schema exists):', file);
    continue;
  }
  html = html.replace('</head>', `${SCHEMA}\n</head>`);
  fs.writeFileSync(filePath, html);
  console.log('Injected schema:', file);
}
