# Google Kalender – Checkliste zum Abarbeiten

Zum Mitlaufen während des Termins. Ausführliche Erklärungen:
[08 – Google Kalender](08-google-kalender.md).

**Was du brauchst:** Laptop, SSH-Zugang zum Server, Martina am Rechner
mit ihrem Google-Konto.

---

## Der eine Punkt, den du nicht vergessen darfst

In **Schritt C** die App auf **„Produktion" / „In production"** setzen.
Bleibt sie auf „Testing", ist die Verbindung **nach 7 Tagen tot** – und die
Website zeigt dann alle Termine als frei an, ohne jede Fehlermeldung.

---

## A · Google-Projekt · *ihr Konto, sie klickt*

- [ ] [console.cloud.google.com](https://console.cloud.google.com) – mit dem **Praxis-Google-Konto** anmelden
- [ ] Oben links → **Neues Projekt** → Name `Kunsttherapie Paderborn` → **Erstellen**
- [ ] Projekt oben auswählen (wird nicht automatisch aktiv)

## B · Calendar API einschalten

- [ ] **APIs & Dienste → Bibliothek**
- [ ] Nach `Google Calendar API` suchen → **Aktivieren**

## C · Zustimmungsbildschirm + Produktion ⚠️

Heißt je nach Konto „OAuth-Zustimmungsbildschirm" oder „Google Auth Platform"
mit den Punkten *Branding · Zielgruppe · Clients*.

- [ ] App-Name: `Kunsttherapie Paderborn`
- [ ] Support-E-Mail und Entwickler-E-Mail: `info@kunsttherapie-pb.de`
- [ ] Nutzertyp / Zielgruppe: **Extern**
- [ ] **Veröffentlichungsstatus → „Produktion" / „In production"** ⚠️
- [ ] Keine Verifizierung beantragen – nicht nötig

## D · OAuth-Client anlegen

- [ ] **APIs & Dienste → Anmeldedaten → + Anmeldedaten erstellen → OAuth-Client-ID**
- [ ] Anwendungstyp: **Webanwendung**, Name: `Kunsttherapie Website`
- [ ] Unter *Autorisierte Weiterleitungs-URIs* **exakt** eintragen:

```
https://www.kunsttherapie-pb.de/api/admin/google/callback
```

- [ ] **Erstellen** → **Client-ID** und **Clientschlüssel** notieren

> Zeichengenau. Ein fehlendes `www.` oder `https` → `redirect_uri_mismatch`.

## E · Auf dem Server eintragen · *du, per SSH*

- [ ] Einloggen und ins Projektverzeichnis wechseln
- [ ] In die `.env` eintragen (vorhandene Zeilen ersetzen, nicht doppeln):

```bash
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<clientschlüssel>
GOOGLE_REDIRECT_URI=https://www.kunsttherapie-pb.de/api/admin/google/callback
GOOGLE_CALENDAR_ID=primary
```

- [ ] `GOOGLE_REFRESH_TOKEN` **leer lassen** – kommt gleich automatisch
- [ ] Neu starten:

```bash
pm2 restart kunsttherapie
```

- [ ] Prüfen, dass die Werte ankommen:

```bash
npm run check-google
```

Erwartung an dieser Stelle: Punkt 1 grün, Punkt 2 meldet
*„Kalender noch nicht verbunden"*. Genau richtig – weiter mit F.

## F · Verbinden · *sie klickt*

- [ ] `https://www.kunsttherapie-pb.de/admin` → anmelden
- [ ] **Buchungen** → Bereich **Google Kalender** → **Mit Google verbinden**
- [ ] Mit dem Praxis-Google-Konto anmelden
- [ ] Warnung „Google hat diese App nicht überprüft" → **Erweitert** → **Weiter zu Kunsttherapie Paderborn**
- [ ] Kalenderzugriff **erlauben**
- [ ] Bestätigungsseite „Google Kalender verbunden ✓"

> Der Hinweis dort, den Refresh-Token „im Admin-Panel" abzulesen, geht ins
> Leere – er wird bewusst nicht angezeigt. Ignorieren, alles ist in Ordnung.

## G · Beweisen, dass es wirklich läuft ⚠️

Nicht überspringen. Ohne diesen Schritt weißt du nur, dass es *aussieht*,
als hätte es geklappt.

- [ ] Auf dem Server:

```bash
npm run check-google
```

  Erwartung: alle drei Punkte grün, *„Verbindung funktioniert"*.

- [ ] **Der echte Test** – Martina legt in ihrem Google-Kalender einen Termin
      am **nächsten Dienstag 11:00–12:30** an
- [ ] `https://www.kunsttherapie-pb.de/buchung` öffnen, zu dem Dienstag blättern
- [ ] Der Tag **darf nicht mehr grün/buchbar** sein
- [ ] Testtermin in Google wieder löschen → Tag ist wieder grün

Erst wenn dieser Durchlauf sitzt, ist die Verbindung bewiesen.

---

## Wenn es klemmt

| Meldung | Ursache | Lösung |
| --- | --- | --- |
| `redirect_uri_mismatch` | URI in Google ≠ `.env` | Beide zeichengenau angleichen, inkl. `www.` |
| `invalid_client` | Client-ID/Secret falsch | Werte abgleichen, `pm2 restart kunsttherapie` |
| `invalid_grant` | Token abgelaufen/widerrufen | Fast immer Schritt C vergessen → auf Produktion setzen, neu verbinden |
| Button reagiert nicht | `.env` fehlt oder kein Neustart | Schritt E wiederholen |
| „Kein Refresh-Token erhalten" | Google gibt ihn nur beim ersten Consent | Zugriff im Google-Konto widerrufen, neu verbinden |

---

## Was du ihr danach sagen solltest

- **Urlaub sperren geht am einfachsten über ihren Google-Kalender**: ganztägiger
  Eintrag – die Website blockiert den Tag dann automatisch.
- **Achtung:** Termine, die sie in Google als „Frei/Verfügbar" markiert,
  blockieren trotzdem. Die Website unterscheidet das nicht.
- **Nur der eine Kalender** (`primary`) zählt. Termine in anderen Kalendern
  desselben Kontos – Feiertage, Geburtstage, Familienkalender – blockieren nichts.
- Stornierte Buchungen löschen den Google-Termin automatisch mit.

---

## Nach dem Termin

- [ ] In einer Woche einmal `npm run check-google` laufen lassen – das ist der
      Punkt, an dem eine vergessene Umstellung auf „Produktion" auffliegen würde
- [ ] Offene inhaltliche Fragen aus [10 – Termin-Vorbereitung](10-termin-vorbereitung.md)
      nachziehen: Datumstexte, Sitzungsdauer 60 oder 90 Minuten, Neuigkeiten
