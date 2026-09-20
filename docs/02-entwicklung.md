# 02 – Entwicklung & Setup

Voraussetzung: **Node.js 20** (die CI nutzt 20; getestet wurde zusätzlich mit 22).

## Erstes Setup

```bash
git clone git@github.com:tschauleude/kunsttherapie-website.git
cd kunsttherapie-website
npm ci
cp .env.example .env     # anschließend ausfüllen, siehe unten
npm run dev              # http://localhost:3000
```

Beim ersten Start passiert automatisch:

- alle Tabellen werden angelegt (`database.sqlite`)
- ein Admin-Konto aus `ADMIN_USERNAME` / `ADMIN_PASSWORD` wird erzeugt
- die i18n-Dateien werden aus den Quelltexten neu gebaut
- ein erstes Datenbank-Backup wird geschrieben

Ohne SMTP-Konfiguration meldet der Start: *„SMTP nicht konfiguriert – E-Mails
werden NICHT versendet."* Für die lokale Entwicklung ist das in Ordnung; Buchungen
lassen sich anlegen, nur die Bestätigungsmails fehlen.

## Konfiguration (`.env`)

### Pflicht im Produktivbetrieb

| Variable | Bedeutung |
| --- | --- |
| `NODE_ENV` | `production` aktiviert sichere Cookies und die kanonische Weiterleitung |
| `PORT` | Standard 3000 |
| `SESSION_SECRET` | Langer Zufallsstring. Fehlt er, wird eins in `data/.session-secret` erzeugt |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Erstes Admin-Konto (mind. 8 Zeichen) |
| `PUBLIC_SITE_URL` | Öffentliche Adresse – Grundlage für E-Mail-Links und die kanonische Weiterleitung |
| `CORS_ORIGIN` | Kommagetrennte erlaubte Ursprünge |

### E-Mail

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `PRACTICE_EMAIL` –
aktuell Strato (`smtp.strato.de:465`). Ohne diese Werte versendet die Anwendung
keine Mails, läuft aber weiter.

### Terminbuchung

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `BOOKING_SLOT_MINUTES` | `90` | Länge eines Slots |
| `BOOKING_MIN_ADVANCE_HOURS` | `24` | Mindestvorlauf für eine Buchung |
| `BOOKING_TIMEZONE` | `Europe/Berlin` | |
| `BOOKING_SCHEDULE` | Di 11:00–12:30, Do 18:00–19:30 | JSON, Wochentag 0 = Sonntag |

```bash
BOOKING_SCHEDULE={"2":{"start":"11:00","end":"12:30","label":"Dienstag Vormittag"},"4":{"start":"18:00","end":"19:30","label":"Donnerstag Abend"}}
```

### Google Kalender (optional)

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`,
`GOOGLE_CALENDAR_ID` – siehe [08 – Google Kalender](08-google-kalender.md).
`GOOGLE_REFRESH_TOKEN` bleibt normalerweise leer; der Token landet in der Datenbank.

### Sonstiges

`DATABASE_PATH` (Standard `./database.sqlite`), `UPLOAD_DIR`
(Standard `./public/uploads`), `MAX_FILE_SIZE` (Standard 5 MB), `SETUP_TOKEN`
(für die einmalige Ersteinrichtung über `/admin`).

### Bild-Uploads

Hochgeladene Bilder werden serverseitig verkleinert und neu komprimiert
(`lib/image-optimize.js`). Einstellbar:

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `UPLOAD_MAX_WIDTH` | `1600` | Längste Kante, größere Bilder werden verkleinert |
| `UPLOAD_MAX_HEIGHT` | `1600` | dito für die Höhe |
| `UPLOAD_QUALITY` | `82` | JPEG-/WebP-Qualität |

Das Format bleibt erhalten, EXIF-Daten werden entfernt – die Drehung eines
Handy-Fotos wird vorher angewendet. GIFs bleiben unangetastet, damit
Animationen erhalten bleiben.

## npm-Skripte

| Skript | Wirkung |
| --- | --- |
| `npm start` | Baut das Frontend (`prestart`) und startet den Server |
| `npm run dev` | Start mit nodemon, **ohne** Build |
| `npm run build-frontend` | Kompletter Frontend-Build, siehe [05](05-inhalte-i18n.md) |
| `npm run qa` | i18n-Validierung + Syntaxprüfung aller Frontend-Skripte |
| `npm run qa:interactions` | Browser-Durchlauf über alle Seiten (Playwright, Server muss laufen) |
| `npm run check-google` | Diagnose der Google-Kalender-Anbindung inkl. echtem API-Zugriff |
| `npm run smoke` | Prüft Assets, i18n und HTML-Referenzen; optional per `SMOKE_URL` gegen eine laufende Instanz |
| `npm run sync-admin` | `admin.html` → `public/admin.html` kopieren |
| `npm run setup-admin` | Admin-Konto interaktiv anlegen |
| `npm run validate-i18n` | Nur die i18n-Prüfung |
| `npm run textentwurf` | Erzeugt `textentwurf-martina.txt` aus den gepflegten Texten |

`SKIP_FRONTEND_BUILD=1 npm start` überspringt den Build – hilfreich, wenn eine
Produktivinstanz schnell wieder hochkommen muss.

### Zum Zustand der Skripte

`npm run qa` und `npm run build-frontend` laufen sauber durch (geprüft am 16.09.2026).
`npm run qa:interactions` bricht derzeit ab, weil das Playwright-Paket (`^1.60.0`)
eine neuere Browser-Version erwartet, als lokal installiert ist – Abhilfe ist
`npx playwright install chromium`. Die API-Prüfungen des Skripts laufen vorher
bereits durch.

## Lokal entwickeln

```bash
npm run dev
```

- **HTML/CSS/JS geändert** → Browser neu laden. Vor dem Ausliefern `npm run build-frontend`,
  weil die Seiten auf gehashte Dateinamen verweisen.
- **`server.js` oder `lib/` geändert** → nodemon startet neu.
- **`admin.html` geändert** → `npm run sync-admin`.
- **Texte geändert** → siehe [05 – Inhalte & i18n](05-inhalte-i18n.md); niemals die
  generierten `i18n-messages-<seite>.js` direkt bearbeiten.

## Vor dem Commit

```bash
npm run qa && npm run build-frontend
```

Beide laufen auch in der CI (`.github/workflows/frontend.yml`) bei jedem Push und
Pull Request auf `main`.

> Der Build schreibt bei jedem Lauf einen neuen Zeitstempel in
> `assets/asset-manifest.json`. Wenn sich sonst nichts geändert hat, diese Datei
> nicht mitcommitten.

## Test-Instanz starten

Eine isolierte Instanz, die die echte Datenbank nicht anfasst:

```bash
SKIP_FRONTEND_BUILD=1 PORT=3456 NODE_ENV=development \
  ADMIN_USERNAME=test ADMIN_PASSWORD=test12345 \
  SESSION_SECRET=dev DATABASE_PATH=/tmp/test.sqlite \
  node server.js
```
