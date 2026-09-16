# Website-Review

Stand: 16.09.2026

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

**A4 · `sitemap.xml` ist statisch auf `2026-06-17` datiert.**
Sie wird nicht automatisch aktualisiert. Unkritisch, aber ein schwaches Signal
Richtung Suchmaschinen.

---

### B – Buchung und Kalender, funktional

**B1 · Vergangene Di/Do werden als „Ausgebucht" angezeigt und bleiben klickbar.**
Verifiziert für September 2026: Der 1., 3., 8. und 10. September liefern
`workingDay: true, hasAvailability: false`, weil die Vorlauffrist alle Slots
entfernt. Das Frontend rendert daraus `booking-day-busy` – rot eingefärbt, mit
`cursor: pointer` und **ohne** `disabled` (`assets/js/booking.js:156–178`).

Zwei Folgen: Besucher sehen die erste Monatshälfte rot als „ausgebucht" – das
liest sich wie „keine Kapazität", obwohl die Tage schlicht vorbei sind. Und sie
können auf ein vergangenes Datum klicken, das dann keine Slots zeigt.
→ Vergangene Tage wie Nicht-Ateliertage behandeln: ausgegraut und `disabled`.

**B2 · Fällt der Google-Kalender aus, zeigt die Website alles als frei.**
`server.js:706–716` fängt Fehler der Kalenderabfrage ab, loggt sie und macht mit
einer leeren Belegungsliste weiter. Ein abgelaufener Token oder eine API-Störung
führt also nicht zu einer Warnung, sondern dazu, dass belegte Zeiten buchbar
erscheinen → Doppelbuchungen. Verschärft wird das durch den 7-Tage-Ablauf von
Refresh-Tokens im Google-Testmodus (siehe [08](08-google-kalender.md)).
→ Mindestens: Fehlerzustand im Admin-Panel sichtbar machen. Sauberer: bei
Kalenderfehler keine neuen Slots freigeben.

**B3 · Kalender-Legende stimmt farblich nicht mit dem Kalender überein.**
`assets/css/style.css:3870–3926`: Die Legende zeigt „Ausgebucht" als **grauen**
Punkt (`#c4c4c4`) und „Kein Ateliertag" als **beigen** (`#ebe8e3`). Im Kalender
sind ausgebuchte Tage aber **rosa/rot** (`rgba(209,141,137,…)`) und Nicht-Ateliertage
**grau** (`rgba(0,0,0,.04)`). Die Legende erklärt damit die falschen Farben.
→ Legendenfarben an die Zellenfarben angleichen.

---

### C – Darstellung

**C1 · Großer leerer Block über dem Porträt auf `/ueber-mich`.**
Der Bildrahmen wächst durch `flex: 1 1 auto` auf 532 × 1371 px, während das Bild
mit `object-fit: contain` sein Seitenverhältnis (1060 × 1216) behält – darüber
bleiben rund 380 px leere Fläche (`assets/css/style.css:622–643`). Auf dem Desktop
sieht die Porträtkarte dadurch halb leer aus.
→ Entweder `object-fit: cover` oder den Rahmen nicht mitwachsen lassen (`flex: 0 0 auto`).

**C2 · Text über der Falz blendet erst ein.**
Auf `/buchung` (und analog anderswo) sind Kicker, Überschrift und Einleitung
zunächst unsichtbar und werden per Reveal-Animation eingeblendet; vollständig
sichtbar waren sie erst ~2 Sekunden nach dem Laden. Auf langsamen Verbindungen
sieht der erste Eindruck dadurch leer aus. `prefers-reduced-motion` wird korrekt
respektiert. → Erwägen, Inhalte oberhalb der Falz von der Animation auszunehmen.

**C3 · Ein Bild ohne Alt-Text.**
Auf Startseite und Kunsttherapie-Seite hat der transparente Lazy-Loading-Platzhalter
kein `alt`. Kosmetisch, in einem Accessibility-Audit taucht es aber auf.
→ `alt=""` setzen, damit Screenreader ihn überspringen.

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
3. **Kleine, risikoarme Fixes**: B1, B3, C1, C3 – jeweils wenige Zeilen, klar abgegrenzt
4. **Danach**: C2, D1, D3, A4

Keiner dieser Punkte ist ein Notfall. Die Seite läuft.
