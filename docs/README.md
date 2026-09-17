# Dokumentation – Kunsttherapie Paderborn

Technische und redaktionelle Dokumentation für die Website und das CMS von
Martina Schwierzke (kunsttherapie-pb.de).

Stand: 16.09.2026 · geprüft gegen den Code in `main`

---

## Inhalt

| Dokument | Für wen | Inhalt |
| --- | --- | --- |
| [01 – Architektur](01-architektur.md) | Entwicklung | Aufbau, Verzeichnisse, Request-Flow, Sicherheit |
| [02 – Entwicklung & Setup](02-entwicklung.md) | Entwicklung | Lokal starten, `.env`, npm-Skripte, QA |
| [03 – API-Referenz](03-api.md) | Entwicklung | Alle HTTP-Endpunkte, öffentlich und Admin |
| [04 – Datenbank](04-datenbank.md) | Entwicklung | SQLite-Schema, Backups |
| [05 – Inhalte & i18n](05-inhalte-i18n.md) | Entwicklung / Redaktion | Textsystem DE/EN, Build-Pipeline, Bild-Slots |
| [06 – Admin-Handbuch](06-admin-handbuch.md) | Praxis (nicht-technisch) | Texte, Bilder, Preise, Termine pflegen |
| [07 – Betrieb & Deployment](07-betrieb-deployment.md) | Betrieb | Deployment, CI, Backups, Monitoring, Störungen |
| [08 – Google Kalender](08-google-kalender.md) | Betrieb / Praxis | Kalender verbinden, Schritt für Schritt |
| [09 – Website-Review](09-website-review.md) | alle | Geprüfter Stand vom 16.09.2026, Befunde nach Priorität |
| [10 – Termin-Vorbereitung](10-termin-vorbereitung.md) | intern | Ablauf und offene Fragen für den Termin mit der Inhaberin |
| [11 – Automatisches Deployment](11-automatisches-deployment.md) | Betrieb | Automatischen Upload auslösen und verifizieren, inkl. fertigem Prompt |
| [12 – Google-Live-Checkliste](12-google-live-checkliste.md) | intern | Zum Abhaken während des Termins, inkl. Prüfschritt |

---

## Das Projekt in drei Sätzen

Die Website ist **keine rein statische Seite**, sondern eine Express-Anwendung
(`server.js`), die die HTML-Seiten aus dem Projekt-Root ausliefert und dazu eine
JSON-API sowie ein Admin-Panel unter `/admin` bereitstellt. Inhalte
(Texte, Bilder, Preise, Neuigkeiten, Veranstaltungen) pflegt die Praxisinhaberin
selbst im Admin-Panel; sie landen in einer SQLite-Datenbank und – bei Texten –
zusätzlich als Dateien im Repository. Terminbuchung und Kontaktformular laufen
über ein Double-Opt-in per E-Mail, optional mit Google-Kalender-Anbindung.

```
Besucher  ──►  Express (server.js)  ──►  HTML-Seiten im Root (index.html, …)
                      │
                      ├──►  JSON-API  /api/…        ──►  SQLite (database.sqlite)
                      ├──►  Admin-Panel  /admin      ──►  SQLite + data/*.json + assets/js/i18n-*
                      └──►  E-Mail (SMTP) · Google Kalender (optional)
```

---

## Schnelleinstieg

```bash
npm ci                    # Abhängigkeiten
cp .env.example .env      # Konfiguration anlegen und ausfüllen
npm run dev               # Start mit Auto-Reload auf http://localhost:3000
```

Details, inklusive aller Pflicht- und Optionsvariablen: [02 – Entwicklung & Setup](02-entwicklung.md).

---

## Zugriffe und Zugänge

| Was | Wo | Zugang |
| --- | --- | --- |
| Quellcode | GitHub `tschauleude/kunsttherapie-website` | GitHub-Account mit Repo-Berechtigung |
| Live-Website | https://www.kunsttherapie-pb.de | öffentlich |
| Admin-Panel | https://www.kunsttherapie-pb.de/admin | Benutzername + Passwort (siehe unten) |
| Server | Strato VPS, Prozess via `pm2` (`kunsttherapie`) | SSH-Key, hinterlegt in den GitHub-Secrets |
| E-Mail-Versand | Strato SMTP, `info@kunsttherapie-pb.de` | Zugangsdaten in `.env` auf dem Server |
| Google Kalender | optional, OAuth über Admin-Panel | Google-Konto der Praxis |

**Admin-Zugang:** wird beim ersten Serverstart aus `ADMIN_USERNAME` /
`ADMIN_PASSWORD` in der `.env` angelegt. Existiert noch kein Konto und sind
diese Variablen nicht gesetzt, kann über `/admin` → „Erstes Admin-Konto anlegen“
mit dem `SETUP_TOKEN` ein Konto erstellt werden. Zugangsdaten stehen nicht im
Repository und gehören da auch nicht hin.

> Die Zugangsdaten dieses Projekts liegen ausschließlich in der `.env` auf dem
> Server und – soweit für das Deployment nötig – in den GitHub-Actions-Secrets.
> Bitte niemals in Commits, Issues oder Pull Requests aufnehmen.

---

## Ältere Dokumente im Repository-Root

Im Projekt-Root liegen Dateien aus früheren Projektphasen. Sie sind teils
überholt; maßgeblich ist die Dokumentation in diesem `docs/`-Ordner.

| Datei | Status |
| --- | --- |
| `README.md` | aktualisiert, verweist hierher |
| `CMS-WEBSITE-INTEGRATION-GUIDE.md` | teilweise veraltet – beschreibt zwei getrennte Ordner (`kunsttherapie-site` / `kunsttherapie-cms`), die es so nicht mehr gibt |
| `START-HIER.md`, `README-ZUERST-LESEN.txt` | veraltet – nennen Standard-Login `admin`/`admin123` und den getrennten Ordner-Aufbau |
| `SETUP-GUIDE.md` | teilweise gültig, Details in [02](02-entwicklung.md) prüfen |
| `HOSTINGER-DEPLOYMENT-GUIDE.md`, `HOSTINGER-QUICK-CHECKLIST.txt` | veraltet für den aktuellen Betrieb – deployt wird auf einen Strato VPS, siehe [07](07-betrieb-deployment.md) |
| `GOOGLE-KALENDER-ANLEITUNG.md` | **fehlerhaft** – nennt den Google-Testmodus als ausreichend und behauptet zugleich eine dauerhafte Verbindung; im Testmodus läuft der Zugang nach 7 Tagen ab. Ersetzt durch [08](08-google-kalender.md) |
| `LAUNCH-CHECKLISTE.md`, `BEREIT-FUER-LIVE.md`, `FEATURES-UEBERSICHT.md` | historisch, Projektstand vor dem Livegang |
| `DESIGN-UPDATE-V2.txt`, `FINAL-SUMMARY.txt`, `ÜBERSICHT.txt` | historisch |
| `GESPRAECHSLEITFADEN.md`, `textentwurf-martina.txt` | inhaltlich/redaktionell, kein technischer Bezug |

Diese Dateien wurden bewusst nicht gelöscht – das ist eine Entscheidung der
Projektverantwortlichen, nicht der Dokumentation.
