# 07 – Betrieb & Deployment

## Aufbau

Die Anwendung läuft auf einem **Strato VPS**, verwaltet durch **pm2** unter dem
Prozessnamen `kunsttherapie`. Ausgeliefert wird über einen vorgeschalteten Proxy;
`app.set('trust proxy', 1)` sorgt dafür, dass Rate-Limits und Session-Cookies die
echte Client-IP sehen.

## Automatisches Deployment

`.github/workflows/deploy.yml` läuft bei jedem Push auf `main`:

1. **build** – Node 20, `npm ci`, `npm run build-frontend`, `npm run qa`
2. **deploy** – nur bei `main`, per SSH auf dem Server:
   ```bash
   cd $VPS_PROJECT_PATH
   git pull origin main
   npm ci --omit=dev
   pm2 restart kunsttherapie || true
   ```

Zusätzlich prüft `.github/workflows/frontend.yml` jeden Push **und Pull Request**
gegen `main` mit demselben Build und QA-Lauf.

### Benötigte GitHub-Secrets

`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PROJECT_PATH`, optional `VPS_PORT`
(Standard 22).

### Was das Deployment nicht tut

- **Kein Frontend-Build auf dem Server.** Der Build läuft nur in der CI zur
  Prüfung; auf dem Server greift `prestart` – also nur bei `npm start`, nicht bei
  `pm2 restart`. Gehashte Assets müssen daher **im Repository eingecheckt** sein.
- **Kein `.env`-Abgleich.** Neue Variablen müssen von Hand auf dem Server ergänzt werden.
- **Keine Datenbankmigration.** Tabellen entstehen beim Start; Schemaänderungen
  brauchen eigene Überlegung.
- **Kein Rollback.** Fehlgeschlagene Deployments werden per `git` zurückgesetzt.

## Deployment von Hand

```bash
ssh <user>@<host>
cd <projektpfad>
git pull origin main
npm ci --omit=dev
pm2 restart kunsttherapie
pm2 logs kunsttherapie --lines 50
```

## Nach dem Start prüfen

```bash
curl -s https://www.kunsttherapie-pb.de/health          # {"status":"ok"}
curl -s https://www.kunsttherapie-pb.de/api/bookings/config
```

Der Startlauf meldet Konfigurationslücken selbst. Auf diese Zeilen achten:

```
[Konfigurationshinweise]
  ! SESSION_SECRET fehlt – …
  ! ADMIN_PASSWORD fehlt in Produktion – zufälliges Passwort wird einmalig geloggt
  ! PUBLIC_SITE_URL fehlt – SEO-Weiterleitungen und Kalender-Links …
[E-Mail] SMTP nicht konfiguriert – E-Mails werden NICHT versendet.
```

## Kanonische Adresse

Steht `PUBLIC_SITE_URL` und ist `NODE_ENV=production`, leitet die Anwendung alle
GET/HEAD-Anfragen per 301 auf den kanonischen Host und auf HTTPS um. `/health`
ist ausgenommen, damit Health-Checks per IP funktionieren. Ein HTTPS-Upgrade
erfolgt nur, wenn der Proxy ausdrücklich `X-Forwarded-Proto: http` meldet – das
verhindert Weiterleitungsschleifen.

## Sicherung

Automatische SQLite-Backups laufen mit (7 Stück, siehe [04](04-datenbank.md)).
Zusätzlich empfohlen:

- Backups **vom Server herunterladen** – liegen sie nur dort, sind sie bei einem
  Serverausfall mit weg
- Die `.env` separat und sicher aufbewahren; sie enthält SMTP-Passwort,
  Session-Secret und die Google-Zugangsdaten
- Hochgeladene Bilder aus `public/uploads/` sichern – sie liegen nicht im Repository

## Überwachen

Es gibt **kein Monitoring**. `/health` antwortet zwar, wird aber von niemandem
abgefragt. Ein einfacher externer Uptime-Check auf `/health` wäre der wirksamste
nächste Schritt.

Ebenfalls nur im Log sichtbar und deshalb leicht zu übersehen:

- fehlgeschlagene Datenbank-Backups
- Fehler der Google-Kalender-Abfrage (`Google Calendar sync error: …`) – mit der
  Folge, dass belegte Zeiten als frei erscheinen, siehe [09](09-website-review.md), B2
- fehlgeschlagener E-Mail-Versand

```bash
pm2 logs kunsttherapie --lines 200
pm2 logs kunsttherapie | grep -E "Google Calendar|E-Mail|Backup"
```

## Störungen

| Symptom | Zu prüfen |
| --- | --- |
| Website nicht erreichbar | `pm2 status`, `pm2 logs kunsttherapie` |
| „Cannot GET /" | Prozess läuft im falschen Verzeichnis – `pm2 describe kunsttherapie` |
| Stylesheet oder Skript fehlt (404) | Gehashte Assets nicht eingecheckt → `npm run build-frontend`, committen, neu deployen |
| Anmeldung am Admin nicht möglich | `SESSION_SECRET` nach Neustart neu erzeugt? Rate-Limit aktiv (5 Versuche / 15 min)? |
| Keine E-Mails | SMTP-Werte in `.env`, Log auf `[E-Mail]` prüfen |
| Buchungen zeigen falsche Belegung | Google-Kalender-Verbindung prüfen, siehe [08](08-google-kalender.md) |
| Kein Speicherplatz mehr | Alte Backups und `public/uploads/` prüfen |

**Schneller Notstart** ohne Frontend-Build:

```bash
SKIP_FRONTEND_BUILD=1 pm2 restart kunsttherapie
```

## Wiederkehrende Aufgaben

- **Monatlich:** Prüfen, ob Backups entstehen und ob sie sich herunterladen lassen
- **Nach Textänderungen im Admin:** `data/i18n-overrides.json` committen
- **Quartalsweise:** `npm audit`, Abhängigkeiten aktualisieren
- **Jährlich:** Impressum und Datenschutzerklärung durchsehen (Stand derzeit Juni bzw. Mai 2026)
