(function () {
  if (!window.I18N_MESSAGES) window.I18N_MESSAGES = { de: {}, en: {} };
  const extra = { de: {
  "meta.atelier.title": "Mini-Atelier – Kunsttherapie Paderborn",
  "meta.atelier.description": "Ausprobieren im Mini-Atelier: Malen, Zeichnen und Kollage – optional anonym an das Atelier senden."
}, en: {
  "meta.atelier.title": "Mini Studio – Art Therapy Paderborn",
  "meta.atelier.description": "Try the mini studio: painting, drawing, and collage – optionally send artwork to the atelier anonymously."
} };
  Object.assign(window.I18N_MESSAGES.de, extra.de);
  Object.assign(window.I18N_MESSAGES.en, extra.en);
})();
