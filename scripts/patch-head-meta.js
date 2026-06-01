#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const META = {
  kunsttherapie:
    'Kunsttherapie Paderborn ab Juni: Gruppen, Auszeit, Teambuilding, Einzel. Otto-Stadler-Straße 23c – Termin online buchen.',
  'ueber-mich':
    'Martina Schwierzke – psychosoziale und klinische Kunsttherapeutin in Paderborn. Qualifikationen und therapeutischer Ansatz.',
  neuigkeiten: 'Aktuelles aus dem Atelier: Neuigkeiten und Termine der Kunsttherapie Paderborn.',
  events: 'Veranstaltungen und Termine – Kunsttherapie Paderborn, Martina Schwierzke.',
  preise: 'Preise für Kunsttherapie, Gruppen und Einzel in Paderborn – transparente Übersicht.',
  buchung:
    'Online-Terminbuchung Kunsttherapie Paderborn: freie Zeiten Di/Do wählen, Bestätigung per E-Mail.',
  impressum: 'Impressum – Martina Schwierzke, Kunsttherapie Paderborn.',
  datenschutz: 'Datenschutzerklärung der Website Kunsttherapie Paderborn.',
};

const HEAD_EXTRA = `
  <meta name="theme-color" content="#557a76"/>
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml"/>
  <link rel="apple-touch-icon" href="assets/img/favicon.svg"/>`;

const ROOT = path.join(__dirname, '..');

Object.entries(META).forEach(([name, desc]) => {
  const file = path.join(ROOT, `${name}.html`);
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');

  if (!html.includes('name="description"')) {
    html = html.replace(
      /(<title>[^<]+<\/title>)/,
      `$1\n  <meta name="description" content="${desc}"/>`
    );
  }

  if (!html.includes('favicon.svg')) {
    html = html.replace('</title>', `</title>${HEAD_EXTRA}`);
  }

  html = html.replace(/width=device-width,initial-scale=1/g, 'width=device-width, initial-scale=1');

  if (!html.includes('id="main"') && html.includes('<main')) {
    html = html.replace(/<main(\s|>)/, '<main id="main"$1');
  }

  fs.writeFileSync(file, html);
  console.log('Patched', name);
});
