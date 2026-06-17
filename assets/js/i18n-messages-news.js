(function () {
  if (!window.I18N_MESSAGES) window.I18N_MESSAGES = { de: {}, en: {} };
  const extra = { de: {
  "meta.news.title": "Neuigkeiten – Kunsttherapie Paderborn & OWL",
  "meta.news.description": "Aktuelles aus dem Kunsttherapie-Atelier in Paderborn: neue Gruppen, Termine und Ankündigungen für OWL.",
  "newsPage.kicker": "Updates & News",
  "newsPage.title": "Was ist neu?",
  "newsPage.sub": "Aktuelle Neuigkeiten, Termine und Ankündigungen. Verpasse keine wichtigen Updates!",
  "newsPage.loading": "Laden …",
  "newsPage.empty": "Noch keine Neuigkeiten vorhanden.",
  "newsPage.error": "Aktuelles konnte gerade nicht geladen werden. Bitte später erneut versuchen."
}, en: {
  "meta.news.title": "News – Art Therapy Paderborn & OWL",
  "meta.news.description": "Latest from the art therapy studio in Paderborn: new groups, dates and announcements for OWL.",
  "newsPage.kicker": "Updates & news",
  "newsPage.title": "What is new?",
  "newsPage.sub": "Current news, dates, and announcements. Do not miss important updates!",
  "newsPage.loading": "Loading …",
  "newsPage.empty": "No news yet.",
  "newsPage.error": "News could not be loaded right now. Please try again later."
} };
  Object.assign(window.I18N_MESSAGES.de, extra.de);
  Object.assign(window.I18N_MESSAGES.en, extra.en);
})();
