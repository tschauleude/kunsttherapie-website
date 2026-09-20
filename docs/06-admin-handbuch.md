# Admin-Handbuch

Für die Pflege der Website – ohne technische Vorkenntnisse.

---

## Anmelden

1. **www.kunsttherapie-pb.de/admin** aufrufen
2. Benutzername und Passwort eingeben

Die Anmeldung gilt 24 Stunden, danach ist eine erneute Anmeldung nötig. Nach fünf
Fehlversuchen ist der Zugang 15 Minuten gesperrt – das schützt vor fremden
Anmeldeversuchen.

**Passwort ändern:** oben rechts im Admin-Panel.

---

## Die Bereiche im Überblick

| Bereich | Wofür |
| --- | --- |
| **Übersicht** | Startseite mit den wichtigsten Zahlen |
| **Neuigkeiten** | Meldungen für die Neuigkeiten-Seite |
| **Veranstaltungen** | Workshops und Termine mit Anmeldung |
| **Buchungen** | Terminanfragen, Google-Kalender, Urlaubssperren |
| **Nachrichten** | Eingegangene Kontaktanfragen |
| **Website-Texte** | Alle Texte der Website ändern |
| **Bilder** | Bilder austauschen |
| **Preistabelle** | Preise pflegen |
| **Mini-Atelier** | Eingesendete Bilder von Besuchern |
| **Bugs für Marian** | Notizzettel für alles, was auffällt |

---

## Das Wichtigste zuerst: Sicherungspunkte

**Gute Nachricht vorweg: Das geschieht meist von allein.** Bei jedem Speichern
von Texten oder Bildern legt das System automatisch einen Sicherungspunkt an.

Zusätzlich von Hand, etwa vor einer größeren Umarbeitung:

**Übersicht → „Jetzt Sicherungspunkt erstellen"**

(Der Button steht auf der Startseite des Admin-Panels, nicht bei den Texten.)
Es erscheint ein kleines Fenster für einen optionalen Namen – etwa
„Vor Überarbeitung Startseite". Danach auf OK.

Geht etwas schief, lässt sich jederzeit dorthin zurückkehren. Es werden die
letzten 80 Sicherungspunkte aufbewahrt.

**Sie können nichts kaputtmachen, was sich nicht zurückholen ließe.**

---

## Neuigkeit schreiben

1. **Neuigkeiten** → **Neue Neuigkeit**
2. Titel und Text eingeben, bei Bedarf ein Bild hochladen
3. **Speichern**

Neue Einträge sind zunächst **Entwürfe** und noch nicht öffentlich. Erst ein Klick
auf **Veröffentlicht** stellt sie auf die Website. Über die Schaltflächen
*Entwürfe* / *Veröffentlicht* lässt sich die Liste filtern.

Zum Zurückziehen: erneut auf **Veröffentlicht** klicken – der Eintrag wird wieder
zum Entwurf, ohne gelöscht zu werden.

---

## Veranstaltung anlegen

**Veranstaltungen → Neue Veranstaltung**. Einzutragen sind Titel, Beschreibung,
Datum, Uhrzeit, Ort und – optional – eine Teilnehmerzahl. Auch hier gilt:
erst nach **Veröffentlicht** ist die Veranstaltung sichtbar.

Anmeldungen zu einer Veranstaltung erscheinen direkt bei ihr in der Liste.

---

## Terminanfragen bearbeiten

Unter **Buchungen** laufen die Anfragen von der Website ein.

So läuft eine Buchung ab:

1. Jemand wählt auf der Website einen Termin und trägt seine Daten ein
2. Er bekommt eine E-Mail mit einem Bestätigungslink – **erst mit dem Klick darauf
   wird die Anfrage gültig** (Schutz vor falschen Adressen und automatisierten Eintragungen)
3. Sie erhalten eine Benachrichtigung und sehen die Anfrage im Admin-Panel
4. Sie **bestätigen** oder **sagen ab**
5. Bei Bestätigung: Der Anfragende bekommt eine Zusage mit Kalender-Datei, und der
   Termin wird – falls der Google-Kalender verbunden ist – dort eingetragen

Sagen Sie einen bestätigten Termin ab, wird auch der Google-Kalendereintrag gelöscht.

### Urlaub und freie Tage sperren

**Buchungen → „Sperren"**: Zeitraum eintragen, fertig. In diesem Zeitraum lässt
sich nichts mehr buchen.

Alternativ – oft bequemer: Tragen Sie den Urlaub einfach als ganztägigen Termin in
Ihren Google-Kalender ein. Wenn der Kalender verbunden ist, blockiert das die
Website automatisch.

### Buchbare Zeiten

Standardmäßig **Dienstag 11:00–12:30** und **Donnerstag 18:00–19:30**, jeweils
90 Minuten, mit mindestens 24 Stunden Vorlauf. Sollen sich diese Zeiten ändern,
ist das eine Einstellung am Server – bitte Bescheid geben.

---

## Nachrichten

Unter **Nachrichten** stehen die Kontaktanfragen. Auch sie durchlaufen die
Bestätigung per E-Mail. In der Benachrichtigungsmail können Sie direkt annehmen
oder ablehnen, ohne sich anzumelden.

---

## Website-Texte ändern

**Website-Texte** zeigt alle änderbaren Texte, nach Seite geordnet: Startseite,
Kunsttherapie, Häufige Fragen, Über mich, Preise, Kontakt, Buchung sowie die
Suchmaschinen-Texte.

1. Gruppe auswählen
2. Text ändern – jedes Feld ist beschriftet („Hero – Überschrift", „Karte Privat – Text" …)
3. Zwischen **Deutsch** und **English** umschalten, um beide Sprachen zu pflegen
4. **Texte speichern**

Die Änderung ist sofort auf der Website sichtbar.

**Wieder zurück zum Original:** „Standard wiederherstellen" setzt eine Gruppe auf
die Ausgangstexte zurück.

Bei einigen Feldern steht ein Hinweis wie *„Akzent: `<span class="text-accent">…</span>`"*.
Das ist eine Auszeichnung für farbig hervorgehobene Wörter. Wenn Sie damit nichts
anfangen möchten: einfach den normalen Text schreiben und die spitzen Klammern
so stehen lassen, wie sie sind.

> Ein technischer Hinweis für die Betreuung: Textänderungen sollten anschließend
> im Repository gesichert werden (`data/i18n-overrides.json`), damit sie ein
> Update sicher überstehen.

---

## Bilder austauschen

Unter **Website-Bilder** hat jeder Platz auf der Website einen festen Slot:
Logo, großes Bild der Startseite, die sechs Galeriebilder, Ihr Porträt und die
vier Raumbilder.

1. Slot auswählen
2. Bild hochladen oder aus der **Mediathek** wählen
3. **Alt-Text** eintragen – die Bildbeschreibung für blinde Besucher und für
   Suchmaschinen. Bitte ausfüllen, ein Satz genügt.

„Standard wiederherstellen" holt das ursprüngliche Bild zurück.

Die Anzahl der Galeriebilder auf der Startseite lässt sich ebenfalls hier einstellen.

---

## Preistabelle

Unter **Preistabelle** lassen sich Leistung, Dauer, Preis und Hinweis ändern.
Nach dem Speichern ist die Preisseite sofort aktuell.

---

## Mini-Atelier

Besucher können auf der Website ein Bild malen und einsenden. Unter
**Mini-Atelier** sehen Sie die Einsendungen und können sie behalten oder löschen.
Die Einsendungen sind standardmäßig anonym.

---

## Wenn etwas nicht stimmt

Der Bereich **Bugs für Marian** ist genau dafür da: einfach hineinschreiben, was
aufgefallen ist. Der Text bleibt gespeichert.

Bei dringenden Problemen – Website nicht erreichbar, keine Buchungen möglich,
keine E-Mails – bitte direkt melden.

---

## Kurz gefasst

- Sicherungspunkte entstehen beim Speichern automatisch; zusätzlich von Hand über **Übersicht**
- Neuigkeiten und Veranstaltungen sind erst nach **Veröffentlicht** sichtbar
- Urlaub am einfachsten als ganztägigen Termin im Google-Kalender eintragen
- Bei Bildern immer einen **Alt-Text** vergeben
- Buchungen und Nachrichten erreichen Sie erst nach der Bestätigung durch den Absender – das ist Absicht
