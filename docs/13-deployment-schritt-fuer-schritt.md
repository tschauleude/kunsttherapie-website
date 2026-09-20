# 13 – Auf kunsttherapie-pb.de aufspielen, Schritt für Schritt

Diese Anleitung bringt den Stand aus PR #98 auf Martinas Live-Seite –
**mit Sicherung vorher und Prüfung nachher**.

Rechne mit **30–45 Minuten**. Lege den Termin nicht auf Dienstag oder
Donnerstag kurz vor 11:00 bzw. 18:00 – das sind die Ateliertage, an denen
gebucht wird.

---

## Vorher wissen

Was beim Deployment passiert: Der Merge nach `main` löst GitHub Actions aus.
Erst wird gebaut und geprüft, dann verbindet sich GitHub per SSH mit dem Strato
VPS, macht dort `git pull`, installiert Abhängigkeiten und startet den Prozess
über `pm2` neu. Die Seite ist dabei **wenige Sekunden** nicht erreichbar.

**Was NICHT mitkommt:**

| | |
| --- | --- |
| Die `.env` auf dem Server | bleibt unangetastet – neue Variablen musst du von Hand ergänzen |
| Die Datenbank | wird nicht verändert; Buchungen, Nachrichten und Texte bleiben |
| Hochgeladene Bilder in `public/uploads/` | bleiben liegen, sind nicht im Repository |

---

## Schritt 1 – Sichern (nicht überspringen)

Drei Dinge, alle auf dem Server. Einloggen und ins Projektverzeichnis:

```bash
ssh <benutzer>@<server>
cd <projektpfad>          # falls unbekannt: pm2 describe kunsttherapie
```

**1a · Datenbank.** Nicht einfach kopieren – eine laufende SQLite-Datei kann
mitten im Schreiben erwischt werden. `VACUUM INTO` erzeugt eine saubere Kopie:

```bash
mkdir -p ~/sicherung
sqlite3 database.sqlite "VACUUM INTO '$HOME/sicherung/database-vor-deploy-$(date +%F).sqlite'"
ls -lh ~/sicherung/
```

**1b · `.env` und hochgeladene Bilder.**

```bash
cp .env ~/sicherung/env-vor-deploy-$(date +%F).txt
tar czf ~/sicherung/uploads-$(date +%F).tar.gz public/uploads/
```

**1c · Aktuellen Stand merken.** Falls du zurück musst, brauchst du diese
Nummer:

```bash
git rev-parse --short HEAD
```

Schreib sie auf. (Vermutlich `2e049f5`.)

**1d · Alles auf deinen Rechner holen.** Liegt die Sicherung nur auf dem
Server, ist sie bei einem Serverausfall mit weg. Auf deinem eigenen Rechner,
in einem neuen Terminalfenster:

```bash
scp -r <benutzer>@<server>:~/sicherung ./sicherung-kunsttherapie
```

> Die Datei mit der `.env` enthält das SMTP-Passwort und die
> Google-Zugangsdaten. Gehört verschlüsselt aufbewahrt und nicht ins Repository.

---

## Schritt 2 – Vorher lokal prüfen (empfohlen)

```bash
git clone -b claude/brave-sagan-eowru5 https://github.com/tschauleude/kunsttherapie-website.git pruefung
cd pruefung && npm ci && npm run qa && npm run build-frontend
```

Beides muss grün sein. `npm run qa` meldet am Ende
`OK: 489 Schlüssel DE/EN, 11 Seiten-Bindings`.

---

## Schritt 3 – Mergen

Auf GitHub: **[PR #98](https://github.com/tschauleude/kunsttherapie-website/pull/98)**
öffnen → **Merge pull request** → **Confirm merge**.

Das ist der Auslöser. Ein separater Push ist nicht nötig.

---

## Schritt 4 – Dem Deployment zusehen

**Actions**-Tab auf GitHub. Der Lauf „Deploy to Strato VPS" muss erscheinen.

| Job | Dauer | Muss |
| --- | --- | --- |
| `build` | ~30 s | grün |
| `deploy` | ~15 s | grün |

Wird `build` rot, wurde **nicht** deployt – die Live-Seite ist unverändert.
Fehler beheben und neu pushen.

---

## Schritt 5 – Prüfen, dass die Seite lebt

```bash
curl -s https://www.kunsttherapie-pb.de/health
curl -sI https://www.kunsttherapie-pb.de/ | head -1
```

Erwartet: `{"status":"ok"}` und `HTTP/2 200`.

Dann im Browser **mit hartem Neuladen** (Strg+F5 bzw. Cmd+Shift+R) – sonst
zeigt der Browser alte Dateien:

- [ ] Startseite lädt, Bilder da
- [ ] `/buchung`: Kalender zeigt den aktuellen Monat, vergangene Tage **ausgegraut**, freie Tage grün
- [ ] `/preise` auf dem Handy: „Gruppensitzung" bricht nicht mitten im Wort
- [ ] `/ueber-mich`: kein leerer Block über dem Porträt
- [ ] `/datenschutz` auf dem Handy: **nicht** seitlich verschiebbar
- [ ] `/datenschutz` Abschnitt 3: nennt **Strato AG**, nicht Hostinger

---

## Schritt 6 – Formulare mit echten Daten testen

Das ist der Teil, den nur du live prüfen kannst: **ob E-Mails ankommen.**
Lokal ist das nicht testbar, weil dort kein SMTP konfiguriert ist.

**6a · Kontaktformular**

1. `/kontakt` mit deiner eigenen E-Mail-Adresse ausfüllen und absenden
2. Meldung „Vielen Dank – die Nachricht ist angekommen" muss erscheinen
3. **Posteingang prüfen**: Bestätigungsmail muss kommen
4. Link darin anklicken
5. Martina muss nun eine Benachrichtigung bekommen, mit Annehmen/Ablehnen
6. Im Admin-Panel unter **Nachrichten** muss der Eintrag stehen

**6b · Terminbuchung**

1. `/buchung`, einen grünen Tag und ein Zeitfenster wählen
2. Mit deiner E-Mail-Adresse absenden
3. Bestätigungsmail muss kommen, Link anklicken
4. Im Admin unter **Buchungen** erscheint die Anfrage
5. Dort **bestätigen** → du bekommst eine Zusage mit Kalender-Datei
6. Falls Google verbunden: Termin muss im Google-Kalender auftauchen
7. Testbuchung anschließend **löschen**

**6c · Admin-Panel**

- [ ] Anmelden klappt
- [ ] Alle zehn Bereiche öffnen sich
- [ ] Unter **Bilder**: neben jedem Bild steht die Format-Empfehlung
- [ ] Ein Bild hochladen → muss deutlich kleiner ankommen (Log: `Bild optimiert: … −xx%`)
- [ ] Eine Neuigkeit anlegen, speichern, veröffentlichen
- [ ] Wieder löschen

**6d · Bildoptimierung am Server belegen**

```bash
pm2 logs kunsttherapie --lines 50 | grep "Bild optimiert"
```

Erwartete Zeile: `Bild optimiert: <datei> 2796 KB → 264 KB (−91%), 1536×1024`

---

## Schritt 7 – Google-Kalender prüfen

```bash
npm run check-google
```

Alle drei Punkte müssen grün sein. Details und Fehlerdeutung in
[08 – Google Kalender](08-google-kalender.md).

---

## Wenn etwas schiefgeht: zurück

**Variante A – Code zurückdrehen** (Datenbank bleibt unberührt):

```bash
ssh <benutzer>@<server>
cd <projektpfad>
git reset --hard <notierte-nummer-aus-1c>
npm ci --omit=dev
pm2 restart kunsttherapie
curl -s https://www.kunsttherapie-pb.de/health
```

**Variante B – auch die Datenbank zurück** (nur wenn Daten beschädigt sind;
alles seit der Sicherung Eingegangene geht dabei verloren):

```bash
pm2 stop kunsttherapie
cp ~/sicherung/database-vor-deploy-<datum>.sqlite database.sqlite
pm2 start kunsttherapie
```

**Variante C – auf GitHub zurücknehmen:** Im gemergten PR auf **Revert**
klicken und den entstehenden PR mergen. Das deployt automatisch den Stand davor.

---

## Fehlerbilder

| Symptom | Ursache | Lösung |
| --- | --- | --- |
| `build` rot | QA oder Build schlägt fehl | Log lesen, lokal nachstellen, nicht deployt – Seite ist sicher |
| `Permission denied (publickey)` | SSH-Schlüssel rotiert | Öffentlichen Schlüssel neu hinterlegen, Secret `VPS_SSH_KEY` erneuern |
| `Your local changes would be overwritten` | auf dem Server wurde direkt editiert | `git status` ansehen, sichern, dann `git reset --hard origin/main` |
| Seite zeigt altes Aussehen | Browser-Cache | Strg+F5; die Dateinamen enthalten einen Hash, der sich ändert |
| Stylesheet fehlt (404) | gebaute Dateien nicht eingecheckt | `npm run build-frontend`, committen, erneut deployen |
| Keine E-Mails | SMTP | `pm2 logs kunsttherapie \| grep E-Mail` |

---

## Danach

- [ ] Sicherung aufbewahren, bis die Seite ein paar Tage stabil läuft
- [ ] Martina kurz Bescheid geben, was sich geändert hat – Überblick in
      [14 – Änderungsübersicht](14-aenderungen-ueberblick.md)
- [ ] Offene inhaltliche Fragen aus [09 – Review](09-website-review.md)
      nachziehen (Datumstexte, 60 oder 90 Minuten, Neuigkeiten)
