# Google Kalender verbinden – Schritt-für-Schritt

Diese Anleitung erklärt, wie du deinen Google Kalender mit der Website verbindest, sodass:
- **neue Buchungen automatisch in deinem Kalender erscheinen**
- **bestehende Kalendertermine die freien Zeiten auf der Website blockieren**

---

## Was du brauchst

- Ein Google-Konto (z. B. dein Gmail, das du für die Praxis nutzt)
- Zugang zu deiner `.env`-Datei auf dem Server (kannst du Marian schicken)
- Ca. 15 Minuten Zeit

---

## Schritt 1 – Google Cloud Projekt anlegen

1. Gehe zu **[console.cloud.google.com](https://console.cloud.google.com)**
2. Melde dich mit dem Google-Konto an, dessen Kalender du verbinden möchtest
3. Klicke oben links auf das Projekt-Dropdown → **„Neues Projekt"**
4. Name: `Kunsttherapie Paderborn` → **„Erstellen"**
5. Warte kurz, bis das Projekt erstellt ist, und stelle sicher, dass es ausgewählt ist

---

## Schritt 2 – Google Calendar API aktivieren

1. Klicke links im Menü auf **„APIs und Dienste"** → **„Bibliothek"**
2. Suche nach `Google Calendar API`
3. Klicke drauf → **„Aktivieren"**

---

## Schritt 3 – OAuth-Zustimmungsbildschirm einrichten

1. Gehe zu **„APIs und Dienste"** → **„OAuth-Zustimmungsbildschirm"**
2. Wähle **„Extern"** → **„Erstellen"**
3. Fülle aus:
   - **App-Name:** `Kunsttherapie Paderborn`
   - **Support-E-Mail:** `info@kunsttherapie-pb.de`
   - **E-Mail des Entwicklers:** `info@kunsttherapie-pb.de`
4. Klicke **„Speichern und fortfahren"** (durch alle weiteren Schritte, nichts anderes nötig)
5. Am Ende auf **„Zurück zum Dashboard"**

> **Wichtig:** Die App muss NICHT verifiziert werden. Sie läuft im „Testmodus" – das reicht komplett für den Eigenbetrieb.

---

## Schritt 4 – OAuth-Zugangsdaten erstellen

1. Gehe zu **„APIs und Dienste"** → **„Anmeldedaten"**
2. Klicke oben auf **„+ Anmeldedaten erstellen"** → **„OAuth-Client-ID"**
3. Anwendungstyp: **„Webanwendung"**
4. Name: `Kunsttherapie Website`
5. Unter **„Autorisierte Weiterleitungs-URIs"** klicke **„URI hinzufügen"** und trage ein:
   ```
   https://www.kunsttherapie-pb.de/api/admin/google/callback
   ```
6. Klicke **„Erstellen"**

Du siehst jetzt ein Fenster mit:
- **Client-ID** (lange Zeichenkette, endet auf `.apps.googleusercontent.com`)
- **Clientschlüssel** (kürzerer Code)

> **Notiere dir beide Werte** oder klicke auf **„JSON herunterladen"** zur Sicherheit.

---

## Schritt 5 – Werte in die .env-Datei eintragen

Schicke Marian die beiden Werte. Er trägt sie in die `.env`-Datei auf dem Server ein:

```
GOOGLE_CLIENT_ID=deine-client-id-hier.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=dein-clientschlüssel-hier
GOOGLE_REDIRECT_URI=https://www.kunsttherapie-pb.de/api/admin/google/callback
GOOGLE_CALENDAR_ID=primary
```

Danach muss der Server einmal **neu gestartet** werden (`pm2 restart kunsttherapie` o. ä.).

---

## Schritt 6 – Im Admin-Panel verbinden

1. Gehe zu **[www.kunsttherapie-pb.de/admin](https://www.kunsttherapie-pb.de/admin)**
2. Melde dich an
3. Klicke links auf **„Buchungen & Kalender"**
4. Du siehst den Bereich **„Google Kalender"** – der Status sollte jetzt lauten:  
   *„Noch nicht verbunden. Klicke unten und melde dich mit dem Google-Konto des Ateliers an."*
5. Klicke auf **„Mit Google verbinden"**
6. Ein neues Fenster öffnet sich → melde dich mit dem Google-Konto an
7. Klicke auf **„Erweitert"** → **„Weiter zu Kunsttherapie Paderborn (unsicher)"**  
   *(Das ist normal, da die App im Testmodus läuft)*
8. Erlaube den Zugriff auf Google Kalender
9. Das Fenster schließt sich, zurück im Admin-Panel steht jetzt:  
   ✅ *„Verbunden mit Kalender: primary"*

**Fertig!** Ab jetzt werden alle bestätigten Buchungen automatisch in deinen Google Kalender eingetragen.

---

## Was passiert danach automatisch?

| Aktion auf der Website | Im Google Kalender |
|---|---|
| Buchung bestätigt | Neuer Termin wird angelegt |
| Buchung storniert | Termin wird gelöscht |
| Termin in Google Kalender | Blockiert Zeitfenster auf der Website |

---

## Häufige Fragen

**Welchen Kalender nimmt die Website?**  
Standardmäßig den Hauptkalender (`primary`) des verbundenen Google-Kontos. Falls du einen separaten Praxis-Kalender nutzen möchtest, sag Marian Bescheid – das lässt sich mit der Kalender-ID in der `.env` anpassen.

**Was passiert, wenn ich Google trenne?**  
Bestehende Buchungen auf der Website bleiben erhalten. Die Google-Kalendereinträge bleiben auch – sie werden nur nicht mehr automatisch synchronisiert.

**Muss ich das wiederholen?**  
Nein. Die Verbindung bleibt dauerhaft bestehen, auch nach Server-Neustarts.

**Die Website funktioniert auch OHNE Google Kalender?**  
Ja, vollständig. Das Buchungssystem läuft unabhängig.

---

*Erstellt für Martina Schwierzke – Kunsttherapie Paderborn*
