╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║         🎨 KUNSTTHERAPIE CMS – SETUP & INSTALLATION GUIDE               ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

🎉 GLÜCKWUNSCH!

Du hast jetzt ein vollständiges CMS-Backend für deine Kunsttherapie-Website!

════════════════════════════════════════════════════════════════════════════

📦 WAS BEKOMMST DU?

✅ Node.js/Express Backend Server
✅ SQLite Datenbank (keine externe DB nötig!)
✅ Admin Panel zur Verwaltung von News, Events & Services
✅ Benutzer-Authentifizierung (Login/Logout)
✅ REST API für Website-Integration
✅ Automatische Datenbankinitialisierung

════════════════════════════════════════════════════════════════════════════

🚀 INSTALLATION (5 Schritte)

SCHRITT 1: Node.js installieren
─────────────────────────────────
Wenn nicht vorhanden:
→ https://nodejs.org (LTS Version)

SCHRITT 2: Abhängigkeiten installieren
─────────────────────────────────────
$ cd kunsttherapie-cms
$ npm install

Installiert automatisch:
  ✓ express (Web Framework)
  ✓ sqlite3 (Datenbank)
  ✓ bcryptjs (Passwort-Verschlüsselung)
  ✓ cors (Cross-Origin Requests)
  ✓ express-session (Authentifizierung)
  ✓ nodemon (Auto-Reload in Entwicklung)

SCHRITT 3: Server starten
─────────────────────────
Entwicklung (mit Auto-Reload):
$ npm run dev

oder Produktion:
$ npm start

SCHRITT 4: Admin Panel öffnen
────────────────────────────
→ http://localhost:3000/admin

SCHRITT 5: Anmelden
──────────────────
Login:
  Benutzername: admin
  Passwort: admin123

⚠️ WICHTIG: Nach dem ersten Login das Passwort ändern!

════════════════════════════════════════════════════════════════════════════

🎨 ADMIN PANEL ÜBERSICHT

Das Admin-Panel hat folgende Sections:

1️⃣  DASHBOARD
    └─ Schneller Überblick über News, Events, Services
    └─ Statistiken und Übersicht

2️⃣  NEWS & UPDATES
    └─ Neue Neuigkeiten erstellen/bearbeiten
    └─ News veröffentlichen oder als Entwurf speichern
    └─ News löschen
    └─ Automatische Verwaltung auf Website

3️⃣  EVENTS & TERMINE
    └─ Neue Events hinzufügen
    └─ Datum, Uhrzeit, Ort, Kapazität
    └─ Event-Bilder hochladen (URL)
    └─ Events veröffentlichen/Entwurf

4️⃣  SERVICES & ANGEBOTE
    └─ Angebote verwalten (Auszeit, Gruppen, Teambuilding)
    └─ Preise und Dauer definieren
    └─ Service-Bilder
    └─ Aktivieren/Deaktivieren

════════════════════════════════════════════════════════════════════════════

🗄️  DATENBANK

SQLite (automatisch erstellt):
  database.sqlite (im kunsttherapie-cms Ordner)

Tabellen:
  ✓ admins (Benutzerkonten)
  ✓ news (Neuigkeiten)
  ✓ events (Events)
  ✓ services (Angebote)

Keine externe Datenbank nötig!
Alles läuft lokal auf deinem Server.

════════════════════════════════════════════════════════════════════════════

🔐 SICHERHEIT

Standard-Login:
  ✓ Benutzername: admin
  ✓ Passwort: admin123

NACH DEM ERSTEN LOGIN:
  1. Admin Panel öffnen
  2. In den Admin-Einstellungen (später hinzufügen)
  3. Passwort ändern
  4. Neue Benutzer hinzufügen (optional)

Passwörter sind verschlüsselt (bcryptjs)
Sessions sind HTTP-only für Sicherheit

════════════════════════════════════════════════════════════════════════════

📡 API ENDPOINTS

Alle API-Endpoints für externe Integration:

AUTHENTIFIZIERUNG:
  POST   /api/auth/login          Login
  POST   /api/auth/logout         Logout
  GET    /api/auth/status         Check Auth Status

NEWS (Public):
  GET    /api/news                Alle veröffentlichten News
  GET    /api/news/:id            Einzelne News

NEWS (Admin - Authentifizierung nötig):
  GET    /api/admin/news          Alle News (inkl. Entwürfe)
  POST   /api/admin/news          Neue News erstellen
  PUT    /api/admin/news/:id      News bearbeiten
  DELETE /api/admin/news/:id      News löschen

EVENTS (Public):
  GET    /api/events              Alle veröffentlichten Events
  GET    /api/events/:id          Einzelner Event

EVENTS (Admin):
  GET    /api/admin/events        Alle Events
  POST   /api/admin/events        Neuer Event
  PUT    /api/admin/events/:id    Event bearbeiten
  DELETE /api/admin/events/:id    Event löschen

SERVICES (Public):
  GET    /api/services            Alle aktiven Services

SERVICES (Admin):
  GET    /api/admin/services      Alle Services
  POST   /api/admin/services      Neuer Service
  PUT    /api/admin/services/:id  Service bearbeiten
  DELETE /api/admin/services/:id  Service löschen

════════════════════════════════════════════════════════════════════════════

🔌 INTEGRATION MIT WEBSITE

Die Website-Frontend kann die API nutzen:

Beispiel: News auf Website laden
────────────────────────────────
fetch('http://localhost:3000/api/news')
  .then(r => r.json())
  .then(news => {
    news.forEach(item => {
      console.log(item.title, item.content);
    });
  });

════════════════════════════════════════════════════════════════════════════

📋 FEATURES DES ADMIN-PANELS

✅ Responsive Design (Works on Mobile/Tablet/Desktop)
✅ Intuitive Bedienung
✅ Echtzeit-Änderungen auf der Website
✅ Entwurf-Modus (Entwurf speichern, später veröffentlichen)
✅ Bildbehandlung (URL-basiert)
✅ Fehlermeldungen & Bestätigungen
✅ Dashboard-Übersicht

════════════════════════════════════════════════════════════════════════════

🛠️  TECHNISCHE DETAILS

Stack:
  Backend:    Node.js + Express.js
  Datenbank:  SQLite3
  Frontend:   HTML5 + CSS3 + Vanilla JavaScript
  Auth:       Session-basiert
  Verschlüsselung: bcryptjs

Dateistruktur:
  kunsttherapie-cms/
  ├── server.js              (Express Server)
  ├── package.json           (Dependencies)
  ├── .env                   (Umgebungsvariablen)
  ├── database.sqlite        (Wird automatisch erstellt)
  └── public/
      └── admin.html         (Admin Panel)

════════════════════════════════════════════════════════════════════════════

📱 MOBILE-FREUNDLICH

Das Admin-Panel funktioniert auf:
  ✓ Desktop-Browsern
  ✓ Tablets
  ✓ Smartphones

Optimiert für Touch-Bedienung!

════════════════════════════════════════════════════════════════════════════

🚢 DEPLOYMENT (Production)

Wenn du die Website online bringen möchtest:

Option 1: Heroku
  1. Heroku-Account erstellen
  2. "heroku create"
  3. "git push heroku main"

Option 2: Eigener Server (z.B. DigitalOcean)
  1. Node.js auf Server installieren
  2. Code hochladen
  3. PM2 für Prozess-Management starten
  4. Nginx als Reverse Proxy konfigurieren

Option 3: Hostinger/STRATO
  1. Node.js-Unterstützung prüfen
  2. Backend-Dateien uploaden
  3. npm install durchführen
  4. Server starten

════════════════════════════════════════════════════════════════════════════

❌ FEHLERBEHANDLUNG

Wenn etwas nicht funktioniert:

"Cannot find module 'express'"
  → npm install

"Database connection error"
  → Stelle sicher, dass sqlite3 installiert ist
  → npm install sqlite3

"Port 3000 already in use"
  → Änder PORT in .env Datei
  → Oder: lsof -ti:3000 | xargs kill -9

"Login fehlgeschlagen"
  → Überprüf Benutzername/Passwort (admin/admin123)
  → Starte Server neu

════════════════════════════════════════════════════════════════════════════

📞 SUPPORT

Häufige Fragen:

F: Kann ich mehrere Benutzer hinzufügen?
A: Ja, über erweiterte Funktionen (später implementierbar)

F: Kann ich Bilder hochladen?
A: Ja, über URL. Direktes Upload kommt später.

F: Wie sichern ich die Daten?
A: Kopiere die database.sqlite Datei regelmäßig.

F: Kann ich CORS deaktivieren?
A: Ja, in server.js die CORS-Zeile ändern.

════════════════════════════════════════════════════════════════════════════

🎯 NÄCHSTE SCHRITTE

1. ✅ Backend installieren & starten
   $ cd kunsttherapie-cms
   $ npm install
   $ npm run dev

2. ✅ Admin Panel öffnen
   http://localhost:3000/admin

3. ✅ Anmelden
   Username: admin
   Password: admin123

4. ✅ News/Events/Services hinzufügen

5. ✅ Website-Frontend mit API verbinden

6. ✅ Passwort ändern (WICHTIG!)

════════════════════════════════════════════════════════════════════════════

Status: ✅ CMS BACKEND FERTIG
         ✅ ADMIN PANEL READY
         ✅ DATENBANK VORBEREITET

Du kannst sofort starten! 🚀

════════════════════════════════════════════════════════════════════════════

Viel Erfolg! 🎨✨

Martina Schwierzke
Kunsttherapie Paderborn

════════════════════════════════════════════════════════════════════════════
