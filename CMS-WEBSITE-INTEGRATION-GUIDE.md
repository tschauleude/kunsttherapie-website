╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║     🎨 KUNSTTHERAPIE WEBSITE + CMS – KOMPLETTES SETUP HANDBUCH          ║
║                                                                            ║
║     Website + Backend für News, Events & Services Management             ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

🎉 HERZLICHEN GLÜCKWUNSCH!

Du hast jetzt eine PROFESSIONELLE KUNSTTHERAPIE-WEBSITE mit EIGENEM CMS!

════════════════════════════════════════════════════════════════════════════

📦 WAS DU BEKOMMST

✅ Frontend Website (HTML/CSS/JS)
   ├─ Moderne, künstlerische Design
   ├─ Responsive (alle Geräte)
   ├─ Bildergalerie mit deinen Fotos
   └─ Dynamisch mit API integriert

✅ Backend CMS Server (Node.js/Express)
   ├─ Admin-Panel zum Verwalten
   ├─ News, Events & Services Management
   ├─ SQLite Datenbank
   ├─ Benutzer-Authentifizierung
   └─ REST API für Website

✅ Integration zwischen Frontend & Backend
   ├─ News automatisch auf Website
   ├─ Events in Kalender anzeigen
   ├─ Services aktualisieren
   └─ Echtzeit-Updates

════════════════════════════════════════════════════════════════════════════

🚀 SCHRITT 1: SETUP DES BACKENDS

SCHRITT 1A: Node.js installieren
──────────────────────────────────
Falls noch nicht vorhanden:
→ https://nodejs.org (LTS Version)

Überprüfe Installation:
$ node --version
$ npm --version

SCHRITT 1B: Dependencies installieren
──────────────────────────────────────
Öffne Terminal/PowerShell und navigiere zum CMS-Ordner:

$ cd kunsttherapie-cms
$ npm install

Das installiert automatisch:
  ✓ express (Web-Server)
  ✓ sqlite3 (Datenbank)
  ✓ bcryptjs (Passwort-Sicherheit)
  ✓ cors (Cross-Origin-Anfragen)
  ✓ express-session (Login-Sessions)

SCHRITT 1C: Server starten
──────────────────────────
Im kunsttherapie-cms Ordner:

Für Entwicklung (mit Auto-Reload):
$ npm run dev

oder für Produktion:
$ npm start

Du solltest sehen:
╔════════════════════════════════════════╗
║  🎨 Kunsttherapie CMS Backend       ║
║  Server running on http://localhost:3000 ║
║  Admin Panel: http://localhost:3000/admin║
╚════════════════════════════════════════╝

════════════════════════════════════════════════════════════════════════════

🔐 SCHRITT 2: ERSTES LOGIN

1. Öffne Browser: http://localhost:3000/admin
2. Standard-Credentials:
   Benutzername: admin
   Passwort: admin123

3. Du siehst das Admin-Panel mit:
   ✓ Dashboard
   ✓ News & Updates
   ✓ Events & Termine
   ✓ Services & Angebote

⚠️  WICHTIG: Passwort nach dem Login ändern!
    (Feature kommt in nächster Version)

════════════════════════════════════════════════════════════════════════════

📰 SCHRITT 3: NEWS HINZUFÜGEN

Im Admin-Panel:

1. Gehe zu "📰 News & Updates"
2. Klick "➕ Neue News"
3. Fülle aus:
   ├─ Titel: z.B. "Neue Gruppen starten ab Juni"
   ├─ Inhalt: Deine Nachricht
   ├─ Bild: (optional) URL zu Bild
   └─ Veröffentlichen: Checkbox setzen

4. Klick "Speichern"

✅ News erscheint sofort auf deiner Website unter:
   → kunsttherapie-site/neuigkeiten.html

════════════════════════════════════════════════════════════════════════════

📅 SCHRITT 4: EVENTS HINZUFÜGEN

Im Admin-Panel:

1. Gehe zu "📅 Events & Termine"
2. Klick "➕ Neuer Event"
3. Fülle aus:
   ├─ Titel: z.B. "Workshop Acryl-Malerei"
   ├─ Beschreibung: Details
   ├─ Datum: z.B. 15.06.2026
   ├─ Uhrzeit: (optional)
   ├─ Ort: z.B. Otto-Stadler-Str. 23c
   ├─ Plätze: (optional)
   ├─ Bild: (optional)
   └─ Veröffentlichen: Checkbox setzen

4. Klick "Speichern"

✅ Event erscheint sofort auf:
   → kunsttherapie-site/events.html

════════════════════════════════════════════════════════════════════════════

💜 SCHRITT 5: SERVICES VERWALTEN

Im Admin-Panel:

1. Gehe zu "💜 Services & Angebote"
2. Klick "➕ Neuer Service"
3. Fülle aus:
   ├─ Titel: z.B. "Einzeltherapie"
   ├─ Beschreibung: Was ist das Service?
   ├─ Preis: z.B. "ab 55 €"
   ├─ Dauer: z.B. "90 Minuten"
   ├─ Bild: (optional)
   └─ Aktiv: Checkbox setzen

4. Klick "Speichern"

✅ Service wird auf der Website angezeigt

════════════════════════════════════════════════════════════════════════════

🌐 SCHRITT 6: WEBSITE STARTEN

Parallel zum Backend kannst du auch die Website lokal testen:

$ cd kunsttherapie-site
$ python3 -m http.server 8080

Öffne Browser: http://localhost:8080

Beide Systeme laufen gleichzeitig:
  ✓ Website Frontend: http://localhost:8080
  ✓ CMS Backend: http://localhost:3000
  ✓ Admin Panel: http://localhost:3000/admin

════════════════════════════════════════════════════════════════════════════

🎯 ADMIN-PANEL ÜBERSICHT

Dashboard (📊)
  └─ Schneller Überblick
  └─ Anzahl News, Events, Services
  └─ Status-Info

News (📰)
  └─ Alle News verwalten
  └─ Neue News erstellen
  └─ News bearbeiten
  └─ News löschen
  └─ Entwürfe speichern & später veröffentlichen

Events (📅)
  └─ Alle Events verwalten
  └─ Mit Datum, Zeit, Ort
  └─ Kapazität angeben
  └─ Event-Bilder

Services (💜)
  └─ Angebote verwalten
  └─ Mit Preis & Dauer
  └─ Aktivieren/Deaktivieren

════════════════════════════════════════════════════════════════════════════

📱 WEBSITE SEITEN

Automatisch integriert mit Backend:

index.html (Startseite)
  └─ Kunstlerisches Design
  └─ Bildergalerie
  └─ Interaktives Atelier

neuigkeiten.html (News-Seite) ⭐ DYNAMISCH
  └─ Lädt News vom CMS
  └─ Zeigt neueste zuerst
  └─ Mit Datum & Bild

events.html (Events-Seite) ⭐ DYNAMISCH
  └─ Zeigt alle zukünftigen Events
  └─ Mit Datum, Zeit, Ort
  └─ Anmelde-Button

angebote.html (Services)
  └─ Deine Angebote

ueber-mich.html
  └─ Deine Bio & Qualifikationen

kontakt.html
  └─ Kontaktformular & Informationen

════════════════════════════════════════════════════════════════════════════

🔧 TECHNISCHE DETAILS

FRONTEND:
  ├─ HTML5
  ├─ CSS3 (mit CSS Variablen)
  ├─ Vanilla JavaScript
  └─ Responsive Design

BACKEND:
  ├─ Node.js Runtime
  ├─ Express.js Server
  ├─ SQLite3 Datenbank
  ├─ bcryptjs (Passwort-Hashing)
  └─ Express-Sessions (Auth)

API (REST):
  └─ Alle Endpoints erreichbar unter http://localhost:3000/api

DATENBANK:
  └─ database.sqlite (wird automatisch erstellt)
  └─ Keine externe DB nötig!
  └─ Alles lokal auf deinem Rechner

════════════════════════════════════════════════════════════════════════════

📋 ORDNERSTRUKTUR

kunsttherapie-site/              ← WEBSITE FRONTEND
  ├── index.html                 (Startseite)
  ├── neuigkeiten.html           (News - lädt von API)
  ├── events.html                (Events - lädt von API)
  ├── angebote.html
  ├── ueber-mich.html
  ├── kontakt.html
  ├── assets/
  │   ├── css/style.css          (Künstlerische Farben)
  │   ├── js/main.js
  │   └── img/                   (Deine Bilder)
  └── data/news.json             (Alte JSON - nicht mehr nötig)

kunsttherapie-cms/               ← CMS BACKEND
  ├── server.js                  (Express Server)
  ├── package.json               (Dependencies)
  ├── .env                       (Konfiguration)
  ├── database.sqlite            (Datenbank - wird erstellt)
  ├── SETUP-GUIDE.md             (Dieses Dokument)
  └── public/
      └── admin.html             (Admin-Panel)

════════════════════════════════════════════════════════════════════════════

💡 WIE ALLES ZUSAMMENHÄNGT

1. Du startest den Backend-Server
   $ cd kunsttherapie-cms && npm run dev
   → Backend läuft auf Port 3000

2. Du öffnest das Admin-Panel
   → http://localhost:3000/admin

3. Du fügt News/Events/Services ein
   → Werden in der SQLite-Datenbank gespeichert

4. Die Website lädt automatisch die Daten von der API
   → neuigkeiten.html lädt von /api/news
   → events.html lädt von /api/events

5. Besuchende sehen sofort die Änderungen!

════════════════════════════════════════════════════════════════════════════

🛠️  HÄUFIGE AUFGABEN

NEWS LÖSCHEN
──────────────
Im Admin-Panel → News → "Löschen"-Button

NEWS BEARBEITEN
───────────────
Im Admin-Panel → News → "Bearbeiten"-Button

EVENT ALS ENTWURF SPEICHERN
──────────────────────────
Im Event-Form: "Veröffentlichen" NICHT setzen
→ Wird nicht auf Website angezeigt, bis du es veröffentlichst

BILDER HINZUFÜGEN
─────────────────
1. Laden dein Bild irgendwo hoch (z.B. imgur.com - kostenlos)
2. Kopiere die URL
3. Im Admin-Panel in "Bild URL" einfügen
4. Speichern!

════════════════════════════════════════════════════════════════════════════

⚠️  WICHTIGE HINWEISE

🔒 SICHERHEIT
──────────────
- Standard-Passwort ist admin123
- ÄNDER das Passwort nach dem ersten Login!
- Teile dein Passwort nicht weiter

💾 DATENSICHERUNG
─────────────────
- Deine Daten sind in database.sqlite
- Mache regelmäßig Backups!
- Kopiere die Datei regelmäßig:
  → kunsttherapie-cms/database.sqlite

🌐 ONLINE-DEPLOYMENT
─────────────────────
- Um online zu gehen, musst du:
  1. Einen Server mieten (z.B. Heroku, DigitalOcean)
  2. Backend + Frontend dort hochladen
  3. Domain verbinden
- Das ist später einfach zu machen!

════════════════════════════════════════════════════════════════════════════

❓ HÄUFIGE PROBLEME

"Cannot find module 'express'"
  → npm install

"Database error"
  → Stelle sicher, dass sqlite3 installiert ist
  → npm install sqlite3

"Port 3000 already in use"
  → Ein anderes Programm nutzt Port 3000
  → Änder PORT in .env datei

"Login funktioniert nicht"
  → Überprüf Benutzername (admin) und Passwort (admin123)
  → Starte Server neu

"News/Events zeigen sich nicht auf Website"
  → Stelle sicher, dass Backend läuft
  → Überprüf Browser-Console (F12)
  → Starte beide Services neu

════════════════════════════════════════════════════════════════════════════

🎓 NÄCHSTE SCHRITTE

SOFORT:
  ☐ npm install im kunsttherapie-cms Ordner
  ☐ npm run dev starten
  ☐ http://localhost:3000/admin öffnen
  ☐ Mit admin/admin123 anmelden
  ☐ Erste News/Event hinzufügen

BALD:
  ☐ Passwort ändern
  ☐ Website-Frontend starten
  ☐ News/Events auf Website überprüfen
  ☐ Services hinzufügen

SPÄTER:
  ☐ Domain kaufen (kunsttherapie-pb.de)
  ☐ Online-Server mieten
  ☐ Website + Backend deployen
  ☐ Auf Online-URL zum Leben erwecken

════════════════════════════════════════════════════════════════════════════

📞 KONTAKT & SUPPORT

Wenn etwas nicht funktioniert:

1. Überprüfe die Dokumentation
2. Schau die Fehler in der Browser-Console
3. Überprüf, ob beide Server laufen

════════════════════════════════════════════════════════════════════════════

🎨 DESIGN-FEATURES DER WEBSITE

✨ Künstlerische Farbpalette
  ├─ Gold (#d4a574) aus deinem Briefkopf
  ├─ Blau (#5b8fc4) für Akzente
  └─ Grün (#7fb069) optional

✨ Professionelle Typografie
  ├─ Lora (elegant für Überschriften)
  └─ Poppins (modern für Text)

✨ Responsive Design
  ├─ Desktop-optimiert
  ├─ Tablet-freundlich
  └─ Smartphone-gerecht

✨ Moderne Animationen
  ├─ Hover-Effekte
  ├─ Smooth Transitions
  └─ Staggered Animations

════════════════════════════════════════════════════════════════════════════

🎉 HERZLICHEN GLÜCKWUNSCH!

Du hast jetzt:

✅ Eine professionelle Kunsttherapie-Website
✅ Ein vollständiges CMS zur Verwaltung
✅ Moderne, künstlerische Design
✅ Deine Bilder integriert
✅ News/Events-Management
✅ Authentifizierung & Sicherheit
✅ Echtzeit-Updates

BEREIT ZUM STARTEN! 🚀

════════════════════════════════════════════════════════════════════════════

Status: ✅ WEBSITE + CMS FERTIG
         ✅ BACKEND LÄUFT
         ✅ READY TO USE

Viel Erfolg! 🎨✨

Martina Schwierzke
Kunsttherapie Paderborn

════════════════════════════════════════════════════════════════════════════

Letzter Update: 21.05.2026
Website Version: 2.0 (mit Bildern & Watercolor-Design)
CMS Version: 1.0 (Mit Admin-Panel & API)
Status: Vollständig integriert! 🚀

════════════════════════════════════════════════════════════════════════════
