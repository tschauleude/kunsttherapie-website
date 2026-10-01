# 15 – Flyer, Kopf-/Fußzeile und Bedienbarkeit

Stand: 01.10.2026 · gebaut und im Browser geprüft

Diese Runde entstand aus drei Punkten, die bei Martina selbst aufgefallen sind:
ein Fehler beim Speichern einer Neuigkeit, der Wunsch nach Flyern als PDF, und
die Bitte, das Admin-Panel einfacher bedienbar zu machen.

---

## Für Martina in drei Sätzen

Flyer lassen sich jetzt als PDF im Admin-Panel hochladen; sie erscheinen auf der
Startseite im Abschnitt **Aktuelle Flyer**. Die Texte in Kopf- und Fußzeile –
Menü, Anschrift, Telefonnummern – sind nun ebenfalls unter **Website-Texte**
änderbar, und in der Fußzeile steht statt der Berufsbezeichnung nur noch
**Martina Schwierzke**. Das Panel selbst wurde größer und deutlicher gemacht,
und Fehlermeldungen sind jetzt in verständlichem Deutsch statt in Technik-Sprache.

---

## 1. Der Fehler beim Speichern

**Was Martina sah:** `Fehler: JSON.parse: unexpected character at line 1 column 1
of the JSON data` beim Speichern einer Neuigkeit mit Bild.

**Was dahintersteckt:** Die Anwendung antwortet immer in JSON. Ein Webserver
davor tut das nicht – bei einer zu großen Datei, einer Zeitüberschreitung oder
einem Neustart kommt eine HTML-Fehlerseite zurück. Das Admin-Panel hat diese
Antwort trotzdem als JSON gelesen und ist mit genau dieser Meldung gescheitert.
Die eigentliche Ursache blieb damit unsichtbar.

**Geändert:**

- Alle Serverantworten im Admin-Panel laufen über eine Stelle, die erst prüft,
  ob überhaupt JSON zurückkam. Ist es keines, erscheint eine Meldung in
  Klartext – zum Beispiel „Die Datei ist zu groß für den Server" (HTTP 413) oder
  „Die Anmeldung ist abgelaufen" (401).
- Das Größenlimit für Bilder liegt jetzt bei **20 MB** statt 5 MB. Handy-Fotos
  sind oft 5–12 MB groß; verkleinert werden sie ohnehin erst auf dem Server.
- Die Meldung „File too large" von multer ist durch einen deutschen Satz ersetzt,
  der das tatsächliche Limit nennt.

**Noch zu prüfen auf dem Server:** Steht nginx vor der Anwendung, gilt dessen
eigenes Limit `client_max_body_size` – im Auslieferungszustand **1 MB**. Das ist
der wahrscheinlichste Grund für die HTML-Antwort. Prüfen mit:

```bash
grep -r client_max_body_size /etc/nginx/
```

Fehlt die Zeile, gehört sie in den `server`-Block (`client_max_body_size 30m;`),
danach `nginx -t && systemctl reload nginx`. Siehe
[02 – Entwicklung & Setup](02-entwicklung.md).

---

## 2. Flyer als PDF

Neuer Bereich **Flyer (PDF)** im Admin-Panel und neuer Abschnitt
**Aktuelle Flyer** auf der Startseite.

| Punkt | Verhalten |
| --- | --- |
| Dateityp | ausschließlich PDF, bis 25 MB |
| Reihenfolge | über „nach oben" / „nach unten" einstellbar |
| Verbergen | nimmt einen Flyer von der Startseite, ohne ihn zu löschen |
| Kein Flyer veröffentlicht | der Abschnitt erscheint gar nicht – keine leere Überschrift |
| Löschen | entfernt Eintrag **und** PDF-Datei |
| Bearbeiten | Dateifeld darf leer bleiben, dann bleibt die bisherige Datei |

Die Überschriften des Abschnitts („Aktuelle Flyer", Untertitel, Beschriftung des
Knopfes) sind unter **Website-Texte → Startseite** änderbar.

Technisch: Tabelle `flyers`, Dateien unter `public/uploads/flyer/`. Gespeichert
wird nur ein Pfad, der auf eine selbst abgelegte Datei zeigt – ein beliebiger
Pfad wird abgelehnt. Siehe [03 – API](03-api.md) und [04 – Datenbank](04-datenbank.md).

---

## 3. Kopf- und Fußzeile bearbeitbar

Neue Gruppe **Kopf- und Fußzeile** unter **Website-Texte**. Sie gilt für alle
Seiten gleichzeitig und enthält:

- Name und Untertitel
- die sechs Menüpunkte oben
- alle vier Fußzeilen-Spalten samt Überschriften
- **Anschrift**, **Telefon** und **Mobil** – diese drei hatten vorher gar keine
  Verbindung zum Textsystem und waren nur im Quelltext änderbar

In der Fußzeile steht jetzt **Martina Schwierzke** statt „Psychosoziale &
Klinische Kunsttherapeutin". Die Berufsbezeichnung bleibt an den Stellen, an die
sie gehört: in den Suchmaschinen-Daten und in der Qualifikationsliste auf
„Über mich".

> Bei Telefon und Mobil steht die Nummer an **zwei** Stellen: im Link (`tel:…`)
> und im sichtbaren Text. Beim Ändern beide anpassen – im Eingabefeld steht ein
> Hinweis dazu.

---

## 4. Bedienbarkeit im Admin-Panel

| Was | Vorher | Jetzt |
| --- | --- | --- |
| Beschriftungen über Feldern | 0,88 rem | 1 rem |
| Eingabefelder | 0,95 rem | 1,05 rem, mindestens 48 px hoch |
| Knöpfe in Listen | 0,82 rem, ca. 34 px hoch | 0,92 rem, mindestens 44 px hoch |
| Häkchen | Standardgröße, nur die Box anklickbar | 1,4 rem, ganze Zeile anklickbar |
| Pflichtfelder | nur technisch `required` | „(muss ausgefüllt sein)" bzw. „(kann leer bleiben)" |
| Fokusrahmen | zarter Schatten | 3 px, deutlich sichtbar |
| Rückmeldung unten rechts | 0,95 rem, Fehler blieben bis zum nächsten Vorgang stehen | 1,05 rem, farbiger Rahmen, anklickbar zum Schließen |
| Häkchen-Text | „Veröffentlichen" | „Auf der Website anzeigen" |
| Leere Listen | leerer Bereich | Satz, der sagt, was als Nächstes zu tun ist |

Die Werte stehen gesammelt am Ende von `assets/css/admin.css`, damit an einer
Stelle nachvollziehbar bleibt, was aus Rücksicht auf die Lesbarkeit angepasst
wurde.

---

## 5. Was geprüft wurde

Mit einer lokalen Instanz und echtem Browser (Chromium):

- Anmeldung, Flyer hochladen, bearbeiten, verbergen, sortieren, löschen
- Falscher Dateityp (JPG statt PDF) → verständliche Meldung, kein Absturz
- Pfad-Einschleusung (`/etc/passwd` als Adresse) → abgelehnt
- Angegebene Dateigröße aus dem Formular wird ignoriert; der Server misst selbst
- Startseite mit Flyern und ohne Flyer (Abschnitt verschwindet)
- Fußzeile zeigt „Martina Schwierzke", Anschrift kommt aus dem Textsystem
- Breite 360 px: kein seitliches Scrollen, Knopf über die volle Breite
- Keine JavaScript-Fehler in der Konsole
- `npm run qa` (495 Schlüssel DE/EN), `npm run build-frontend`

**Nicht geprüft:** das Verhalten hinter dem Webserver der Live-Umgebung – der
413-Fall lässt sich nur dort nachstellen. Die beiden Meldungen von `npm run smoke`
zu `assets/img/logo.svg` bestehen unverändert auch ohne diese Änderungen; sie
stammen daher, dass das Prüfskript einen Beispiel-Pfad aus einem Anleitungstext
im Admin-Panel für eine echte Referenz hält.
