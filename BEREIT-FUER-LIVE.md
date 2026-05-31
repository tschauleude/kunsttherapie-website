# Bereit für Live (Stand Feature-Branch → main)

## Enthaltene Features (dieser Release)

| Bereich | Status |
|--------|--------|
| DE/EN auf allen öffentlichen Seiten | ✅ |
| Sprachumschalter im Header (fest im HTML) | ✅ |
| Angebots-Karten: Mehr erfahren / Weniger (in der Box) | ✅ |
| Live-Atelier im Footer | ✅ |
| Cookie-/A11y-Footer nach Sprachwechsel | ✅ |
| Buchung/Events/News bei EN aktualisiert | ✅ |
| `npm run validate-i18n` | ✅ |

## Vor dem Upload (Hostinger)

1. Branch `main` mit diesem Stand deployen (FTP/SFTP oder Git Pull auf dem Server).
2. Auf dem Server: `npm install` (falls noch nicht), dann `npm start` oder PM2.
3. `.env` prüfen (E-Mail, Session, ggf. Google Calendar).
4. Kurz testen:
   - https://kunsttherapie.mkmpb.de/ – DE/EN oben rechts
   - `/kunsttherapie` – Angebote aufklappen
   - `/atelier` – Live-Atelier im Footer
   - `/buchung` – Kalender

## QA-Befehle lokal

```bash
npm run validate-i18n
node server.js
# Browser: http://localhost:3000
```

## Nach dem Deploy

- Hart neu laden (Strg+F5), damit CSS/JS nicht aus dem Cache kommen.
- Alte PRs (#9 Tropfen) sind obsolet – dieser Stand ersetzt sie.
