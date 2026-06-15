# Website Kunsttherapie Paderborn – Feature-Übersicht

**Stand:** für Gespräch mit Martina Schwierzke  
**Live-URL:** https://www.kunsttherapie-pb.de/  
**Technik:** Node.js (Express), SQLite, statische Seiten + Admin-Panel

---

## Öffentliche Website (Besucherinnen & Besucher)

### Seiten
| Seite | URL | Inhalt |
|--------|-----|--------|
| Startseite | `/` | Hero, Zielgruppen, zwei Hauptzeiten (Di/Do), Vertrauen, Galerie, Praxis-Teaser, Neuigkeiten |
| Kunsttherapie | `/kunsttherapie` | Angebote (4 Karten), Wirkung, Praxis mit Karte |
| Über mich | `/ueber-mich` | Qualifikationen, Ansatz, Porträt |
| Termin buchen | `/buchung` | Kalender Di morgens / Do abends, Anfrage-Formular |
| Kontakt | `/kontakt` | Formular, Karte (mit Einwilligung) |
| Preise | `/preise` | Preistabelle (mobil als Karten) |
| Neuigkeiten | `/neuigkeiten` | Aktuelles aus CMS |
| Veranstaltungen | `/events` | Events aus CMS |
| Mini-Atelier | `/atelier` | Malen/Kollage im Browser, optional absenden |
| Impressum / Datenschutz | `/impressum`, `/datenschutz` | Rechtliches |

### Design & UX
- Responsives Layout (Handy, Tablet, Desktop)
- Farbpartikel-/Aquarell-Design, ruhige Karten
- Scroll-Animationen (deaktivierbar)
- „Nach oben“-Button
- Bildergalerie mit Lightbox
- Barrierefreiheits-Panel (Schriftgröße, Kontrast, Unterstreichung Links, weniger Bewegung)
- Cookie-Einwilligung (DSGVO, Google Maps erst nach Zustimmung)

### Sprachen
- **Deutsch** und **Englisch** (Umschalter DE | EN in der Kopfzeile)
- Startseite, Kunsttherapie-Angebote, Mini-Atelier, Navigation/Footer (weitere Seiten nach Bedarf erweiterbar)

### Buchung
- Öffentlicher Kalender nur **Dienstag morgens** und **Donnerstag abends**
- Freie/belegte Tage farblich
- Anfrage mit Status **„ausstehend“** (keine Auto-Bestätigung)
- E-Mail an Martina + Bestätigung an Klientin/Klient erst nach Admin-Freigabe
- Optional: Google-Kalender-Eintrag nach Bestätigung (Admin)

### Mini-Atelier (eigene Seite `/atelier`)
- Canvas: Pinsel, Linien, Formen, Kollage (Bild-Upload)
- Entwurf lokal speichern/laden
- Werk anonym oder mit Name/E-Mail an Martina senden
- Admin-Bereich „Mini-Atelier“ zum Einsichtnehmen/Löschen

### SEO (Suchmaschinen)
- Meta-Titel & Beschreibungen pro Seite
- Canonical-URLs, Open Graph (Social Sharing)
- `robots.txt`, `sitemap.xml`
- Strukturierte Daten (Schema.org: Praxis, Adresse, Öffnungszeiten)

---

## Admin-Bereich (`/admin`)

| Bereich | Funktion |
|---------|----------|
| Login | Geschützter Zugang, Session |
| Neuigkeiten | Anlegen, bearbeiten, löschen |
| Veranstaltungen | Mit Bild-Upload |
| Leistungen | CMS-Daten (falls genutzt) |
| Buchungen | Liste, **bestätigen**, stornieren, löschen |
| Google Kalender | Verbindung für Termin-Sync |
| Mini-Atelier | Eingegangene Werke, Status, Archiv |
| Passwort | Ändern |

---

## Technik & Hosting

- **Deploy:** Branch `main` auf Hostinger, `npm start` → `server.js`
- **Datenbank:** SQLite (`database.sqlite`)
- **E-Mails:** SMTP (Buchungsanfragen, Benachrichtigungen)
- **Uploads:** Bilder für Events, Atelier-Einsendungen

---

## Geplant / nach Freigabe

- Kundenstimmen & Kooperationslogos (Platzhalter auf Startseite vorhanden)
- Weitere englische Texte (Buchung, Kontakt, Über mich – bei Bedarf)
- Eigene Raumfotos & optimiertes Porträt

---

## Wert des bisherigen Setups (Richtwert)

Grober Marktvergleich **Deutschland, 2025/2026** (Freelancer/kleine Agentur, ohne laufende Marketing-Betreuung):

| Leistung | Typischer Aufwand | Richtwert |
|----------|-------------------|-----------|
| Design & Frontend (mehrseitig, responsive, Custom-UI) | 40–70 h | 3.000–7.000 € |
| Backend + Admin-CMS | 35–55 h | 2.500–5.500 € |
| Buchungssystem + E-Mail-Workflow | 20–35 h | 1.500–3.500 € |
| Mini-Atelier + API | 15–25 h | 1.200–2.500 € |
| Barrierefreiheit, DSGVO, SEO-Grundlage | 10–20 h | 800–2.000 € |
| Deployment, Feinschliff, Content-Runden | 15–30 h | 1.000–2.500 € |

**Summe (realistische Spanne): ca. 9.000 – 18.000 €**  
Entspricht etwa **100–150 Stunden** à 80–120 €/h für eine vergleichbare Maßanfertigung.

*Hinweis:* Kein Standard-WordPress-Baukasten, sondern individuelle Anwendung mit Kalender, CMS und interaktivem Modul – das liegt im Bereich einer kleinen Web-App plus Marketing-Website.

---

*Fragen oder Ergänzungen für das Gespräch um 19 Uhr einfach anmerken.*
