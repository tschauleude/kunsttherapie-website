# 🚀 KUNSTTHERAPIE WEBSITE + CMS – HOSTINGER DEPLOYMENT GUIDE

## Schritt-für-Schritt Anleitung für mkmpb.de auf Hostinger

---

## 📋 VORAUSSETZUNGEN

✅ Hostinger Account (du hast bereits einen!)
✅ Zugriff auf hPanel (Hostinger Control Panel)
✅ FTP/SFTP Zugriff
✅ Node.js Support auf deinem Plan (überprüfen!)
✅ SSH Zugriff (oft optional)

---

## 🎯 ÜBERSICHT: WAS WIR MACHEN

```
LOKAL (dein Computer)
  ├─ kunsttherapie-site/ (Website)
  └─ kunsttherapie-cms/ (Backend)
           ↓ (Upload via FTP/SFTP)
HOSTINGER SERVER
  ├─ public_html/kunsttherapie-site/ (Website - Port 80/443)
  └─ /home/mkmpb-cms/ (Backend - Port 3000)
           ↓ (npm start)
ONLINE
  ├─ https://mkmpb.de/kunsttherapie (Website)
  └─ https://mkmpb.de:3000 (CMS Backend)
```

---

## SCHRITT 1: HOSTINGER VORBEREITUNG

### 1.1 Node.js Support überprüfen

1. Login zu hPanel: https://hpanel.hostinger.com
2. Wähle deine Domain/Hosting
3. Gehe zu: **Advanced** → **SSH Access** oder **Node.js**
4. Überprüfe ob Node.js verfügbar ist
   - Wenn NICHT: Kontaktiere Support oder upgrade Plan

### 1.2 SSH Zugriff aktivieren

1. In hPanel: **Security** → **SSH Keys**
2. Generiere neuen SSH Key (wenn nicht vorhanden)
3. Merke dir: SSH Host, Username, Port

### 1.3 FTP/SFTP Zugriff

1. In hPanel: **Advanced** → **FTP Accounts**
2. FTP-Daten:
   - Hostname: `ftp.mkmpb.de` oder in hPanel angezeigt
   - Username: Dein FTP-User (meist `mkmpb`)
   - Password: Dein FTP-Passwort
   - Port: 21 (FTP) oder 22 (SFTP)

---

## SCHRITT 2: WEBSITE HOCHLADEN (HTML/CSS/JS)

### 2.1 FTP Client installieren

Empfohlene Programme:
- **FileZilla** (kostenlos) - Windows/Mac/Linux
- **Cyberduck** (kostenlos) - Mac/Windows
- **WinSCP** (kostenlos) - Windows

### 2.2 Verbindung in FileZilla

1. **File** → **Site Manager** → **New Site**
2. Einstellungen:
   ```
   Host: ftp.mkmpb.de (oder deine Hostinger FTP)
   Port: 21
   Protocol: FTP
   Encryption: Use explicit FTP over TLS if available
   User: mkmpb (oder dein FTP-User)
   Password: [Dein FTP-Passwort]
   ```
3. **Connect**

### 2.3 Website hochladen

1. Lokal: Öffne `kunsttherapie-site/` Ordner
2. Remote: Navigiere zu `/public_html/`
3. **Erstelle Ordner**: `kunsttherapie`
   ```
   /public_html/kunsttherapie/
   ```
4. Lade ALLE Dateien von `kunsttherapie-site/` hoch:
   ```
   /public_html/kunsttherapie/
   ├── index.html
   ├── neuigkeiten.html
   ├── events.html
   ├── angebote.html
   ├── ueber-mich.html
   ├── preise.html
   ├── kontakt.html
   ├── assets/
   │   ├── css/style.css
   │   ├── js/main.js
   │   └── img/
   ```

### 2.4 Überprüfung

Öffne Browser: `https://mkmpb.de/kunsttherapie`

Du solltest deine Website sehen! ✅

---

## SCHRITT 3: BACKEND HOCHLADEN (Node.js)

### 3.1 SSH Verbindung

Öffne Terminal und verbinde mit SSH:

```bash
ssh mkmpb@mkmpb.de -p 22
# oder: ssh mkmpb@[deine-hostinger-ip]
```

(Oder über hPanel: **Advanced** → **Terminal** wenn vorhanden)

### 3.2 Backend-Ordner vorbereiten

Über SSH:

```bash
# Verbindung
ssh mkmpb@mkmpb.de

# In Home-Verzeichnis gehen
cd ~

# Ordner für CMS erstellen
mkdir -p kunsttherapie-cms

# Rein gehen
cd kunsttherapie-cms
```

### 3.3 Backend-Dateien hochladen

Option A: Via FTP hochladen
1. In FileZilla: Navigiere zu `/home/mkmpb/kunsttherapie-cms/`
2. Lade alle Dateien aus `kunsttherapie-cms/` hoch:
   ```
   server.js
   package.json
   .env
   public/admin.html
   ```

Option B: Direkt per SSH (wenn git vorhanden)
```bash
git clone [dein-repo] kunsttherapie-cms
cd kunsttherapie-cms
```

### 3.4 Dependencies installieren

Über SSH:

```bash
cd ~/kunsttherapie-cms

# Node-Version überprüfen
node --version
npm --version

# Dependencies installieren
npm install
```

Überprüfe Erfolg:
```bash
ls -la node_modules/
# Sollte Ordner enthalten!
```

---

## SCHRITT 4: UMGEBUNGSVARIABLEN KONFIGURIEREN

### 4.1 .env Datei anpassen

Über SSH:

```bash
cd ~/kunsttherapie-cms

# .env bearbeiten
nano .env
```

Inhalte:
```
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-super-secret-key-change-this-12345

DATABASE_PATH=./database.sqlite

CORS_ORIGIN=https://mkmpb.de

MAX_FILE_SIZE=52428800
UPLOAD_DIR=./public/uploads
```

Speichern:
- `Ctrl+X`
- `Y` (Yes)
- `Enter`

### 4.2 Database-Pfad anpassen (Optional)

Wenn du die Datenbank in einem anderen Ordner haben möchtest:

```bash
mkdir -p ~/kunsttherapie-cms/data

# In .env:
DATABASE_PATH=/home/mkmpb/kunsttherapie-cms/data/database.sqlite
```

---

## SCHRITT 5: BACKEND STARTEN

### 5.1 Direkter Start (zum Testen)

```bash
cd ~/kunsttherapie-cms
npm start
```

Du solltest sehen:
```
🎨 Kunsttherapie CMS Backend
Server running on http://localhost:3000
Admin Panel: http://localhost:3000/admin
```

Drücke `Ctrl+C` zum Beenden.

### 5.2 Mit PM2 starten (Produktiv)

PM2 sorgt dafür, dass dein Server immer läuft!

```bash
# PM2 installieren (global)
npm install -g pm2

# PM2 als Service starten
pm2 start server.js --name "kunsttherapie-cms"

# Startup-Script erzeugen
pm2 startup
pm2 save
```

Überprüfe Status:
```bash
pm2 list
pm2 logs kunsttherapie-cms
```

---

## SCHRITT 6: REVERSE PROXY KONFIGURIEREN

### 6.1 Warum Reverse Proxy?

- Backend läuft auf Port 3000
- Öffentlich nur Port 80 (HTTP) und 443 (HTTPS) verfügbar
- Reverse Proxy leitet Anfragen weiter

### 6.2 Nginx Konfiguration

Überprüfe ob Nginx installiert:
```bash
which nginx
```

Falls NICHT installiert (selten auf Hostinger):
```bash
# Frag den Support oder nutze Apache
```

Falls JA, bearbeite Nginx-Config:

```bash
# SSH mit Root/Sudo
sudo nano /etc/nginx/sites-available/default
# oder
sudo nano /etc/nginx/conf.d/kunsttherapie.conf
```

Füge hinzu (für Port 3000):
```nginx
server {
    listen 3000 ssl;
    server_name mkmpb.de;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Nginx neustarten:
```bash
sudo systemctl restart nginx
```

### 6.3 Alternative: Apache (wenn Nginx nicht vorhanden)

Hostinger benutzt oft Apache. Dann:

```bash
# In /home/mkmpb/public_html/ (oder Hostinger-Verzeichnis)
# Erstelle .htaccess für Proxy:

cat > .htaccess << 'APACHE'
RewriteEngine On
RewriteRule ^api(.*)$ http://localhost:3000/api$1 [P,L]
RewriteRule ^admin(.*)$ http://localhost:3000/admin$1 [P,L]
APACHE
```

---

## SCHRITT 7: WEBSITE MIT BACKEND VERBINDEN

### 7.1 API URL in Website anpassen

In `neuigkeiten.html`:

```javascript
// LOKAL:
const API_URL = 'http://localhost:3000/api';

// ONLINE (Hostinger):
const API_URL = 'https://mkmpb.de:3000/api';
// oder wenn Proxy konfiguriert:
const API_URL = 'https://mkmpb.de/api';
```

### 7.2 Datei hochladen

FTP:
1. Öffne `kunsttherapie-site/neuigkeiten.html` lokal
2. Bearbeite API_URL
3. Speichern
4. Hochladen zu `/public_html/kunsttherapie/neuigkeiten.html`

Wiederhole für:
- `events.html`
- Alle `.js` Dateien die API nutzen

---

## SCHRITT 8: HTTPS/SSL KONFIGURIEREN

### 8.1 kostenloses SSL Zertifikat (Let's Encrypt)

Hostinger hat meist vorinstalliert. Überprüfe:

1. hPanel → **Advanced** → **SSL Certificate**
2. Sollte grüner Haken sein ✅
3. Falls nicht: Klick auf "Activate Let's Encrypt"

### 8.2 Force HTTPS

In `.htaccess` (if Apache):
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

In Nginx:
```nginx
server {
    listen 80;
    server_name mkmpb.de www.mkmpb.de;
    return 301 https://$server_name$request_uri;
}
```

---

## SCHRITT 9: DATENBANK BACKUP

### 9.1 Automatisches Backup

SSH:
```bash
# Backup-Skript erstellen
cat > ~/kunsttherapie-cms/backup.sh << 'BASH'
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
cp ~/kunsttherapie-cms/database.sqlite ~/backups/database_$DATE.sqlite
echo "Backup erstellt: database_$DATE.sqlite"
BASH

chmod +x ~/kunsttherapie-cms/backup.sh

# Cron Job (täglich um 3 Uhr)
crontab -e
# Füge hinzu:
0 3 * * * ~/kunsttherapie-cms/backup.sh
```

### 9.2 Manuelles Backup

Via FTP:
1. Lade `database.sqlite` herunter
2. Speichere lokal in Backup-Ordner
3. Macht regelmäßig (z.B. wöchentlich)

---

## SCHRITT 10: FINAL CHECKS

### ✅ Website überprüfen

```
https://mkmpb.de/kunsttherapie
https://mkmpb.de/kunsttherapie/index.html
https://mkmpb.de/kunsttherapie/neuigkeiten.html
https://mkmpb.de/kunsttherapie/events.html
```

Alle sollten laden! ✅

### ✅ Admin-Panel überprüfen

```
https://mkmpb.de:3000/admin
oder
https://mkmpb.de/admin
```

Login mit: admin / admin123

### ✅ News laden

1. Öffne Neuigkeiten-Seite
2. Sollte von API laden
3. Keine Fehler in Browser-Konsole (F12)

---

## 🚨 HÄUFIGE FEHLER

### "Connection refused" auf Port 3000

**Problem:** Backend läuft nicht

**Lösung:**
```bash
# SSH
cd ~/kunsttherapie-cms
pm2 status
pm2 logs kunsttherapie-cms
```

### "Cannot GET /api/news"

**Problem:** API antwortet nicht

**Lösung:**
1. SSH: `curl http://localhost:3000/api/news`
2. Sollte JSON zurückgeben
3. Überprüfe .env
4. Neu starten: `pm2 restart kunsttherapie-cms`

### "npm: command not found"

**Problem:** Node.js nicht installiert

**Lösung:**
1. Kontaktiere Hostinger Support
2. Frage nach Node.js Aktivierung
3. Eventuell Plan upgraden

### "403 Forbidden"

**Problem:** Dateirechte falsch

**Lösung:**
```bash
# SSH
cd ~/kunsttherapie-cms
chmod 755 public/
chmod 755 public/admin.html
chmod 600 .env
chmod 755 database.sqlite
```

### Website lädt, aber nicht vom CMS

**Problem:** API_URL falsch

**Lösung:**
1. Öffne neuigkeiten.html lokal
2. Ändere API_URL zu: `https://mkmpb.de:3000/api`
3. Speichern & hochladen
4. Browser-Cache leeren (Ctrl+Shift+Del)

---

## 📊 MONITORING & LOGS

### SSH Logs ansehen

```bash
# PM2 Logs
pm2 logs kunsttherapie-cms

# Nginx Logs (wenn Nginx)
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Syslog
tail -f /var/log/syslog | grep node
```

### Speichernutzung

```bash
# RAM Check
free -h

# Disk Check
df -h

# Process Check
ps aux | grep node
```

---

## 🔧 WEITERE OPTIMIERUNGEN

### 1. Environment variabl für Production

```bash
# .env
NODE_ENV=production
```

### 2. Gzip Kompression (Nginx)

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### 3. Caching für Static Files

```nginx
location /kunsttherapie/assets/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 4. API Rate Limiting (in server.js)

```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);
```

---

## 📞 HOSTINGER SUPPORT KONTAKTIEREN

Falls Probleme:

1. **hPanel Support Chat** (oben rechts)
2. **Email:** support@hostinger.com
3. **Ticketsystem:** In hPanel

Fragen zu stellen:
- "Kann ich Node.js auf meinem Plan nutzen?"
- "Wie aktiviere ich SSH?"
- "Unterstützt ihr PM2?"

---

## 🎯 CHECKLISTE: DEPLOYMENT

- ☐ SSH Zugriff aktiviert
- ☐ FTP Verbindung getestet
- ☐ Website hochgeladen (`/public_html/kunsttherapie/`)
- ☐ Backend hochgeladen (`~/kunsttherapie-cms/`)
- ☐ npm install durchgeführt
- ☐ .env konfiguriert
- ☐ PM2 installiert & gestartet
- ☐ Reverse Proxy konfiguriert
- ☐ API URL in Website angepasst
- ☐ SSL/HTTPS aktiviert
- ☐ Website über HTTPS erreichbar
- ☐ Admin-Panel erreichbar
- ☐ News/Events laden korrekt
- ☐ Backup-Strategie eingerichtet

---

## 📱 FINAL URLS

Nach Deployment:

```
Website:     https://mkmpb.de/kunsttherapie
Startseite:  https://mkmpb.de/kunsttherapie/index.html
News:        https://mkmpb.de/kunsttherapie/neuigkeiten.html
Events:      https://mkmpb.de/kunsttherapie/events.html
Admin-Panel: https://mkmpb.de:3000/admin
API:         https://mkmpb.de:3000/api
```

---

## 🎉 GLÜCKWUNSCH!

Deine Kunsttherapie-Website läuft jetzt online! 🚀

Viel Erfolg!

---

## 📚 WEITERE RESSOURCEN

- Hostinger Docs: https://support.hostinger.com
- Node.js Docs: https://nodejs.org/docs
- Nginx Docs: https://nginx.org/en/docs/
- PM2 Docs: https://pm2.keymetrics.io

