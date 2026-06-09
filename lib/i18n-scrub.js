/** Gemeinsame Filter für Miet-/Vermiet-Formulierungen in CMS-Texten. */
const RENTED_COPY_PATTERN =
  /\b(angemietet\w*|gemietet\w*|gemiet\w*|vermiet\w*|untermiet\w*|miete\w*|mieter\w*|pacht\w*|rent(?:ed|ing|s|al)?|leas(?:ed|ing|e)?)\b/i;

function containsRentedCopy(val) {
  return typeof val === 'string' && RENTED_COPY_PATTERN.test(val);
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
  containsRentedCopy,
  scrubRentedOverrides,
};
