# KUNSTTHERAPIE WEBSITE + CMS - QUICK START

## Wichtig: Struktur fuer Hostinger

Dieses Repository ist so aufgebaut, dass Hostinger es direkt aus Git in `public_html` ziehen kann:

```
index.html            # Startseite direkt im Repo-Root
assets/css/style.css  # Styling
assets/js/main.js     # Interaktion / Canvas
assets/img/           # Website-Bilder und Logo
data/news.json        # Statischer News-Fallback
server.js             # Optionales Node/Express-CMS
public/admin.html     # Admin-Panel fuer das CMS
```

Wenn Hostinger dieses Repo direkt verbindet, muss als Zielordner `public_html` bzw. der Webroot der Domain genutzt werden. Es gibt keinen zusaetzlichen Unterordner `kunsttherapie-site/` mehr.

---

## Website lokal ansehen

```bash
python3 -m http.server 8080
```

Dann im Browser oeffnen:

```text
http://localhost:8080
```

---

## CMS lokal starten

```bash
npm install
npm run dev
```

Dann im Browser oeffnen:

```text
http://localhost:3000/admin
```

Login:

- Benutzername: `admin`
- Passwort: `admin123`

Wichtig: Das Passwort nach dem ersten produktiven Login aendern.

---

## Online-Pfade

- Website: `https://deine-domain.de/`
- News: `https://deine-domain.de/neuigkeiten.html`
- Events: `https://deine-domain.de/events.html`
- CMS/Admin, wenn Node-App aktiv ist: `https://deine-domain.de/admin`
- API, wenn Node-App aktiv ist: `https://deine-domain.de/api`
