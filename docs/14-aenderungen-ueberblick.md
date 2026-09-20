# 14 – Was wurde geändert?

Überblick über alles, was zwischen dem **16. und 20. September 2026**
entstanden ist und mit PR #98 auf die Live-Seite kommt.

**Umfang:** 8 Commits · 48 Dateien · +2661 / −318 Zeilen.
Davon entfallen rund 530 Zeilen auf Programmcode, der Rest auf Dokumentation
und die automatisch gebauten Dateien.

---

## Für Martina in drei Sätzen

Auf der Website wurden drei Anzeigefehler behoben, die auf Handys und im
Buchungskalender auffielen. Im Admin-Panel steht jetzt neben jedem Bild, welches
Format und welche Größe dort hineingehören – und hochgeladene Fotos werden
automatisch verkleinert, sodass die Seite schnell bleibt. In der
Datenschutzerklärung stand der falsche Hoster; das ist korrigiert.

**Was sich für sie im Alltag ändert:** Sie kann Fotos direkt vom Handy
hochladen, ohne sie vorher zu verkleinern.

---

## 1. Was Besucher sehen

| Was | Vorher | Jetzt |
| --- | --- | --- |
| **Buchungskalender** | Vergangene Di/Do waren **rot als „ausgebucht"** und anklickbar – las sich wie „keine Kapazität" | Ausgegraut und gesperrt, Beschriftung „Vergangener Tag" |
| **Kalender-Legende** | Zeigte andere Farben als der Kalender selbst | Farben stimmen überein |
| **Seite „Über mich"** | Rund 760 px leere Fläche um das Porträt | Leerfläche auf 55 px reduziert, Bild füllt die Karte |
| **Preisseite am Handy** | „Gruppensitzung" brach mitten im Wort um | Beschriftung über dem Wert, Wort bleibt ganz |
| **Datenschutz am Handy** | Seite ließ sich bei 320 px seitlich verschieben | Kein seitliches Scrollen mehr |
| **Datenschutzerklärung** | Nannte „einem europäischen Hosting-Anbieter (z. B. Hostinger)" | Nennt korrekt **Strato AG, Berlin** |
| **Tippziele am Handy** | Sprachumschalter 23 px, Zitat-Punkte **7 px** | Alle mindestens 24 px (WCAG 2.2) |

> Der Datenschutz-Punkt ist kein Schönheitsfehler: Es war eine falsche Angabe
> zum Auftragsverarbeiter. Der korrigierte Wortlaut sollte Martina noch zur
> Freigabe vorgelegt werden – es ist ihr Rechtstext.

## 2. Was sich im Admin-Panel ändert

- **Bildempfehlungen** neben jedem der 13 Bild-Slots: Format, Pixelmaße und ein
  Hinweis zum Bildausschnitt. Dieselbe Information bei Neuigkeiten,
  Veranstaltungen und über der Mediathek.
  Die Werte sind im Browser gemessen, nicht geschätzt.
- **Favicon** im Admin-Panel (vorher ein 404 auf `/favicon.ico`).
- Der Hinweis beim ersten Admin-Konto nannte „Hostinger .env" – korrigiert.

## 3. Technische Änderungen

**Bilder werden beim Hochladen optimiert** (`lib/image-optimize.js`, neu).
Bisher ging eine hochgeladene Datei unverändert an jeden Besucher – ein
Handy-Foto mit 6 MB blieb ein 6-MB-Foto. Jetzt: auf max. 1600 px verkleinert
und neu komprimiert. Gemessen über die echte Programmschnittstelle:
**2795 KB → 264 KB, also −91 %.**

Dabei wird die Drehung aus den EXIF-Daten **vorher** angewendet – sonst lägen
hochkant aufgenommene Fotos anschließend quer auf der Seite. GIFs bleiben
unangetastet, damit Animationen erhalten bleiben. Schlägt die Optimierung fehl,
bleibt das Original liegen; ein misslungener Versuch lässt den Upload nie
scheitern.

Wirksam in allen vier Upload-Wegen: Bild-Slots, Mediathek, allgemeiner Upload
und Mini-Atelier.

**Weitere Änderungen:**

| Datei | Änderung |
| --- | --- |
| `scripts/check-google-calendar.js` (neu) | `npm run check-google` prüft die Kalenderanbindung inklusive echtem Zugriff |
| `.env.example` | `MAX_FILE_SIZE` von 50 MB auf 5 MB; neue Variablen `UPLOAD_MAX_WIDTH`, `UPLOAD_MAX_HEIGHT`, `UPLOAD_QUALITY` |
| `.gitignore` | `public/uploads/` ergänzt – verhindert, dass Besucher-Einsendungen versehentlich im Repository landen |
| `server.js` | Optimierung in die Upload-Routen eingehängt; veraltete Hostinger-Kommentare korrigiert |
| `README.md` | Beschrieb ein statisches Projekt ohne Datenbank mit Netlify-Deployment – ersetzt |

## 4. Neue Dokumentation

14 Dokumente unter `docs/`, alle gegen den Code geprüft: Architektur, Setup,
API-Referenz, Datenbank, Textsystem, **Admin-Handbuch für Martina**, Betrieb,
Google-Kalender, Review, Terminvorbereitung, Deployment und diese Übersicht.

Die alte `GOOGLE-KALENDER-ANLEITUNG.md` im Projekt-Root ist als fehlerhaft
markiert: Sie nennt den Google-Testmodus als ausreichend – dort laufen die
Zugangstoken aber nach 7 Tagen ab, und die Website zeigt danach alle Termine als
frei an, ohne Fehlermeldung.

---

## 5. Was geprüft wurde

Alles im echten Browser, nicht nur im Code gelesen.

**Formulare – jeweils bis in die Datenbank verfolgt:**

| Formular | Ergebnis |
| --- | --- |
| Kontaktformular | Abgesendet → 200, Eintrag angelegt, Status `pending_verification` |
| Bestätigungslink Kontakt | → `verified`, Token danach gelöscht (einmalig nutzbar) |
| Terminbuchung | Kalender → Zeitfenster → abgesendet → 200, Eintrag mit Datum und Uhrzeit |
| Bestätigungslink Buchung | → `pending`, Token gelöscht |
| Veranstaltungs-Anmeldung | → 200, Eintrag angelegt |
| Mini-Atelier-Einsendung | → 200, Datei gespeichert **und optimiert** |

**Bedienelemente:** alle Links in Kopf- und Fußzeile, Sprachumschalter DE/EN
(hin und zurück), Galerie-Lightbox (öffnen und mit Escape schließen),
Zitat-Punkte, Zurück-nach-oben-Button. 23 Prüfungen, keine Fehler.

**Admin-Panel:** Anmeldung (falsches Passwort wird abgewiesen), alle zehn
Bereiche, Neuigkeit speichern, Texte speichern, Sicherungspunkt anlegen,
Preistabelle speichern, Abmelden.

**Darstellung:** alle 12 Seiten bei neun Bildschirmbreiten von 320 px bis
2560 px. Kein seitliches Scrollen, keine Tippziele unter 24 px. Admin-Panel
bei 375, 768 und 1280 px mitgeprüft.

### Was nicht geprüft werden konnte

Die öffentliche Domain war aus der Prüfumgebung nicht erreichbar. Deshalb ließ
sich **nicht** prüfen:

- ob E-Mails tatsächlich zugestellt werden (lokal ist kein SMTP konfiguriert)
- die echte Google-Kalender-Verbindung
- reale Ladezeiten und Suchmaschinen-Indexierung

Diese Punkte stehen als Schritt 6 und 7 in
[13 – Deployment](13-deployment-schritt-fuer-schritt.md) und sind nach dem
Aufspielen abzuarbeiten.

---

## 6. Was offen bleibt

**Nur Martina kann entscheiden:**

1. Die Seite wirbt an mehreren Stellen mit „Neue Gruppen ab 1. Juli 2026"
2. **Widerspruch:** Die Preisseite sagt 60 Minuten, das Buchungssystem vergibt
   90-Minuten-Slots (11:00–12:30). Kunden buchen etwas anderes, als sie lesen.
3. Letzte Neuigkeit stammt vom Juni

**Technisch offen:**

- Fällt der Google-Kalender aus, zeigt die Website **alle Zeiten als frei** –
  der Fehler landet nur im Log. Siehe [09 – Review](09-website-review.md), B2.
- `npm audit` meldet 15 Schwachstellen, alle über `tar`/`cacache` aus `sqlite3`.
  Die laufen beim Installieren, nicht beim Ausliefern von Seiten – über das Web
  nicht erreichbar. Behebung wäre ein größerer Versionssprung.
- Das Hero-Standardbild ist Querformat in einem Hochformat-Rahmen; über die
  Hälfte der Breite wird abgeschnitten. Löst sich, sobald ein passendes Bild
  hochgeladen wird – die Empfehlung steht jetzt daneben.
- `logo.jpg` und `Sonnige_Pinsel.jpg` liegen mit je 2,5 MB unreferenziert im
  Projekt-Root. Löschen erst nach Bestätigung.
