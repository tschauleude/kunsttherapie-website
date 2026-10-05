/**
 * Deutsche Preistabelle ins Englische übertragen.
 *
 * Hintergrund: Die englische Tabelle entstand als Kopie der deutschen, damit in
 * beiden Sprachen dieselben Preise stehen. Übersetzt waren die Bezeichnungen
 * damit aber nicht.
 *
 * Grundsatz hier: **Zahlen werden nie angefasst.** Übersetzt werden nur die
 * Wörter drumherum. Was nicht im Wörterbuch steht, bleibt unverändert stehen –
 * lieber ein deutsches Wort als eine erfundene Übersetzung in einer Preisliste.
 *
 * Die Formulierungen stammen aus der gepflegten englischen Fassung in
 * assets/js/i18n-messages-pages.js, nicht aus einer freien Übersetzung.
 */

/** Ganze Begriffe, die als vollständige Zelle vorkommen. */
const ZELLEN = new Map([
  ['Gruppensitzung', 'Group session'],
  ['Auszeit – Familie & Freunde', 'Downtime – family & friends'],
  ['Auszeit - Familie & Freunde', 'Downtime – family & friends'],
  ['Auszeit', 'Downtime'],
  ['Einzelsitzung', 'One-to-one session'],
  ['Teambuilding', 'Team building'],
  ['Vortrag', 'Talk'],
  ['Workshop', 'Workshop'],
  ['nach Konzept', 'by concept'],
  ['nach Absprache', 'by arrangement'],
  ['auf Anfrage', 'on request'],
  ['Preis auf Anfrage', 'price on request'],
  ['individuell auf dein Thema abgestimmt', 'tailored to your theme'],
  ['individuell abgestimmt', 'individually tailored'],
  ['nur als Gruppe buchbar, Material i. d. R. inkl.', 'group booking only, materials usually incl.'],
]);

/** Wortgruppen, die innerhalb einer Zelle ersetzt werden. Reihenfolge zählt. */
const TEILE = [
  [/\bMinuten\b/g, 'minutes'],
  [/\bMinute\b/g, 'minute'],
  [/\bStunden\b/g, 'hours'],
  [/\bStunde\b/g, 'hour'],
  [/\bpro Person\b/g, 'per person'],
  [/\bpro Teilnehmer(in)?\b/g, 'per participant'],
  [/\bpro Gruppe\b/g, 'per group'],
  [/\bab (\d+) Teilnehmer(in)?(n)?\b/g, 'from $1 participants'],
  [/\bab (\d+) Personen\b/g, 'from $1 people'],
  [/\bTeilnehmer(in)?(n)?\b/g, 'participants'],
  [/\bPersonen\b/g, 'people'],
  [/\bPerson\b/g, 'person'],
  [/\bMaterial(ien)? i\. ?d\. ?R\. ?inkl\.?/g, 'materials usually incl.'],
  [/\bMaterial(ien)? inklusive\b/g, 'materials included'],
  [/\bMaterial(ien)? inkl\.?/g, 'materials incl.'],
  [/\bKonzept & /g, 'concept & '],
  [/\bnur als Gruppe buchbar\b/g, 'group booking only'],
  [/\bje\b/g, 'each'],
  [/\binkl\.\s*/g, 'incl. '],
  [/\bzzgl\.\s*/g, 'plus '],
];

/** „39 €" → „€39" – im Englischen steht das Zeichen vorn. */
function waehrungUmstellen(text) {
  return text.replace(/(\d[\d.,]*)\s*€/g, '€$1');
}

/**
 * Eine Zelle übersetzen. Zahlen bleiben unverändert; unbekannte Formulierungen
 * bleiben stehen.
 */
function uebersetzeZelle(wert) {
  if (typeof wert !== 'string') return wert;
  const roh = wert.trim();
  if (!roh) return wert;

  const ganz = ZELLEN.get(roh);
  if (ganz) return ganz;

  let out = roh;
  for (const [suchen, ersetzen] of TEILE) out = out.replace(suchen, ersetzen);
  return waehrungUmstellen(out);
}

const SPALTEN = new Map([
  ['Leistung', 'Service'],
  ['Angebot', 'Service'],
  ['Dauer', 'Duration'],
  ['Preis', 'Price'],
  ['Hinweis', 'Note'],
  ['Bemerkung', 'Note'],
]);

/** Komplette Tabelle übersetzen. */
function uebersetzeTabelle({ columns = [], rows = [] } = {}) {
  return {
    columns: columns.map((c) => SPALTEN.get(String(c).trim()) || uebersetzeZelle(c)),
    rows: rows.map((zeile) => zeile.map(uebersetzeZelle)),
  };
}

/** Steht in der Tabelle noch Deutsches, das wir nicht übersetzen konnten? */
function enthaeltDeutsch({ columns = [], rows = [] } = {}) {
  const verdacht = /\b(und|oder|nicht|Minuten?|Stunden?|Person(en)?|Teilnehmer|Material|Leistung|Dauer|Preis|Hinweis|Gruppe|Sitzung|inkl|zzgl|nach|auf Anfrage)\b/;
  return [...columns, ...rows.flat()].some((z) => typeof z === 'string' && verdacht.test(z));
}

module.exports = { uebersetzeTabelle, uebersetzeZelle, enthaeltDeutsch };
