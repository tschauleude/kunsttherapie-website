/**
 * Single source of truth for public group-session pricing (DE site).
 * Used by build-frontend.js to sync JSON-LD and validate i18n strings.
 */
module.exports = {
  priceRange: 'ab 39 €',
  groupPriceDe: '39 €',
  groupPriceEn: '€39',
  groupDurationMin: 60,
  groupSizeMin: 4,
  groupSizeMax: 12,
  priceHintDe: 'Gruppensitzung 60 Min · 4–12 Personen · ab 39 € · Material i. d. R. inkl.',
  priceHintEn: 'Group session 60 min · 4–12 people · from €39 · materials usually incl.',
  factsMetaDe: '60 Min · 4–12 Personen · ab 39 €',
  factsMetaEn: '60 min · 4–12 people · from €39',
};
