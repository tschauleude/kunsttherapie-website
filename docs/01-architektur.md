# 01 – Architektur

## Überblick

Eine einzelne Node/Express-Anwendung (`server.js`, ~2800 Zeilen) liefert sowohl
die öffentliche Website als auch die JSON-API und das Admin-Panel aus. Es gibt
kein Frontend-Framework und keinen separaten Webserver – die HTML-Seiten liegen
als fertige Dateien im Projekt-Root und werden von Express ausgeliefert.

```
                    ┌──────────────────────────────────┐
  Browser  ────────►│  Express (server.js, Port 3000)  │
                    ├──────────────────────────────────┤
                    │  helmet · CSP · CORS · Rate-Limit│
                    │  compression · session           │
                    └───┬──────────┬──────────┬────────┘
                        │          │          │
        HTML-Seiten ◄───┘          │          └───► /admin  (public/admin.html)
        (index.html, …)            │
                                   ▼
                          JSON-API  /api/…
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
      SQLite (database.sqlite)  SMTP (nodemailer)  Google Calendar (optional)
              │
              └─► data/i18n-overrides.json + assets/js/i18n-messages-*.js
                  (Texte werden zusätzlich ins Repo geschrieben)
```

## Verzeichnisse

| Pfad | Inhalt |
| --- | --- |
| `server.js` | Gesamte Anwendung: Middleware, Datenbank, alle Routen |
| `lib/` | Fachlogik als Module (Buchung, E-Mail, i18n, Kalender, Backup …) |
| `scripts/` | Build- und Wartungsskripte (Node, ohne Framework) |
| `assets/js/` | Frontend-JavaScript, inkl. der generierten i18n-Dateien |
| `assets/css/` | `style.css` (Quelle) und die gehashte Build-Ausgabe |
| `assets/img/` | Bilder inkl. generierter WebP-Varianten in mehreren Breiten |
| `partials/` | HTML-Bausteine (Header, Footer, Schema.org) für die Build-Skripte |
| `data/` | `i18n-overrides.json`, das App-Secret, Backups – Laufzeit- und Repo-Daten |
| `public/` | Vom Webserver statisch ausgelieferter Ordner: `admin.html`, `uploads/` |
| `*.html` (Root) | Die öffentlichen Seiten |
| `docs/` | Diese Dokumentation |

### Warum liegt `admin.html` zweimal vor?

Die Quelldatei ist `admin.html` im Root; ausgeliefert wird `public/admin.html`.
`/admin` nimmt die Datei aus `public/`, fällt aber auf die Root-Datei zurück,
wenn sie fehlt. Nach Änderungen an `admin.html` deshalb `npm run sync-admin`
ausführen.

## Module in `lib/`

| Modul | Aufgabe |
| --- | --- |
| `booking.js` | Slot-Berechnung: Wochentage, Zeiten, Vorlauffrist, Überschneidungen |
| `email.js` | Alle Mail-Vorlagen und der Versand (Buchung, Kontakt, Event, Atelier) |
| `google-calendar.js` | OAuth, Belegungen lesen, Termine anlegen/löschen |
| `ical.js` | `.ics`-Dateien für Kalender-Links in Bestätigungsmails |
| `i18n-content.js` | Kuratierter Katalog der im Admin editierbaren Texte |
| `i18n-persist.js` | Texte nach `data/i18n-overrides.json` und in die JS-Quellen schreiben |
| `i18n-scrub.js` | Filtert Textbausteine aus, die nicht auf die Seite gehören |
| `site-images.js` | Feste Bild-Slots (Hero, Galerie, Porträt, Raum) |
| `site-pricing.js` | Preisdaten, im Build in die Texte gespiegelt |
| `content-versions.js` | Sicherungspunkte für Texte und Bilder, max. 80 |
| `media.js`, `image-meta.js` | Mediathek, Bildmetadaten |
| `backup.js` | Automatische SQLite-Backups via `VACUUM INTO`, behält 7 |
| `secret.js` | App-Secret aus `.env` oder persistiert in `data/.session-secret` |
| `timezone.js` | Umrechnung lokale Zeit ↔ UTC für `Europe/Berlin` |
| `api-messages.js` | API-Antworttexte in DE und EN |

## Request-Flow

**Seitenaufruf** – Express prüft (in dieser Reihenfolge) kanonische
Weiterleitung, Sicherheits-Header, Kompression und Session; dann greift eine
Route aus `SITE_PAGES` und liefert die passende HTML-Datei aus
(`Cache-Control: max-age=300`). Die Seite lädt anschließend das gehashte
JS-Bundle, ihre i18n-Datei und – je nach Seite – Zusatzskripte.

**API-Aufruf** – `/api/...` wird von JSON-Routen bedient. Alles unter
`/api/admin/...` läuft durch `requireAuth` (Session-basiert). Öffentliche
Schreibrouten (Buchung, Kontakt, Event-Anmeldung) haben zusätzlich Rate-Limits.

**Unbekannter Pfad** – `/api/...` → JSON-404; sonst `404.html`.

## Sicherheit

- **Helmet mit strenger CSP**: `default-src 'self'`, keine externen Skripte;
  Frames nur für Google Maps; `frame-ancestors 'none'`; HSTS zwei Jahre mit Preload
- **Sessions**: `httpOnly`, `sameSite=lax`, in Produktion `secure`, 24 h Laufzeit;
  signiert mit dem App-Secret aus `lib/secret.js`
- **Passwörter**: `bcryptjs`
- **Rate-Limits**: Login 5/15 min (erfolgreiche zählen nicht), Buchung und Kontakt
  je 10/h, Event-Anmeldung 8/h, Bestätigungslinks 5/15 min
- **Uploads**: Dateiendung wird ausschließlich aus dem geprüften MIME-Type
  abgeleitet, nie aus dem Dateinamen – sonst ließe sich ausführbarer Inhalt im
  öffentlichen Upload-Ordner ablegen
- **Double-Opt-in**: Buchungen und Kontaktnachrichten werden erst nach Klick auf
  den Bestätigungslink aktiv; Tokens verfallen nach 24 Stunden
- **Bot-Schutz**: Honeypot-Feld plus Zeitfalle (Absenden unter 1,2 s gilt als Bot)
- **XSS**: `escapeHtml()` für alles, was direkt per `res.send()` ausgegeben wird
- **OAuth-CSRF**: `state`-Parameter wird in `settings` hinterlegt und beim Callback geprüft

## Bewusste Entscheidungen

- **SQLite statt Datenbankserver** – eine Praxis, überschaubare Datenmengen; Backup ist eine Datei
- **Texte doppelt gehalten** (Datenbank *und* Repo-Dateien) – Änderungen im Admin
  wirken sofort, überleben aber auch ein Deployment, weil sie eingecheckt werden können
- **Keine externen Frontend-Abhängigkeiten** – Schriften und Skripte liegen lokal,
  das macht die strenge CSP erst möglich und erspart Consent-Fragen
- **Ein einziges `server.js`** – für den Umfang vertretbar, aber die Datei ist mit
  ~2800 Zeilen die natürliche Grenze; weitere Features gehören in `lib/`
