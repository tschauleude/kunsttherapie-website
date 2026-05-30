# KUNSTTHERAPIE WEBSITE + CMS - HOSTINGER DEPLOYMENT GUIDE

## Ziel

Dieses Repo ist fuer eine direkte Hostinger-Git-Verbindung vorbereitet. Die statische Website liegt im Repo-Root, damit Hostinger sie direkt in den Webroot (`public_html`) deployen kann.

```
Repo-Root / public_html
├── index.html
├── angebote.html
├── ueber-mich.html
├── preise.html
├── kontakt.html
├── neuigkeiten.html
├── events.html
├── impressum.html
├── datenschutz.html
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── img/
├── data/news.json
├── server.js              # optionales Node/Express-CMS
├── package.json
└── public/admin.html      # CMS-Admin unter /admin
```

## Variante A: Hostinger Git-Deployment fuer die Website

1. In Hostinger hPanel die Domain bzw. Website auswaehlen.
2. Git-Deployment aktivieren und dieses Repository verbinden.
3. Branch: `main`.
4. Zielordner/Webroot: `public_html`.
5. Nach dem Deployment pruefen:
   - `https://deine-domain.de/`
   - `https://deine-domain.de/assets/css/style.css`
   - `https://deine-domain.de/neuigkeiten.html`

Wichtig: Es darf kein zusaetzlicher Unterordner wie `kunsttherapie-site/` als Webroot erwartet werden. `index.html` liegt absichtlich direkt im Repo-Root.

## Variante B: Optionales CMS als Node-App

Wenn dein Hostinger-Paket Node.js unterstuetzt:

1. Node.js-App fuer dieses Repo einrichten.
2. Startdatei: `server.js`.
3. Installationsbefehl: `npm install`.
4. Startbefehl: `npm start`.
5. Umgebungsvariablen setzen:

```text
NODE_ENV=production
PORT=3000
SESSION_SECRET=bitte-einen-langen-zufaelligen-wert-setzen
```

Danach sollten erreichbar sein:

- Admin: `https://deine-domain.de/admin`
- API: `https://deine-domain.de/api/news`

Falls die Node-App hinter einem Reverse Proxy laeuft, muss `/api` und `/admin` auf den Node-Prozess zeigen. Ohne Node-App funktioniert die Website weiterhin statisch; `neuigkeiten.html` nutzt dann `data/news.json` als Fallback.

## Hauefige Fehler

### Website laedt ohne Styling oder Bilder

Dann wurden `assets/` bzw. `assets/css/style.css` und `assets/img/` nicht in den Webroot deployt. Der Ordner `assets` muss neben `index.html` liegen.

### News oder Events laden nicht aus dem CMS

- Pruefe, ob die Node-App laeuft.
- Pruefe `https://deine-domain.de/api/news`.
- Wenn nur statisches Hosting aktiv ist, zeigt `neuigkeiten.html` die Eintraege aus `data/news.json`.

### Admin-Panel laedt, aber Login/API geht nicht

Dann zeigt `/admin` auf die statische Datei, aber `/api` nicht auf die Node-App. Hostinger muss die Node-App oder einen Proxy fuer `/api` bereitstellen.

## Minimaler FTP-Upload ohne Git

Wenn du nicht Git nutzt, lade diese Dateien/Ordner in `public_html` hoch:

```text
*.html
assets/
data/
```

Fuer das CMS zusaetzlich:

```text
server.js
package.json
public/admin.html
```
