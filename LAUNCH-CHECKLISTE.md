# Launch-Checkliste - Kunsttherapie Website + CMS

Diese Checkliste gilt fuer die aktuelle Version mit `kunsttherapie-site/` und `kunsttherapie-cms/`.

## 1. Lokal starten

Backend:

```bash
cd kunsttherapie-cms
npm install
cp .env.example .env
npm run dev
```

Website:

```bash
cd kunsttherapie-site
python3 -m http.server 8080
```

Pruefen:

- [ ] Website: http://localhost:8080
- [ ] Admin: http://localhost:3000/admin
- [ ] Health: http://localhost:3000/api/health

## 2. Inhalte fuer die Praesentation

Im Admin-Panel pflegen, nicht mehr in alten JSON-Dateien:

- [ ] 2 News veroeffentlicht
- [ ] 1-2 Termine veroeffentlicht
- [ ] Angebote aktiv und korrekt sortiert
- [ ] Preise final oder bewusst "auf Anfrage"
- [ ] Kontaktdaten korrekt

## 3. Design-Check

- [ ] Startseite wirkt auf Desktop hochwertig und ruhig
- [ ] Mobile Navigation funktioniert
- [ ] Mini-Atelier reagiert auf Maus/Touch
- [ ] Neuigkeiten und Termine zeigen Inhalte
- [ ] Kontaktformular oeffnet eine vorbereitete E-Mail
- [ ] Impressum und Datenschutz sind erreichbar

## 4. Backend-Check

- [ ] Admin-Login funktioniert
- [ ] Passwort im Admin-Panel aktualisierbar
- [ ] News/Termin anlegen und auf Website nach Refresh sichtbar
- [ ] Entwurf/Draft erscheint nicht oeffentlich
- [ ] `CORS_ORIGIN` passt zur Website-URL
- [ ] `SESSION_SECRET` vor Produktion geaendert

## 5. Vor oeffentlicher Veroeffentlichung

- [ ] Standard-Passwort ersetzen
- [ ] echte Domain in `sitemap.xml`, `robots.txt`, `CORS_ORIGIN` und Frontend-Config pruefen
- [ ] Rechtstexte final pruefen lassen
- [ ] echte Fotos/Logo einsetzen und komprimieren
- [ ] Backend dauerhaft hosten und Reverse Proxy fuer `/api` einrichten

## Demo-Skript

1. Startseite zeigen: Stimmung, Angebote, Mini-Atelier.
2. Neuigkeiten/Termine zeigen: Inhalte aus CMS.
3. Admin oeffnen, neue News anlegen.
4. Public-Seite refreshen und neuen Eintrag zeigen.
5. Kontaktseite zeigen: Telefon, E-Mail, vorbereitete Nachricht.
