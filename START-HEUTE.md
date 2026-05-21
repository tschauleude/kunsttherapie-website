# Kunsttherapie Website + CMS - Praesentationsstart

Diese Version enthaelt wieder lauffaehige Projektordner:

- `kunsttherapie-site/` - moderne statische Website mit Watercolor-/Atelier-Design
- `kunsttherapie-cms/` - Express/SQLite Backend mit Admin-Panel

## Schnell starten

Terminal 1 - Backend:

```bash
cd kunsttherapie-cms
npm install
cp .env.example .env
npm run dev
```

Admin: <http://localhost:3000/admin>

- Benutzername: `admin`
- Passwort: `admin123`

Terminal 2 - Website:

```bash
cd kunsttherapie-site
python3 -m http.server 8080
```

Website: <http://localhost:8080>

## Was fuer die heutige Praesentation verbessert wurde

- Komplett neues, helles und edles Kunsttherapie-Design mit warmem Papierhintergrund, Gold-/Blau-/Gruen-Akzenten und Aquarell-Optik.
- Die Haltung "Hier ist jeder willkommen" ist sichtbar in Startseite, Angeboten, Kontakt und Demo-Inhalten verankert.
- Responsive Seiten fuer Start, Angebote, Ueber mich, Preise, Neuigkeiten, Termine, Kontakt, Impressum und Datenschutz.
- Interaktives Mini-Atelier auf der Startseite.
- News, Termine und Angebote laden aus dem CMS; wenn das Backend nicht laeuft, erscheinen saubere Demo-Daten statt leerer Bereiche.
- Kontaktformular erstellt eine vorbereitete E-Mail, damit in der Demo kein deaktivierter Button sichtbar ist.
- Backend mit Seed-Daten, Health-Check, Login-Rate-Limit, Passwortwechsel, CRUD-Endpunkten und Admin-Oberflaeche.
- CORS ist fuer lokale Website-Ports vorkonfiguriert.

## Demo-Checkliste

- [ ] Backend zeigt `Server running on http://localhost:3000`
- [ ] `http://localhost:3000/api/health` liefert `status: ok`
- [ ] Admin-Login funktioniert
- [ ] Website laedt unter `http://localhost:8080`
- [ ] Startseite: Mini-Atelier funktioniert
- [ ] Neuigkeiten/Termine zeigen entweder CMS- oder Demo-Daten
- [ ] Kontaktformular oeffnet eine vorbereitete E-Mail
- [ ] Mobile Navigation testen

## Wichtige Hinweise vor oeffentlichem Einsatz

- Standard-Passwort `admin123` im Admin-Panel direkt nach dem Login ersetzen.
- In Produktion `SESSION_SECRET` und `CORS_ORIGIN` in `.env` setzen.
- Rechtstexte final pruefen lassen.
- Echte Praxis-/Atelierbilder koennen die CSS-Kunstflaechen spaeter ersetzen.
