/**
 * Single source of truth for public group-session pricing (DE site).
 * Used by build-frontend.js to sync JSON-LD and validate i18n strings.
 */
module.exports = {
  priceRange: 'ab 39 €',
  groupPriceDe: '39 €',
  groupPriceEn: '€39',
  groupDurationMin: 90,
  groupSizeMin: 4,
  groupSizeMax: 12,
  priceHintDe: 'Gruppensitzung 90 Min · 4–12 Personen · ab 39 € · Material inkl.',
  priceHintEn: 'Group session 90 min · 4–12 people · from €39 · materials incl.',
  factsMetaDe: '90 Min · 4–12 Personen · ab 39 €',
  factsMetaEn: '90 min · 4–12 people · from €39',
};
