# Google Kalender verbinden

Vollständige, gegen den Code geprüfte Anleitung. Ersetzt `GOOGLE-KALENDER-ANLEITUNG.md`
im Projekt-Root – die enthält einen Fehler, der die Verbindung nach 7 Tagen
abreißen lässt (siehe [Der wichtigste Punkt](#der-wichtigste-punkt-veröffentlichungsstatus)).

---

## Was die Verbindung bewirkt

| Auf der Website | Im Google Kalender |
| --- | --- |
| Bestätigte Buchung | Termin wird angelegt (`Kunsttherapie: <Name>`, mit E-Mail/Telefon/Nachricht in der Beschreibung) |
| Buchung storniert | Zugehöriger Termin wird gelöscht |
| Freie Slots auf `/buchung` | Jeder Termin im Google-Kalender blockiert das überlappende Zeitfenster |

Gelesen und beschrieben wird der Kalender aus `GOOGLE_CALENDAR_ID` (Standard:
`primary`, also der Hauptkalender des verbundenen Kontos).

**Die Buchung funktioniert auch ohne Google vollständig.** Die Anbindung ist optional.

---

## Voraussetzungen vor dem Termin

- Google-Konto der Praxis (das Konto, dessen Kalender verbunden werden soll)
- Zugriff auf die `.env` auf dem Server (SSH) – die Client-Zugangsdaten müssen dort eingetragen werden
- Ein Serverneustart ist nötig, nachdem die Zugangsdaten eingetragen sind
- Rechnen mit ca. 20–30 Minuten

> Ohne `GOOGLE_CLIENT_ID` und `GOOGLE_CLIENT_SECRET` in der `.env` ist der Button
> „Mit Google verbinden" im Admin-Panel wirkungslos – die API antwortet dann mit
> „GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET in .env eintragen". Dieser Schritt
> lässt sich nicht im Admin-Panel erledigen.

---

## Der wichtigste Punkt: Veröffentlichungsstatus

Google gibt für OAuth-Apps im Status **„Testing" / „Test"** Refresh-Tokens aus,
die **nach 7 Tagen ablaufen**. Danach schlägt die Kalenderabfrage still fehl
(siehe [Ausfallverhalten](#ausfallverhalten-wichtig)) und die Verbindung muss neu
hergestellt werden.

**Deshalb: Den Veröffentlichungsstatus der App auf „Produktion" / „In production"
setzen.** Für den Eigenbetrieb durch eine einzelne Person ist das ohne
Google-Verifizierung möglich. Der Preis dafür ist ein Warnhinweis beim
Verbinden („Google hat diese App nicht überprüft"), den man einmalig über
**„Erweitert" → „Weiter zu …"** bestätigt. Danach bleibt der Token dauerhaft gültig.

Die alte Anleitung im Root behauptet das Gegenteil („Testmodus reicht komplett"
und gleichzeitig „Die Verbindung bleibt dauerhaft bestehen"). Beides zusammen
stimmt nicht.

---

## Schritt 1 – Google-Cloud-Projekt

1. [console.cloud.google.com](https://console.cloud.google.com) öffnen, mit dem Praxis-Google-Konto anmelden
2. Oben links Projekt-Auswahl → **Neues Projekt**
3. Name z. B. `Kunsttherapie Paderborn` → **Erstellen**, danach das Projekt auswählen

## Schritt 2 – Calendar API aktivieren

**APIs & Dienste → Bibliothek** → nach `Google Calendar API` suchen → **Aktivieren**

Dieser Schritt wird leicht übersehen, weil die Verbindung im Admin-Panel auch
ohne ihn scheinbar klappt: Die Anmeldung gelingt, der Token wird gespeichert –
erst der erste echte Kalenderzugriff scheitert dann mit
*„Google Calendar API has not been used in project … before or it is disabled"*.
Nach dem Aktivieren dauert es ein paar Minuten, bis Google die Freigabe
durchgereicht hat.

## Schritt 3 – Zustimmungsbildschirm / Zielgruppe

Google hat diesen Bereich zu **„Google Auth Platform"** umgebaut; je nach Konto
heißen die Punkte „OAuth-Zustimmungsbildschirm" oder „Branding" / „Zielgruppe" /
„Clients". Einzutragen ist in jedem Fall:

- **App-Name:** `Kunsttherapie Paderborn`
- **Nutzersupport-E-Mail** und **Kontakt-E-Mail des Entwicklers:** `info@kunsttherapie-pb.de`
- **Nutzertyp / Zielgruppe:** `Extern`

Danach unter **Zielgruppe** (bzw. „Publishing status") die App auf
**Produktion / In production** setzen – siehe Abschnitt oben. Eine Verifizierung
ist dafür nicht erforderlich und soll nicht beantragt werden.

Der benötigte Scope ist `https://www.googleapis.com/auth/calendar` (Lesen **und**
Schreiben – die Website legt Termine an und löscht sie wieder).

## Schritt 4 – OAuth-Client erstellen

1. **APIs & Dienste → Anmeldedaten → + Anmeldedaten erstellen → OAuth-Client-ID**
2. Anwendungstyp: **Webanwendung**, Name z. B. `Kunsttherapie Website`
3. Unter **Autorisierte Weiterleitungs-URIs** exakt eintragen:
   ```
   https://www.kunsttherapie-pb.de/api/admin/google/callback
   ```
   Der Wert muss **zeichengenau** mit `GOOGLE_REDIRECT_URI` in der `.env`
   übereinstimmen, sonst bricht Google mit `redirect_uri_mismatch` ab.
   Für lokale Tests zusätzlich `http://localhost:3000/api/admin/google/callback` eintragen.
4. **Erstellen** → Client-ID und Clientschlüssel notieren (oder JSON herunterladen)

## Schritt 5 – `.env` auf dem Server

```bash
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<clientschlüssel>
GOOGLE_REDIRECT_URI=https://www.kunsttherapie-pb.de/api/admin/google/callback
GOOGLE_CALENDAR_ID=primary
```

Danach neu starten:

```bash
pm2 restart kunsttherapie
```

`GOOGLE_REFRESH_TOKEN` bleibt leer – den holt sich die Anwendung in Schritt 6
selbst und legt ihn in der Datenbank ab (Tabelle `settings`).

## Schritt 6 – Im Admin-Panel verbinden

1. `https://www.kunsttherapie-pb.de/admin` öffnen und anmelden
2. Links auf **Buchungen** wechseln, Bereich **Google Kalender**
3. **Mit Google verbinden** klicken
4. Mit dem Praxis-Google-Konto anmelden
5. Beim Hinweis „Google hat diese App nicht überprüft": **Erweitert** → **Weiter zu Kunsttherapie Paderborn**
6. Zugriff auf den Kalender erlauben
7. Bestätigungsseite „Google Kalender verbunden ✓" erscheint → zurück zum Admin-Panel

> Der Hinweistext auf der Bestätigungsseite empfiehlt, den Refresh-Token
> zusätzlich in die `.env` einzutragen, und behauptet, man finde ihn im
> Admin-Panel. Das stimmt nicht – der Token wird aus Sicherheitsgründen nirgends
> angezeigt. Der Hinweis lässt sich ignorieren; die Verbindung funktioniert über
> den in der Datenbank gespeicherten Token.

## Schritt 7 – Verbindung prüfen

Auf dem Server:

```bash
npm run check-google
```

Das Skript prüft die `.env`-Werte, den gespeicherten Token und macht einen
**echten Lesezugriff** auf den Kalender. Nur der dritte Punkt beweist, dass die
Anbindung trägt – siehe [Ausfallverhalten](#ausfallverhalten-wichtig).

```bash
curl -s https://www.kunsttherapie-pb.de/api/bookings/config
```

Im Admin-Panel muss der Status auf „verbunden" stehen. Zusätzlich ein echter Test:

1. Im Google Kalender einen Testtermin am nächsten Dienstag 11:00–12:30 anlegen
2. Auf `/buchung` den Dienstag aufrufen → der Slot muss als belegt erscheinen
3. Testtermin wieder löschen → der Slot muss wieder frei sein

Nur dieser Test beweist, dass die Leserichtung funktioniert.

---

## Ausfallverhalten (wichtig)

Wenn die Google-Abfrage fehlschlägt – abgelaufener Token, entzogener Zugriff,
API nicht aktiviert, Störung bei Google – behandelt die Website den Kalender als
leer und zeigt **alle Slots als frei** an. Für den Besucher sieht das aus wie ein
normaler freier Termin; die Folge wären Doppelbuchungen.

Damit das nicht unbemerkt bleibt:

- **Admin-Panel → Buchungen** prüft den Zugriff bei jedem Aufruf wirklich nach
  und zeigt bei einem Fehler in Rot *„Verbunden, aber der Kalender kann nicht
  gelesen werden"* samt Google-Meldung an. Steht dort nur
  *„Verbunden mit Kalender: …"*, ist der Zugriff in Ordnung.
- `npm run check-google` auf dem Server meldet denselben Zustand ausführlicher,
  inklusive der Frage, welche Kalender gelesen und welche ignoriert werden.
- Veröffentlichungsstatus auf Produktion setzen (sonst garantierter Ausfall nach 7 Tagen)
- Nach dem Verbinden den Praxistest aus Schritt 7 durchführen
- Gelegentlich ins Log sehen: `pm2 logs kunsttherapie | grep "Google Kalender"`

Sind mehrere Kalender eingetragen und nur einer davon nicht lesbar, laufen die
übrigen weiter – der ausgefallene wird im Admin-Panel und in `check-google`
namentlich genannt.

Siehe auch [09 – Review](09-website-review.md), Befund B2.

---

## Bekannte Eigenheiten

- **Ganztägige Termine** im verbundenen Kalender (z. B. „Urlaub") blockieren den
  kompletten Tag. Das ist in der Regel gewollt.
- **Als „Frei"/„Verfügbar" markierte Termine blockieren nicht.** Wer einen
  Kalendereintrag als Notiz führen will, ohne eine Buchungszeit zu sperren,
  stellt ihn in Google auf „Frei".
- **Mehrere Kalender** sind möglich: `GOOGLE_CALENDAR_ID` darf kommagetrennt
  mehrere IDs enthalten. Alle davon blockieren Buchungszeiten; **geschrieben**
  wird immer in den **ersten** Eintrag der Liste. Welche Kalender es im Konto
  gibt und welche derzeit gelesen werden, zeigt `npm run check-google` mitsamt
  fertiger `GOOGLE_CALENDAR_ID=`-Zeile zum Kopieren. Termine in nicht
  eingetragenen Kalendern zählen nicht.
- **Trennen:** Der gespeicherte Token liegt in `settings` (`google_refresh_token`).
  Der Zugriff lässt sich jederzeit im Google-Konto unter
  *Sicherheit → Drittanbieter-Apps* widerrufen.

---

## Wenn etwas schiefgeht

| Symptom | Ursache | Lösung |
| --- | --- | --- |
| `redirect_uri_mismatch` | URI in Google ≠ `GOOGLE_REDIRECT_URI` | Beide exakt angleichen, inkl. `https://` und `www.` |
| Button tut nichts, Fehler „GOOGLE_CLIENT_ID … eintragen" | `.env` unvollständig oder Server nicht neu gestartet | Schritt 5 wiederholen |
| „Kein Refresh-Token erhalten" | Google gibt nur beim ersten Consent einen Refresh-Token | Zugriff im Google-Konto widerrufen, dann erneut verbinden |
| „Ungültiger OAuth-State" | Ablauf zu lange her oder zwischendurch neu gestartet | Verbindung im Admin-Panel neu starten |
| Verbindung reißt nach ~1 Woche ab | App steht auf „Testing" | Veröffentlichungsstatus auf **Produktion** setzen, dann neu verbinden |
| „Google Calendar API has not been used in project … or it is disabled" | Schritt 2 wurde übersprungen | **APIs & Dienste → Bibliothek → Google Calendar API → Aktivieren**, ein paar Minuten warten, dann `npm run check-google` |
| Admin-Panel: „Verbunden, aber der Kalender kann nicht gelesen werden" | siehe Google-Meldung in derselben Zeile | `npm run check-google` auf dem Server ausführen – es nennt die Ursache im Klartext |
