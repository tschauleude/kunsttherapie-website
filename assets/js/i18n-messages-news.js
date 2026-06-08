(function () {
  if (!window.I18N_MESSAGES) window.I18N_MESSAGES = { de: {}, en: {} };
  const extra = { de: {
  "meta.news.title": "Neuigkeiten – Kunsttherapie Paderborn",
  "meta.news.description": "Aktuelles aus dem Atelier: Termine, Raum und Ankündigungen.",
  "newsPage.kicker": "Updates & News",
  "newsPage.title": "Was ist neu?",
  "newsPage.sub": "Aktuelle Neuigkeiten, Termine und Ankündigungen. Verpasse keine wichtigen Updates!",
  "newsPage.loading": "Laden …",
  "newsPage.empty": "Noch keine Neuigkeiten vorhanden.",
  "newsPage.error": "Aktuelles konnte gerade nicht geladen werden. Bitte später erneut versuchen."
}, en: {
  "meta.news.title": "News – Art Therapy Paderborn",
  "meta.news.description": "Updates from the atelier: appointments, studio news, and announcements.",
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
