# Kunsttherapie Paderborn - Website + CMS

Praesentationsfaehige Website fuer die Kunsttherapie-Praxis von Martina Schwierzke in Paderborn. Das Projekt enthaelt eine moderne statische Website und ein kleines Express/SQLite-CMS fuer Neuigkeiten, Termine und Angebote.

## Aktueller Stand

- `kunsttherapie-site/` - Frontend mit elegantem Watercolor-/Atelier-Design
- `kunsttherapie-cms/` - Backend mit Admin-Panel, SQLite, Sessions und REST API
- `START-HEUTE.md` - schnellster Ablauf fuer eine lokale Praesentation

## Schnellstart

Backend starten:

```bash
cd kunsttherapie-cms
npm install
cp .env.example .env
npm run dev
```

Admin-Panel: <http://localhost:3000/admin>

Website starten:

```bash
cd kunsttherapie-site
python3 -m http.server 8080
```

Website: <http://localhost:8080>

## Design

Die aktuelle Version nutzt eine helle, hochwertige Gestaltung:

- warmer Papierhintergrund statt eines dunklen Tech-Looks
- Gold, Aquarell-Blau, Naturgruen und Rosé als Akzentfarben
- grosszuegige Karten, weiche Schatten und organische Farbformen
- interaktives Mini-Atelier auf der Startseite
- responsive Navigation und mobile-ready Layouts
- keine externen Formularanbieter und keine Analytics

## CMS-Funktionen

Public API:

- `GET /api/health`
- `GET /api/news`
- `GET /api/events`
- `GET /api/services`

Admin API und Admin-Panel:

- Login mit Session-Cookie
- News erstellen, bearbeiten, loeschen
- Termine erstellen, bearbeiten, loeschen
- Angebote erstellen, bearbeiten, loeschen
- Passwort direkt im Admin-Bereich aktualisieren
- oeffentliche API zeigt nur veroeffentlichte bzw. aktive Eintraege

## Konfiguration

Backend: `kunsttherapie-cms/.env`

```env
NODE_ENV=development
PORT=3000
SESSION_SECRET=please-change-this-secret
DATABASE_PATH=./database.sqlite
CORS_ORIGIN=http://localhost:8080,http://127.0.0.1:8080
ADMIN_PASSWORD=admin123
```

Frontend: `kunsttherapie-site/assets/js/config.js`

```js
window.KUNSTTHERAPIE_CONFIG = {
  apiBase: "http://localhost:3000/api"
};
```

## Praesentationscheck

- Backend zeigt `Server running on http://localhost:3000`
- `http://localhost:3000/api/health` liefert `status: ok`
- Website laedt unter `http://localhost:8080`
- Startseite: Mini-Atelier funktioniert
- Neuigkeiten und Termine zeigen CMS-Inhalte oder elegante Fallback-Inhalte
- Kontaktformular oeffnet eine vorbereitete E-Mail
- Mobile Navigation funktioniert

## Vor Produktion

- Admin-Passwort ersetzen
- starken `SESSION_SECRET` setzen
- `CORS_ORIGIN` auf echte Domain setzen
- Rechtstexte final pruefen lassen
- echte Bilder/Logo einsetzen und komprimieren
- optional Reverse Proxy fuer `/api` konfigurieren
