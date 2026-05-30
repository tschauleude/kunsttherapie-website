# Kunsttherapie Paderborn – Website

Professionelle, responsive Website für Kunsttherapie-Praxis von **Martina Schwierzke**.

---

## 📋 Übersicht

Diese Website ist **statisch**, **schnell** und **datenschutzkonform**:

- ✅ **Keine Datenbank nötig** – reine HTML/CSS/JS
- ✅ **Mobil-responsive** – optimiert für Smartphone & Desktop
- ✅ **Datenschutz-freundlich** – keine Cookies, kein Tracking
- ✅ **SEO-ready** – mit Meta-Tags und strukturiertem Inhalt
- ✅ **Wartungsfreundlich** – News können einfach in JSON editiert werden

---

## 📁 Dateistruktur

```
kunsttherapie-website/
├── index.html                  # Startseite (Hostinger-Einstiegspunkt)
├── angebote.html               # Detaillierte Angebotsbeschreibung
├── ueber-mich.html             # Über Martina & Qualifikationen
├── preise.html                 # Preistabelle
├── kontakt.html                # Kontaktformular & Infos
├── neuigkeiten.html            # News aus CMS, mit JSON-Fallback
├── events.html                 # Events aus CMS
├── impressum.html              # Rechtliche Infos
├── datenschutz.html            # Datenschutzerklärung
├── server.js                   # Optionales Node/Express-CMS + API
├── package.json                # Backend-Start über npm start
│
├── assets/
│   ├── css/style.css           # Komplettes Styling
│   ├── js/main.js              # Jahr, Canvas-Atelier, Interaktion
│   └── img/                    # Logos und Website-Bilder
│
├── data/
│   └── news.json               # Statischer News-Fallback
│
└── public/
    └── admin.html              # Admin-Panel unter /admin
```

---

## 🎨 Design-Highlights

- **Dark Mode** mit Gold-Akzenten (`#f1b81b`) – elegant & modern
- **Card-basiertes Layout** – klare visuelle Hierarchie
- **Interactive Canvas** – Mini-Atelier zum Ausprobieren
- **Smooth Animations** – Hover-Effekte & Übergänge
- **Flexible Grids** – Responsive 3-Column → 1-Column auf Mobile

---

## 🚀 Schnellstart (Lokal testen)

### Option 1: Python (einfach)
```bash
python3 -m http.server 8080
```
Dann öffne: **http://localhost:8080**

### Option 2: Node.js
```bash
npx http-server . -p 8080
```

### Option 3: Live Server (VS Code)
- VS Code Extension „Live Server" installieren
- Auf `index.html` rechtsklick → „Open with Live Server"

---

## 📝 Inhalte editieren

### News/Neuigkeiten aktualisieren

Öffne `data/news.json`:

```json
{
  "items": [
    {
      "date": "2026-06-01",
      "title": "Neue Gruppe startet",
      "text": "Ab Montag neue Kunsttherapie-Gruppe..."
    },
    {
      "date": "2026-06-15",
      "title": "Workshop: Acryl-Collage",
      "text": "Experimentieren mit Acryl und Papier..."
    }
  ]
}
```

Die News erscheinen automatisch auf `/neuigkeiten.html`.

### Text auf den Seiten ändern

Einfach die HTML-Dateien in einem Texteditor öffnen:
- `index.html` – Hauptseite
- `angebote.html` – Leistungen
- `ueber-mich.html` – Bio & Qualifikationen
- `kontakt.html` – Kontaktdaten
- `preise.html` – Preise

Speichern, Browser neuladen – fertig!

### Farben anpassen

In `assets/css/style.css` die CSS-Variablen ändern:

```css
:root {
  --brand: #f1b81b;      /* Gold – Hauptfarbe */
  --brand2: #eaa300;     /* Dunkleres Gold */
  --bg: #0e0f10;         /* Dunkelgrau Hintergrund */
  --text: #f4f4f4;       /* Hellgrau Text */
  /* ... weitere Farben */
}
```

---

## 🌐 Online deployen

### Empfohlene Hosting-Optionen (alle kostenlos für statische Sites):

#### 1. **Netlify** (beste Option)
- GitHub mit der Site verbinden
- Automatische Deployments bei jedem Push
- Custom Domain möglich

```bash
# Nur die kunsttherapie-site/ auf GitHub pushen
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USER/kunsttherapie-site.git
git push -u origin main
```

Dann auf **netlify.com** → Connect GitHub → Deploy

#### 2. **Vercel**
Ähnlich wie Netlify, sehr schnell:
```bash
npm install -g vercel
vercel
```

#### 3. **GitHub Pages**
```bash
# Pushe den Ordner zu GitHub
# Gehe zu Settings → Pages → Deploy from a branch
# Wähle main / root
```

#### 4. **Hostinger / Andere Web-Hoster**
- Bei Hostinger Git-Deployment dieses Repo direkt mit `public_html` verbinden.
- Wichtig: `index.html` liegt bewusst im Repo-Root; `assets/` und `data/` müssen mit hochgeladen werden.
- Für FTP/SFTP den Inhalt dieses Repo-Roots nach `public_html/` hochladen:
  ```bash
  sftp user@example.com
  > cd public_html
  > put -r index.html angebote.html ueber-mich.html preise.html kontakt.html neuigkeiten.html events.html impressum.html datenschutz.html assets data .
  > exit
  ```

- Das optionale CMS läuft als Node-App mit `npm install` und `npm start`; das Admin-Panel ist dann unter `/admin` erreichbar.

---

## 📧 Kontaktformular aktivieren

Das Formular auf `/kontakt.html` ist aktuell deaktiviert. Optionen zum Aktivieren:

### Option A: Formspree (kostenlos, einfach)
1. Gehe zu **formspree.io**
2. Registriere dich, erstelle neues Formular
3. Erhalte eine `action`-URL
4. Ersetze in `kontakt.html`:

```html
<form action="https://formspree.io/f/YOUR_ID" method="POST">
  <input type="text" name="name" placeholder="Dein Name" required/>
  <input type="email" name="email" required/>
  <textarea name="message" placeholder="Nachricht" required></textarea>
  <button type="submit">Senden</button>
</form>
```

### Option B: EmailJS (client-seitig, JavaScript)
```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/index.min.js"></script>
<script>
  emailjs.init("YOUR_PUBLIC_KEY");
</script>
```

---

## 🔍 SEO & Meta-Tags

Alle Seiten haben bereits:
- Unique `<title>` Tags
- `<meta description>`
- Open Graph Tags (Social Sharing)
- Mobile viewport config

Diese sind in jeder HTML anpassbar:

```html
<meta name="description" content="Deine Beschreibung hier"/>
```

---

## 📊 Performance & Optimi­erung

- **CSS**: Inline-Styling in `<head>` – schnell
- **Bilder**: Logo ist JPG (optimiert)
- **JS**: Minimal & vanilla – keine großen Frameworks
- **Caching**: `data/news.json` hat `cache: no-store` für immer aktuelle Inhalte

Größe: ~25 KB ohne Bilder, ~2 MB mit Logo ✅

---

## 🛡️ Datenschutz

- ✅ Keine Google Analytics
- ✅ Keine Cookies (außer optional via Formspree)
- ✅ Impressum & Datenschutzerklärung dabei
- ✅ Keine Nutzerdaten lokal gespeichert

---

## 🐛 Häufige Fragen

### Q: Wie ändere ich die Öffnungszeiten?
**A:** In `index.html`, `angebote.html` und `kontakt.html` die Text-Blöcke mit Zeiten suchen und anpassen.

### Q: Wie füge ich mehr Seiten hinzu?
**A:** 
1. Neue HTML-Datei erstellen (z.B. `galerie.html`)
2. Header & Footer von einer existierenden Seite kopieren
3. In `<nav>` auf allen Seiten den Link hinzufügen
4. Speichern

### Q: Kann ich ein Blog hinzufügen?
**A:** Ja! Das System mit `data/news.json` ist dafür schon vorbereitet. Einfach mehr News hinzufügen – sie erscheinen automatisch.

### Q: Wie mache ich das Atelier (Canvas) offline verfügbar?
**A:** Es funktioniert bereits offline! Die JavaScript lädt lokal.

### Q: Kann ich eCommerce/Shop hinzufügen?
**A:** Für diese statische Site nicht direkt. Optionen:
- Verlink zu Etsy/eBay Shop
- Einbetten eines Zahlungsservices (Stripe, PayPal)
- Upgrade auf ein CMS wie WordPress

---

## 🎯 Nächste Schritte

1. **Logo überprüfen** – `assets/img/logo.jpg` ist richtig?
2. **Texte durchlesen** – alle Infos aktuell?
3. **Lokal testen** – `python3 -m http.server 8080`
4. **Deployen** – auf Netlify, Vercel oder eigenem Hoster
5. **Domain verbinden** – eigenständig oder via Hosting-Anbieter
6. **Google Search Console** – für SEO

---

## 📞 Support & Kontakt

- **Martina:** info@kunsttherapie-pb.de
- **Website-Fragen:** siehe Dokumentation oben
- **Weitere Features:** können später hinzugefügt werden (z.B. Buchungssystem)

---

## 📄 Lizenz & Nutzung

© 2026 Kunsttherapie Paderborn – Martina Schwierzke. Alle Inhalte urheberrechtlich geschützt.

Verwendung für private und kommerzielle Zwecke innerhalb dieser Website freigegeben.

---

**Viel Erfolg mit der Website! 🎨✨**
