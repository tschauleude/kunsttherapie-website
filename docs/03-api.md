# 03 – API-Referenz

Alle Antworten sind JSON, sofern nicht anders vermerkt. Fehler haben die Form
`{ "error": "…" }`. Antworttexte kommen je nach `Accept-Language` bzw.
Sprachparameter auf Deutsch oder Englisch (`lib/api-messages.js`).

**Authentifizierung:** Alles unter `/api/admin/…` erfordert eine gültige
Session (`requireAuth`). Anmeldung über `POST /api/auth/login`, das Session-Cookie
gilt 24 Stunden.

---

## Authentifizierung

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| POST | `/api/auth/login` | `{username, password}` – max. 5 Versuche / 15 min |
| POST | `/api/auth/logout` | Session beenden |
| GET | `/api/auth/status` | `{authenticated, username}` |
| POST | `/api/auth/setup` | Erstes Admin-Konto, benötigt `SETUP_TOKEN` |
| POST | `/api/admin/change-password` | 🔒 Passwort ändern |

## Neuigkeiten

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/api/news` | Veröffentlichte Einträge |
| GET | `/api/news/:id` | Einzelner veröffentlichter Eintrag |
| GET | `/api/admin/news` | 🔒 Alle, inkl. Entwürfe |
| GET | `/api/admin/news/:id` | 🔒 Einzelner Eintrag |
| POST | `/api/admin/news` | 🔒 Anlegen |
| PUT | `/api/admin/news/:id` | 🔒 Ändern |
| PATCH | `/api/admin/news/:id/published` | 🔒 Veröffentlichen / zurückziehen |
| DELETE | `/api/admin/news/:id` | 🔒 Löschen |

## Veranstaltungen

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/api/events` | Veröffentlichte Veranstaltungen |
| POST | `/api/events/:id/register` | Anmeldung, max. 8 / Stunde |
| GET | `/api/admin/events` | 🔒 Alle |
| GET | `/api/admin/events/:id` | 🔒 Einzelne |
| POST · PUT · DELETE | `/api/admin/events[/:id]` | 🔒 Anlegen / Ändern / Löschen |
| GET | `/api/admin/events/:id/registrations` | 🔒 Anmeldungen zur Veranstaltung |

## Leistungen

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/api/services` | Aktive Leistungen |
| GET · POST · PUT · DELETE | `/api/admin/services[/:id]` | 🔒 Verwaltung |

## Terminbuchung

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/api/bookings/config` | Slotlänge, Zeitplan, Vorlauf, Zeitzone, ob E-Mail konfiguriert ist |
| GET | `/api/bookings/availability?month=YYYY-MM` | Belegung für einen Monat, pro Tag `{workingDay, slots, hasAvailability, availableCount}` |
| GET | `/api/bookings/slots?date=YYYY-MM-DD` | Slots eines Tages |
| POST | `/api/bookings` | Buchungsanfrage, max. 10 / Stunde. Mehrere Slots möglich |
| GET | `/api/bookings/verify/:token` | Double-Opt-in-Bestätigung (HTML), Token 24 h gültig |
| GET | `/api/bookings/:id/calendar.ics` | `.ics`-Datei, per signiertem Token geschützt |
| GET | `/api/admin/bookings` | 🔒 Alle Buchungen |
| POST | `/api/admin/bookings` | 🔒 Buchung von Hand anlegen |
| PATCH | `/api/admin/bookings/:id` | 🔒 Status ändern (bestätigen / absagen) |
| DELETE | `/api/admin/bookings/:id` | 🔒 Löschen |
| GET · POST · DELETE | `/api/admin/blocked-periods[/:id]` | 🔒 Gesperrte Zeiträume |

**Ablauf einer Buchung:** `POST /api/bookings` legt sie mit Status
`pending_verification` an und verschickt den Bestätigungslink. Der Klick darauf
setzt sie auf `pending` und benachrichtigt die Praxis. Bestätigt die Praxis im
Admin-Panel (`PATCH`), wird der Status `confirmed` und – falls verbunden – ein
Google-Kalendertermin angelegt.

## Kontakt

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| POST | `/api/contact` | Nachricht, max. 10 / Stunde, Honeypot + Zeitfalle |
| GET | `/api/contact/verify/:token` | Bestätigung durch den Absender (HTML) |
| GET | `/api/contact/action/:token/:action` | Annehmen / Ablehnen durch die Praxis, direkt aus der E-Mail |
| GET | `/api/admin/contact-messages` | 🔒 Nachrichten |
| DELETE | `/api/admin/contact-messages/:id` | 🔒 Löschen |

## Preistabelle

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/api/prices-table` | Öffentliche Preistabelle |
| GET · PUT | `/api/admin/prices-table` | 🔒 Lesen / Speichern |

## Website-Texte (i18n)

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/api/i18n/overrides` | Aktive Textänderungen, DE und EN |
| GET | `/api/admin/i18n/catalog` | 🔒 Katalog aller editierbaren Texte, nach Seite gruppiert |
| GET | `/api/admin/i18n/:groupId` | 🔒 Texte einer Gruppe (`home`, `therapy`, `faq`, `about`, `prices`, `contact`, `booking`, `seo`) |
| PUT | `/api/admin/i18n/:groupId` | 🔒 Speichern – schreibt Datenbank **und** Repo-Dateien |
| DELETE | `/api/admin/i18n/:groupId` | 🔒 Auf Originaltexte zurücksetzen |

## Bilder und Medien

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/api/site-images` | Belegung aller Bild-Slots |
| GET | `/api/admin/site-images` | 🔒 Slots inkl. Standardwerten |
| PUT | `/api/admin/site-images/:slot` | 🔒 Slot auf eine URL setzen |
| POST | `/api/admin/site-images/:slot/upload` | 🔒 Bild hochladen und zuweisen |
| PATCH | `/api/admin/site-images/:slot/alt-text` | 🔒 Alt-Text setzen |
| DELETE | `/api/admin/site-images/:slot` | 🔒 Auf Standard zurücksetzen |
| PUT | `/api/admin/site-images/gallery-count` | 🔒 Anzahl Galeriebilder |
| GET · POST · DELETE | `/api/admin/media[/…]` | 🔒 Mediathek |
| GET · DELETE | `/api/admin/static-images[/:filename]` | 🔒 Mitgelieferte Bilder |
| POST | `/api/admin/upload` | 🔒 Allgemeiner Bild-Upload |

## Mini-Atelier

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| POST | `/api/atelier/submit` | Einsendung eines gemalten Bildes |
| GET · PATCH · DELETE | `/api/admin/atelier[/:id]` | 🔒 Einsendungen verwalten |

## Sicherungspunkte

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/api/admin/content-versions` | 🔒 Vorhandene Sicherungspunkte (max. 80) |
| POST | `/api/admin/content-versions/snapshot` | 🔒 Neuen anlegen |
| POST | `/api/admin/content-versions/:id/restore` | 🔒 Wiederherstellen |

## Google Kalender

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/api/admin/google/status` | 🔒 `{clientConfigured, connected, calendarId, authUrl}` |
| GET | `/api/admin/google/auth` | 🔒 Startet OAuth, erzeugt `state` |
| GET | `/api/admin/google/callback` | OAuth-Rückkanal – prüft `state`, speichert den Refresh-Token |

## Sonstiges

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/health` | `{"status":"ok"}` – ohne Authentifizierung |
| GET | `/robots.txt`, `/sitemap.xml` | Statische Dateien aus dem Root |
| GET · PUT | `/api/admin/bugs` | 🔒 Notizfeld im Admin-Panel |

## Seitenrouten

`/` sowie `/kunsttherapie`, `/ueber-mich`, `/neuigkeiten`, `/events`, `/preise`,
`/kontakt`, `/buchung`, `/atelier`, `/impressum`, `/datenschutz`,
`/kostenerstattung`. Jede `…​.html`-Variante leitet per 301 auf die Fassung ohne
Endung um, `/angebote` auf `/kunsttherapie`. `/admin` liefert das Admin-Panel.
