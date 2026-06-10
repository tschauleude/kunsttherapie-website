/**
 * Fix remaining missing data-i18n attributes across public pages.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const FIXES = {
  'neuigkeiten.html': [
    [
      '<div class="kicker">Updates & News</div>',
      '<div class="kicker" data-i18n="newsPage.kicker">Updates & News</div>',
    ],
    [
      '<h1>Was ist neu?</h1>',
      '<h1 data-i18n="newsPage.title">Was ist neu?</h1>',
    ],
    [
      `<p class="sub">
        Aktuelle Neuigkeiten, Termine und Ankündigungen. Verpasse keine wichtigen Updates!
      </p>`,
      '<p class="sub" data-i18n="newsPage.sub">Aktuelle Neuigkeiten, Termine und Ankündigungen. Verpasse keine wichtigen Updates!</p>',
    ],
    [
      '<p style="color: var(--text-light); font-size: 1.1rem;">Neuigkeiten werden geladen…</p>',
      '<p style="color: var(--text-light); font-size: 1.1rem;" data-i18n="newsPage.loading">Neuigkeiten werden geladen…</p>',
    ],
    [
      '<p style="color: var(--text-light);">Noch keine Neuigkeiten vorhanden.</p>',
      '<p style="color: var(--text-light);" data-i18n="newsPage.empty">Noch keine Neuigkeiten vorhanden.</p>',
    ],
  ],

  'events.html': [
    [
      '<div class="kicker">Termine</div>',
      '<div class="kicker" data-i18n="eventsPage.kicker">Termine</div>',
    ],
    [
      '<h1>Events & Workshops</h1>',
      '<h1 data-i18n="eventsPage.title">Events & Workshops</h1>',
    ],
    [
      `<p class="sub">
        Kommende Events, Workshops und Gruppentherapien. Anmeldung per Kontakt.
      </p>`,
      '<p class="sub" data-i18n="eventsPage.sub">Kommende Events, Workshops und Gruppentherapien. Anmeldung per Kontakt.</p>',
    ],
    [
      '<p style="color: var(--text-light); font-size: 1.1rem;">Termine werden geladen...</p>',
      '<p style="color: var(--text-light); font-size: 1.1rem;" data-i18n="eventsPage.loading">Termine werden geladen...</p>',
    ],
    [
      '<p style="color: var(--text-light);">Momentan sind keine Events geplant.</p>',
      '<p style="color: var(--text-light);" data-i18n="eventsPage.empty">Momentan sind keine Events geplant.</p>',
    ],
    [
      '<p style="color: var(--text-light); font-size: 0.9rem; margin-top: 10px;">Meld dich gern bei Interesse an einer Gruppe oder einem Workshop.</p>',
      '<p style="color: var(--text-light); font-size: 0.9rem; margin-top: 10px;" data-i18n="eventsPage.emptyHint">Meld dich gern bei Interesse an einer Gruppe oder einem Workshop.</p>',
    ],
  ],

  'buchung.html': [
    // Calendar prev/next month buttons
    [
      'id="prevMonth" aria-label="Vorheriger Monat"',
      'id="prevMonth" data-i18n-aria-label="book.prevMonth" aria-label="Vorheriger Monat"',
    ],
    [
      'id="nextMonth" aria-label="Nächster Monat"',
      'id="nextMonth" data-i18n-aria-label="book.nextMonth" aria-label="Nächster Monat"',
    ],
    [
      'id="calendarGrid" class="booking-grid" role="grid" aria-label="Kalender"',
      'id="calendarGrid" class="booking-grid" role="grid" data-i18n-aria-label="book.calendarAria" aria-label="Kalender"',
    ],
  ],
};

let totalFiles = 0;
let totalChanges = 0;

for (const [file, replacements] of Object.entries(FIXES)) {
  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) { console.log(`  SKIP (not found): ${file}`); continue; }

  let html = fs.readFileSync(filePath, 'utf8');
  let changed = 0;

  for (const [find, replace] of replacements) {
    if (html.includes(find)) {
      html = html.split(find).join(replace);
      changed++;
    } else {
      console.log(`  WARNING: not found in ${file}: ${find.slice(0, 60).replace(/\n/g, '\\n')}…`);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`  ${file}: ${changed}/${replacements.length} replacement(s)`);
    totalFiles++;
    totalChanges += changed;
  }
}

console.log(`\nDone: ${totalChanges} replacements across ${totalFiles} files.`);
