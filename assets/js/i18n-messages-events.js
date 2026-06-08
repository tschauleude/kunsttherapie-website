(function () {
  if (!window.I18N_MESSAGES) window.I18N_MESSAGES = { de: {}, en: {} };
  const extra = { de: {
  "meta.events.title": "Veranstaltungen – Kunsttherapie Paderborn",
  "meta.events.description": "Workshops, Teambuilding und Veranstaltungen in Paderborn.",
  "eventsPage.kicker": "Termine",
  "eventsPage.title": "Events & Workshops",
  "eventsPage.sub": "Kommende Events, Workshops und Gruppentherapien. Anmeldung per Kontakt und sei dabei!",
  "eventsPage.loading": "Termine werden geladen …",
  "eventsPage.empty": "Momentan sind keine Events geplant.",
  "eventsPage.emptyHint": "Schreib mir gern über das Kontaktformular, wenn du Interesse an einem Workshop hast.",
  "eventsPage.signUp": "Anmelden",
  "eventsPage.cardDate": "Termin",
  "eventsPage.metaTime": "Uhrzeit: {value}",
  "eventsPage.metaLocation": "Ort: {value}",
  "eventsPage.metaCapacity": "{value} Plätze",
  "eventsPage.error": "Termine konnten gerade nicht geladen werden. Bitte später erneut versuchen."
}, en: {
  "meta.events.title": "Events – Art Therapy Paderborn",
  "meta.events.description": "Workshops, team building, and events in Paderborn.",
  "eventsPage.kicker": "Dates",
  "eventsPage.title": "Events & workshops",
  "eventsPage.sub": "Upcoming events, workshops, and group sessions. Register and join in!",
  "eventsPage.loading": "Loading events …",
  "eventsPage.empty": "No events are scheduled at the moment.",
  "eventsPage.emptyHint": "Feel free to message me via the contact form if you're interested in a workshop.",
  "eventsPage.signUp": "Register",
  "eventsPage.cardDate": "Event",
  "eventsPage.metaTime": "Time: {value}",
  "eventsPage.metaLocation": "Location: {value}",
  "eventsPage.metaCapacity": "{value} places",
  "eventsPage.error": "Events could not be loaded right now. Please try again later."
} };
  Object.assign(window.I18N_MESSAGES.de, extra.de);
  Object.assign(window.I18N_MESSAGES.en, extra.en);
})();
