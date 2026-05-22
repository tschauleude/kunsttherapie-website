# GitHub Preview

Die komplette Website liegt in:

```text
kunsttherapie-site/
```

Alle statischen Assets sind mit im Repository:

```text
kunsttherapie-site/assets/css/style.css
kunsttherapie-site/assets/js/main.js
kunsttherapie-site/assets/js/config.js
kunsttherapie-site/assets/js/api.js
kunsttherapie-site/favicon.svg
kunsttherapie-site/site.webmanifest
kunsttherapie-site/robots.txt
kunsttherapie-site/sitemap.xml
```

## Direkt im Repository

Wenn GitHub Pages auf den Repository-Root zeigt, leitet `index.html` automatisch weiter zu:

```text
kunsttherapie-site/index.html
```

## GitHub Pages

Es gibt zusätzlich einen Workflow:

```text
.github/workflows/pages.yml
```

Der Workflow veröffentlicht nur den Inhalt von `kunsttherapie-site/`, damit die Website später direkt unter der GitHub-Pages-URL läuft und alle Asset-Pfade stimmen.

Wichtig: Das CMS/Admin-Login läuft nicht auf GitHub Pages, weil GitHub Pages kein Node.js/SQLite-Backend startet. Die öffentliche Website zeigt für News/Termine dann vorbereitete Inhalte bzw. Fallback-Daten.

## Lokale Preview

```bash
cd kunsttherapie-site
python3 -m http.server 8080
```

Dann öffnen:

```text
http://localhost:8080
```
