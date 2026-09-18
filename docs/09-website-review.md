# Website-Review

Stand: 16.09.2026 · Fixes vom 17.09.2026 eingearbeitet

## Wie geprüft wurde

Die öffentliche Domain `kunsttherapie-pb.de` war aus der Prüfumgebung nicht
erreichbar (Egress-Policy blockte die Verbindung). Geprüft wurde deshalb
**derselbe Code, der auch live läuft** (Stand `main`, Commit `2e049f5`), lokal
gestartet und im echten Browser gerendert:

- Alle 12 öffentlichen Seiten in Desktop (1440 px) und Mobil (iPhone 13)
- Automatisierte Prüfung auf Meta-Daten, Überschriftenstruktur, Alt-Texte,
  Formular-Labels, JS-Fehler, fehlgeschlagene Requests, horizontales Überlaufen
- Buchungs-API und Kalenderlogik gegen den tatsächlichen Monat September 2026
- Build (`npm run build-frontend`) und QA (`npm run qa`) – beide laufen sauber durch

**Nicht geprüft werden konnte** (braucht die Live-Umgebung): reale Ladezeiten,
TLS/Weiterleitungen der echten Domain, Suchmaschinen-Indexierung, E-Mail-Zustellung,
der real verbundene Google-Kalender und die Inhalte der Live-Datenbank
(Neuigkeiten, Veranstaltungen, Preistabelle können dort abweichen).

---

## Gesamteindruck

Die Seite ist in einem **guten, gepflegten Zustand**. Was auffällt, sind keine
groben Baustellen, sondern Detailfehler und veraltete Inhalte.

Was solide ist:

- Sauberes, ruhiges Design mit konsistenter Bildsprache; wirkt der Zielgruppe angemessen
- Jede Seite hat genau eine `h1`, sinnvolle Titles (35–69 Zeichen) und Meta-Descriptions
- Canonical-Tags, Open-Graph-Bilder und `LocalBusiness`-/`FAQPage`-Strukturdaten auf allen Seiten
- Zweisprachig DE/EN, 488 Schlüssel vollständig gepflegt, keine Platzhaltertexte
- Kein horizontales Überlaufen, auch mobil nicht; alle Formularfelder haben Labels; Skip-Link vorhanden
- Keine JavaScript-Fehler, keine kaputten Bilder
- Datenschutz solide: Double-Opt-in für Kontakt und Buchung, Honeypot- und Zeitfallen gegen Bots, Rate-Limits, strenge CSP

---

## Befunde nach Priorität

### A – Inhaltlich, vor dem Termin klären

**A1 · Die Seite wirbt mit einem Datum aus der Vergangenheit.**
„Neue Gruppen ab 1. Juli 2026" steht auf Startseite, Kunsttherapie-Seite und
Kontaktseite (u. a. `index.html:203`, `kunsttherapie.html:445`, `kontakt.html:124`,
sowie in den i18n-Texten). Heute ist Mitte September. Für Besucher wirkt die Seite
dadurch stehengeblieben. → Mit Martina neu formulieren („laufend", „Einstieg
jederzeit möglich" oder ein aktuelles Datum).

**A2 · Widerspruch Sitzungsdauer: 60 oder 90 Minuten?**
Die Preisseite sagt „Gruppe, Auszeit und Einzelsitzung dauern jeweils **60 Minuten**"
und führt alle Positionen mit „60 Minuten". Das Buchungssystem vergibt dagegen
**90-Minuten-Slots** (Di 11:00–12:30, Do 18:00–19:30; `BOOKING_SLOT_MINUTES=90`).
Ein Kunde bucht also 90 Minuten und liest 60. → Klären, was stimmt; danach
entweder Preistexte oder `BOOKING_SLOT_MINUTES` angleichen.

**A3 · Neuigkeiten sind vom Juni.**
`news.json` enthält zwei Einträge vom 01.06. und 05.06.2026. Ob live etwas
Neueres aus der Datenbank kommt, ließ sich von hier nicht prüfen – aber
„Neuigkeiten" ist die Seite, an der Besucher Aktualität ablesen. → Im Termin
gemeinsam zwei, drei aktuelle Einträge anlegen (geht direkt im Admin-Panel).

**A5 · Die Datenschutzerklärung nannte den falschen Hoster.** ✅ *behoben am 18.09.2026*
Nachgetragen am 18.09.2026, nachdem bestätigt wurde, dass der Server ein
**Strato VPS** ist.

`datenschutz.html` enthielt unter „3. Hosting" bereits die korrekte Angabe
(„Strato AG, Otto-Ostrowski-Straße 7, 10249 Berlin"). Der i18n-Text
`legal.privacy.body` überschrieb sie zur Laufzeit aber durch „einem
europäischen Hosting-Anbieter (z.&nbsp;B. Hostinger)" – in DE und EN. Im
Browser gegengeprüft: Besucher bekamen den falschen Hoster zu sehen.

In einer Datenschutzerklärung ist das keine Kosmetik, sondern eine falsche
Angabe zum Auftragsverarbeiter.

*Behoben:* Wortlaut in `assets/js/i18n-messages-pages.js` (Quelle, DE und EN)
an die Angabe in `datenschutz.html` angeglichen, neu gebaut und im Browser in
beiden Sprachen verifiziert.

> Hinweis: Das ist Martinas Rechtstext. Der Wortlaut sollte ihr zur Freigabe
> vorgelegt werden – inhaltlich ist er jetzt korrekt, die Formulierung ist
> aber ihre Entscheidung.

**A4 · `sitemap.xml` ist statisch auf `2026-06-17` datiert.**
Sie wird nicht automatisch aktualisiert. Unkritisch, aber ein schwaches Signal
Richtung Suchmaschinen.

---

### B – Buchung und Kalender, funktional

**B1 · Vergangene Di/Do werden als „Ausgebucht" angezeigt und bleiben klickbar.** ✅ *behoben am 17.09.2026*
Verifiziert für September 2026: Der 1., 3., 8. und 10. September liefern
`workingDay: true, hasAvailability: false`, weil die Vorlauffrist alle Slots
entfernt. Das Frontend rendert daraus `booking-day-busy` – rot eingefärbt, mit
`cursor: pointer` und **ohne** `disabled` (`assets/js/booking.js:156–178`).

Zwei Folgen: Besucher sehen die erste Monatshälfte rot als „ausgebucht" – das
liest sich wie „keine Kapazität", obwohl die Tage schlicht vorbei sind. Und sie
können auf ein vergangenes Datum klicken, das dann keine Slots zeigt.
→ Vergangene Tage wie Nicht-Ateliertage behandeln: ausgegraut und `disabled`.

*Behoben:* `assets/js/booking.js` kennt jetzt den Zustand `booking-day-past`
(neuer i18n-Schlüssel `book.dayPast`, DE und EN). Geprüft für September 2026:
Die Tage 1–16 sind ausgegraut und gesperrt, der 17. bleibt als heutiger Tag
anklickbar, die freien Tage 22./24./29. sind unverändert grün.

**B2 · Fällt der Google-Kalender aus, zeigt die Website alles als frei.**
`server.js:706–716` fängt Fehler der Kalenderabfrage ab, loggt sie und macht mit
einer leeren Belegungsliste weiter. Ein abgelaufener Token oder eine API-Störung
führt also nicht zu einer Warnung, sondern dazu, dass belegte Zeiten buchbar
erscheinen → Doppelbuchungen. Verschärft wird das durch den 7-Tage-Ablauf von
Refresh-Tokens im Google-Testmodus (siehe [08](08-google-kalender.md)).
→ Mindestens: Fehlerzustand im Admin-Panel sichtbar machen. Sauberer: bei
Kalenderfehler keine neuen Slots freigeben.

**B3 · Kalender-Legende stimmt farblich nicht mit dem Kalender überein.** ✅ *behoben am 17.09.2026*
`assets/css/style.css:3870–3926`: Die Legende zeigt „Ausgebucht" als **grauen**
Punkt (`#c4c4c4`) und „Kein Ateliertag" als **beigen** (`#ebe8e3`). Im Kalender
sind ausgebuchte Tage aber **rosa/rot** (`rgba(209,141,137,…)`) und Nicht-Ateliertage
**grau** (`rgba(0,0,0,.04)`). Die Legende erklärt damit die falschen Farben.
→ Legendenfarben an die Zellenfarben angleichen.

*Behoben:* `legend-busy` ist jetzt `var(--color-rose)`, `legend-off` ein Grauton.
Legende und Kalender zeigen denselben Farbton.

---

### C – Darstellung

**C1 · Großer leerer Block über dem Porträt auf `/ueber-mich`.** ✅ *behoben am 17.09.2026*
Der Bildrahmen wächst durch `flex: 1 1 auto` auf 532 × 1371 px, während das Bild
mit `object-fit: contain` sein Seitenverhältnis (1060 × 1216) behält – darüber
bleiben rund 380 px leere Fläche (`assets/css/style.css:622–643`). Auf dem Desktop
sieht die Porträtkarte dadurch halb leer aus.
→ Entweder `object-fit: cover` oder den Rahmen nicht mitwachsen lassen (`flex: 0 0 auto`).

*Behoben:* Nicht über `cover` – bei einem Rahmen von 532 × 1371 px hätte das
über die Hälfte der Bildbreite abgeschnitten und das Gesicht beschädigt.
Stattdessen streckt sich die Porträtkarte nicht mehr auf Texthöhe
(`align-items: start`, `flex: 0 0 auto`). Der Rahmen misst jetzt 532 × 665 px,
die Leerfläche sank von 761 px auf 55 px, aufgeteilt auf oben und unten.
Mobil unverändert ohne horizontales Überlaufen.

**C2 · Text über der Falz blendet erst ein.**
Auf `/buchung` (und analog anderswo) sind Kicker, Überschrift und Einleitung
zunächst unsichtbar und werden per Reveal-Animation eingeblendet; vollständig
sichtbar waren sie erst ~2 Sekunden nach dem Laden. Auf langsamen Verbindungen
sieht der erste Eindruck dadurch leer aus. `prefers-reduced-motion` wird korrekt
respektiert. → Erwägen, Inhalte oberhalb der Falz von der Animation auszunehmen.

**C3 · ~~Ein Bild ohne Alt-Text.~~ — Fehlalarm, zurückgezogen.**
Ursprünglich gemeldet für den Lazy-Loading-Platzhalter auf Startseite und
Kunsttherapie-Seite. Bei der Nachprüfung stellte sich heraus: Beide Platzhalter
(`assets/js/gallery.js:53`, `assets/js/raum-showcase.js`) setzen korrekt `alt=""` –
genau richtig für dekorative Bilder. Der Fehler lag im Prüfskript, das mit
`!img.getAttribute('alt')` testete; ein leerer String ist in JavaScript falsy,
weshalb korrekt ausgezeichnete Bilder als fehlerhaft gemeldet wurden.
**Hier ist nichts zu tun.**

**C4 · Der Barrierefreiheits-Button überlagert mobil Inhalte.**
Der runde Button unten links liegt beim Scrollen über den Zeit-Chips auf der
Startseite. Funktional in Ordnung, optisch unschön.

---

### D – Kleinigkeiten

- **D1** Auf jeder Seite liegt ein drittes JSON-LD-Script ohne `@type`. Kein Fehler, aber wirkungslos – prüfen, ob es Inhalt haben sollte.
- **D2** Die Google-Maps-Karte auf `/kontakt` wird von `maps.google.com` eingebettet. Erst nach Consent geladen – datenschutzrechtlich sauber gelöst.
- **D3** Der Bestätigungstext nach dem Google-Verbinden verweist auf einen Refresh-Token „im Admin-Panel", der dort bewusst nicht angezeigt wird (`server.js:2605`). Irreführend, sollte umformuliert werden.

---

## Vorschlag zur Reihenfolge

1. **Mit Martina klären** (nur sie kann entscheiden): A1 Datumstexte, A2 Sitzungsdauer, A3 aktuelle Neuigkeiten
2. **Vor dem Google-Livegang**: Veröffentlichungsstatus auf Produktion ([08](08-google-kalender.md)), danach B2 zumindest sichtbar machen
3. ~~**Kleine, risikoarme Fixes**: B1, B3, C1~~ – erledigt am 17.09.2026
4. **Danach**: C2, D1, D3, A4

Keiner dieser Punkte ist ein Notfall. Die Seite läuft.
