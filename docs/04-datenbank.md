# 04 – Datenbank

SQLite, standardmäßig `./database.sqlite` (über `DATABASE_PATH` verlegbar). Die
Tabellen werden bei jedem Start per `CREATE TABLE IF NOT EXISTS` sichergestellt;
ein separater Migrationsschritt entfällt.

## Tabellen

### `admins`
`id` · `username` (eindeutig) · `password` (bcrypt) · `email` · Zeitstempel

Wird beim ersten Start aus `ADMIN_USERNAME` / `ADMIN_PASSWORD` befüllt.

### `news`
`id` · `title` · `content` · `image` · `published` (0/1) · Zeitstempel

### `flyers`
`id` · `title` · `description` · `url` · `original_name` · `size_bytes` ·
`preview_url` · `published` (0/1) · `sort_order` · Zeitstempel

`preview_url` zeigt auf ein Bild der ersten PDF-Seite. Es entsteht beim
Hochladen im Browser des Admin-Panels (siehe [03 – API](03-api.md)).

Die PDF-Datei selbst liegt nicht in der Datenbank, sondern unter
`public/uploads/flyer/`. Beim Löschen eines Eintrags wird sie mit entfernt.

### `events`
`id` · `title` · `description` · `date` · `time` · `location` · `capacity` ·
`image` · `published` · Zeitstempel

### `event_registrations`
`id` · `event_id` · `name` · `email` · `phone` · `message` · `email_sent`

### `services`
`id` · `title` · `description` · `price` · `duration` · `image` · `active`

### `bookings`
`id` · `name` · `email` · `phone` · `date` · `start_time` · `end_time` ·
`message` · `status` · `google_event_id` · `verify_token` · `is_block` (0/1) ·
Zeitstempel

Statuswerte: `pending_verification` → `pending` → `confirmed` bzw. `cancelled`.
`google_event_id` verknüpft die Buchung mit dem Kalendertermin, damit er beim
Stornieren gelöscht werden kann.

`is_block` unterscheidet eine im Admin-Panel blockierte Zeit von einer echten
Anfrage. Das ist seit Einführung der Plätze je Zeitfenster entscheidend: Eine
Anfrage belegt einen Platz, eine Sperre schließt das Fenster ganz. Vorher war
eine Sperre nur an der Nachricht „Manuell blockiert" zu erkennen; bestehende
Einträge werden beim Start einmalig danach umgestellt.

> **Kein eindeutiger Index mehr auf (Datum, Uhrzeit).** Der verhinderte jede
> zweite Anfrage im selben Zeitfenster. An seine Stelle tritt
> `idx_bookings_slot_person` auf (Datum, Uhrzeit, E-Mail): dieselbe Person kann
> sich nicht zweimal für dasselbe Fenster eintragen, verschiedene Personen schon.

### `contact_messages`
`id` · `name` · `email` · `phone` · `message` · `email_sent` · `status` ·
`verify_token` · `action_token` · Zeitstempel

`verify_token` bestätigt der Absender, `action_token` nutzt die Praxis, um direkt
aus der Benachrichtigungsmail anzunehmen oder abzulehnen. Beide sind 24 Stunden gültig.

### `blocked_periods`
`id` · `date_from` · `date_to` · `reason` – gesperrte Zeiträume (Urlaub), blockieren
alle Slots im Bereich.

### `atelier_submissions`
`id` · `image_path` · `is_anonymous` · `submitter_name` · `submitter_email` ·
`note` · `status`

### `site_images`
`slot` (Primärschlüssel) · `url` · `alt_text` · `updatedAt`

Nur die in `lib/site-images.js` definierten Slots sind zulässig:
`header.logo`, `home.hero`, `home.gallery.1`–`6`, `about.portrait`,
`therapy.raum.eingang`, `therapy.raum.vision`, `therapy.raum.innen`,
`therapy.raum.gestalten`. Ohne Eintrag gilt das mitgelieferte Standardbild.

### `content_versions`
`id` · `kind` (`i18n`, `site_images`, `content_bundle`) · `label` · `snapshot`
(JSON) · `meta` · `createdAt` – maximal 80 Sicherungspunkte.

### `settings`
`key` / `value`. Unter anderem:

| Schlüssel | Inhalt |
| --- | --- |
| `google_refresh_token` | OAuth-Token für den Kalender |
| `google_oauth_state` | Kurzlebiger CSRF-Wert während des OAuth-Ablaufs |
| `i18n_overrides` | Textänderungen (zusätzlich in `data/i18n-overrides.json`) |
| `prices_table` / `prices_table_en` | Preistabelle |

## Backups

`lib/backup.js` legt per `VACUUM INTO` konsistente Snapshots an – auch während
laufender Schreibzugriffe sicher. Ein Backup entsteht beim Start und danach in
festem Intervall; die **letzten 7** werden behalten, ältere gelöscht. Dateiname:
`database-<ISO-Zeitstempel>.sqlite`.

Der letzte Backup-Status wird im Speicher gehalten (`getLastBackup()`), aber
derzeit **nirgends ausgegeben** – `/health` meldet nur `{"status":"ok"}`. Ein
fehlgeschlagenes Backup fällt damit nur im Log auf.

### Von Hand sichern

```bash
sqlite3 database.sqlite "VACUUM INTO 'sicherung.sqlite'"
```

Nicht einfach die laufende Datei kopieren – das Ergebnis kann inkonsistent sein.

### Zurückspielen

```bash
pm2 stop kunsttherapie
cp data/backups/database-<zeitstempel>.sqlite database.sqlite
pm2 start kunsttherapie
```

> Die Datenbank enthält personenbezogene Daten (Namen, E-Mail-Adressen,
> Nachrichten von Ratsuchenden). Backups gehören verschlüsselt aufbewahrt und
> niemals ins Repository.
