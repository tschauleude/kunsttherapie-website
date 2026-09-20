# Kunsttherapie Paderborn – Website & CMS

Website und Redaktionssystem der kunsttherapeutischen Praxis von
**Martina Schwierzke** in Paderborn (OWL).

Node/Express-Anwendung, die die öffentlichen Seiten ausliefert und dazu eine
JSON-API sowie ein Admin-Panel unter `/admin` bereitstellt. Inhalte – Texte,
Bilder, Preise, Neuigkeiten, Veranstaltungen – pflegt die Praxisinhaberin selbst.
Terminbuchung und Kontaktformular laufen mit Double-Opt-in per E-Mail, optional
mit Google-Kalender-Anbindung.

## Schnellstart

```bash
npm ci
cp .env.example .env     # ausfüllen
npm run dev              # http://localhost:3000
```

Admin-Panel: `http://localhost:3000/admin`

## Dokumentation

Die vollständige Dokumentation liegt in **[`docs/`](docs/README.md)**:

| | |
| --- | --- |
| [Architektur](docs/01-architektur.md) | Aufbau, Verzeichnisse, Request-Flow, Sicherheit |
| [Entwicklung & Setup](docs/02-entwicklung.md) | Lokal starten, `.env`, npm-Skripte |
| [API-Referenz](docs/03-api.md) | Alle Endpunkte |
| [Datenbank](docs/04-datenbank.md) | SQLite-Schema, Backups |
| [Inhalte & i18n](docs/05-inhalte-i18n.md) | Textsystem DE/EN, Build-Pipeline |
| [Admin-Handbuch](docs/06-admin-handbuch.md) | Für die Praxis, ohne Technikkenntnisse |
| [Betrieb & Deployment](docs/07-betrieb-deployment.md) | VPS, CI, Monitoring, Störungen |
| [Google Kalender](docs/08-google-kalender.md) | Kalender verbinden |
| [Website-Review](docs/09-website-review.md) | Geprüfter Stand, offene Punkte |

## Technik

Node 20 · Express · SQLite · bcryptjs · nodemailer · googleapis · sharp ·
helmet mit strenger CSP · esbuild/terser für den Frontend-Build. Kein
Frontend-Framework, keine externen Skripte oder Schriften zur Laufzeit.

## Prüfen

```bash
npm run qa               # i18n-Vollständigkeit + JS-Syntax
npm run build-frontend   # Bundle, Hashes, WebP, HTML-Patches
npm run smoke            # Assets und Referenzen
```

Beide erstgenannten laufen in der CI bei jedem Push und Pull Request auf `main`.

## Deployment

Push auf `main` → GitHub Actions baut, prüft und deployt per SSH auf den Strato
VPS (`pm2 restart kunsttherapie`). Details in
[docs/07](docs/07-betrieb-deployment.md).

## Hinweis zu älteren Dateien im Root

Mehrere Markdown- und Textdateien im Projekt-Root stammen aus früheren
Projektphasen und sind teilweise überholt. Maßgeblich ist `docs/`; eine
Einordnung der Altdateien steht in [docs/README.md](docs/README.md).
