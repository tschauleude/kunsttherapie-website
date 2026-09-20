# Vorbereitung: Termin mit Martina Schwierzke

Stand: 16.09.2026 · für den Termin am 17.09.2026

---

## Vorher erledigen (ohne Martina)

- [ ] Prüfen, ob `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` schon in der `.env` auf dem Server stehen
      (`ssh` → `grep GOOGLE /pfad/zum/projekt/.env`). Wenn ja, entfällt der halbe Google-Teil.
- [ ] SSH-Zugang zum Server testen – der Google-Schritt braucht ihn zwingend
- [ ] Prüfen, ob Martina schon ein Google-Konto für die Praxis hat oder ihr privates nutzt
- [ ] Admin-Zugang bereithalten: funktioniert ihr Login? Passwort bekannt?
- [ ] [09 – Review](09-website-review.md) überfliegen, Punkte A1–A3 sind die Fragen an sie

**Mitbringen:** Laptop mit SSH-Zugang, dieses Dokument, [08 – Google Kalender](08-google-kalender.md).

---

## Ablauf-Vorschlag (ca. 90 Minuten)

### 1. Google Kalender verbinden (30–40 Min)

Vollständige Anleitung: **[08 – Google Kalender](08-google-kalender.md)**. Kurzfassung:

1. Google-Cloud-Projekt anlegen, Calendar API aktivieren *(ihr Konto, ihre Anmeldung)*
2. Zustimmungsbildschirm ausfüllen — **und den Status auf „Produktion" setzen**
3. OAuth-Client (Webanwendung) mit Redirect-URI `https://www.kunsttherapie-pb.de/api/admin/google/callback`
4. Client-ID + Secret in die `.env` auf dem Server, `pm2 restart kunsttherapie`
5. Admin-Panel → Buchungen → „Mit Google verbinden"
6. **Gegentest:** Testtermin nächster Dienstag 11:00 im Kalender anlegen → muss auf `/buchung` als belegt erscheinen → wieder löschen

> **Der eine Punkt, der leicht übersehen wird:** Bleibt die App im Google-Status
> „Testing", läuft die Verbindung **nach 7 Tagen ab** und die Website zeigt
> anschließend alle Termine als frei an, ohne jede Fehlermeldung. Deshalb Schritt 2
> nicht überspringen. Der Warnhinweis „nicht überprüfte App" beim Verbinden ist
> normal und wird einmalig über „Erweitert" bestätigt.

**Ihr erklären:** Termine, die sie im Google-Kalender einträgt, blockieren
automatisch die Website-Slots — das ist ihr Werkzeug, um Zeiten zu sperren, ohne
ins Admin-Panel zu gehen. Ganztägige Einträge („Urlaub") sperren den ganzen Tag.
Achtung: Termine, die sie in Google als „Frei/Verfügbar" markiert, blockieren
trotzdem.

---

### 2. Inhaltliche Entscheidungen (20 Min)

Diese drei Punkte kann nur sie beantworten:

| Frage | Hintergrund |
| --- | --- |
| **Wie soll es statt „Neue Gruppen ab 1. Juli 2026" heißen?** | Steht an mehreren Stellen, das Datum ist zweieinhalb Monate her und lässt die Seite alt wirken. Vorschlag: „Einstieg jederzeit möglich" statt eines festen Datums – dann veraltet nichts mehr. |
| **Dauert eine Sitzung 60 oder 90 Minuten?** | Die Preisseite sagt 60, das Buchungssystem vergibt 90-Minuten-Slots (11:00–12:30). Einer von beiden Werten ist falsch – Kunden buchen sonst etwas anderes, als sie gelesen haben. |
| **Gibt es Neues für die Neuigkeiten-Seite?** | Letzter Eintrag stammt vom Juni. Am besten direkt im Termin gemeinsam zwei Einträge anlegen – dann sieht sie zugleich, wie es geht. |

Weitere mögliche Themen, je nach Zeit:

- Stimmen die Preise noch (39 € Gruppe / 60 € Einzel / 49 € Teambuilding)?
- Sind Di 11:00–12:30 und Do 18:00–19:30 weiterhin die richtigen Zeiten?
- Braucht sie Urlaubszeiten? (Admin-Panel → Buchungen → „Sperren")
- Wird die englische Fassung tatsächlich gebraucht?

---

### 3. Admin-Panel zeigen (20 Min)

Handbuch zum Dalassen: **[06 – Admin-Handbuch](06-admin-handbuch.md)**.

Die vier Dinge, die sie wirklich braucht:

1. **Neuigkeiten** anlegen und veröffentlichen
2. **Website-Texte** ändern (Übersicht aller Texte nach Seite sortiert, DE und EN)
3. **Buchungen** einsehen, bestätigen, absagen und Zeiträume sperren
4. **Bilder** austauschen (feste Slots: Hero, Galerie, Porträt, Raumbilder)

Wichtig mitzugeben: **„Sicherungspunkt erstellen"** vor größeren Textänderungen –
damit lässt sich jede Änderung zurückholen. Nimmt ihr die Angst, etwas kaputtzumachen.

---

### 4. Offene Punkte besprechen (10 Min)

Aus dem [Review](09-website-review.md), zur Priorisierung durch sie:

- Vergangene Tage im Buchungskalender erscheinen rot als „ausgebucht" (wirkt nach außen wie „keine Kapazität")
- Leerer Block über ihrem Porträt auf „Über mich"
- Kalender-Legende zeigt andere Farben als der Kalender selbst

Alles drei sind kleine, klar abgegrenzte Korrekturen.

---

## Was sie danach mitnehmen sollte

- Ihr Google-Kalender ist verbunden und getestet
- Sie hat selbst einmal eine Neuigkeit angelegt und einen Text geändert
- Sie weiß, wie sie Urlaub sperrt
- Sie hat das [Admin-Handbuch](06-admin-handbuch.md) (ausgedruckt oder als Datei)
- Sie weiß, wen sie bei Problemen anspricht

---

## Zugangsdaten

Zugangsdaten gehören **nicht** in dieses Repository – weder in Dokumente noch in
Commits. Die `.env` auf dem Server ist der einzige Ort für Secrets. Wenn Martina
eigene Zugänge braucht, am besten direkt vor Ort gemeinsam setzen
(Admin-Panel → Passwort ändern).
