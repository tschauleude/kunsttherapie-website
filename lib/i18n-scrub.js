/** Gemeinsame Filter für Miet-/Vermiet-Formulierungen in CMS-Texten. */
const RENTED_COPY_PATTERN =
  /\b(angemietet\w*|gemietet\w*|gemiet\w*|vermiet\w*|untermiet\w*|miete\w*|mieter\w*|pacht\w*|rent(?:ed|ing|s|al)?|leas(?:ed|ing|e)?)\b/i;

const RENTED_PREFIX_PATTERN =
  /\b(angemietet\w*|gemietet\w*|gemiet\w*|vermietet\w*|untermietet\w*|rented|leased|rental)\s+/gi;

function containsRentedCopy(val) {
  return typeof val === 'string' && RENTED_COPY_PATTERN.test(val);
}

/** Entfernt führende Miet-/Vermiet-Begriffe (z. B. „Angemieteter Atelier…“ → „Atelier…“). */
function sanitizeRentedText(val) {
  if (typeof val !== 'string') return val;
  return val
    .replace(RENTED_PREFIX_PATTERN, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*[-–—]\s*/, '')
    .trim();
}

function scrubRentedOverrides(overrides) {
  const cleaned = { de: {}, en: {} };
  let changed = false;
  for (const lang of ['de', 'en']) {
    for (const [key, val] of Object.entries(overrides[lang] || {})) {
      if (typeof val !== 'string' || !val.trim()) continue;
      if (containsRentedCopy(val)) {
        changed = true;
        continue;
      }
      cleaned[lang][key] = val;
    }
  }
  return { overrides: cleaned, changed };
}

module.exports = {
  RENTED_COPY_PATTERN,
  RENTED_PREFIX_PATTERN,
  containsRentedCopy,
  sanitizeRentedText,
  scrubRentedOverrides,
};
