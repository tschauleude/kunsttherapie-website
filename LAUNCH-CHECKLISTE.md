# ✅ Kunsttherapie Website – Setup & Launch Checkliste

## 📦 Was du hast

- ✅ **kunsttherapie-website.zip** – komplette Website zum Download
- ✅ **kunsttherapie-site/** – Ordner mit allen Dateien
- ✅ **Kunsttherapie_Paderborn_Mappe.pdf** – professionelle Bewerbungsmappe
- ✅ **README.md** – ausführliche Dokumentation

---

## 🎯 Phase 1: Lokales Setup (10 Min)

### Schritt 1: Ordner vorbereiten
```bash
# ZIP entpacken
unzip kunsttherapie-website.zip
cd kunsttherapie-site
```

### Schritt 2: Lokal testen
```bash
# Python starten (läuft auf http://localhost:8080)
python3 -m http.server 8080

# Oder: npx verwenden (wenn Node.js installiert)
npx http-server . -p 8080
```

### Schritt 3: Im Browser testen
- 🌐 Öffne **http://localhost:8080**
- Klicke durch alle Seiten
- Teste das interaktive Canvas-Atelier
- Überprüfe auf Mobil-Ansicht (F12 → Mobile)

### ✓ Erledigt?
- [ ] Website lädt lokal
- [ ] Alle Links funktionieren
- [ ] Logo wird angezeigt
- [ ] Mobile-Ansicht ok

---

## 🎨 Phase 2: Inhalte anpassen (15-20 Min)

### Schritt 1: Wichtige Infos prüfen/aktualisieren

**`kontakt.html` – Kontaktdaten:**
- [ ] Telefonnummer: `05251-690111`
- [ ] Mobil: `0170-4790790`
- [ ] E-Mail: `info@kunsttherapie-pb.de`
- [ ] Adresse: Otto-Stadler-Straße 23c, 33102 Paderborn

**`index.html` + alle Seiten – Text:**
- [ ] Alle Texte sind aktuell & korrekt
- [ ] Daten (06/2026 Start) stimmen
- [ ] Preise sind richtig

**`ueber-mich.html`:**
- [ ] Bio passt
- [ ] Qualifikationen aktuell

### Schritt 2: News hinzufügen

Öffne `data/news.json` und editiere:

```json
{
  "items": [
    {
      "date": "2026-06-01",
      "title": "Gruppen starten",
      "text": "Ab heute wieder Kunsttherapie-Gruppen in der Otto-Stadler-Str."
    },
    {
      "date": "2026-06-15",
      "title": "Workshop Acryl",
      "text": "Neuer Workshop: freies Malen mit Acryl, ohne Vorerfahrung"
    }
  ]
}
```

**Speichern** → Website neuladen → News erscheinen auf `/neuigkeiten.html`

### Schritt 3: Design-Farben (optional)

In `assets/css/style.css` die Root-Variablen ändern:

```css
:root {
  --brand: #f1b81b;      /* Hauptfarbe (Gold) */
  --brand2: #eaa300;     /* Dunkles Gold */
  --bg: #0e0f10;         /* Hintergrund */
  --text: #f4f4f4;       /* Text */
}
```

### ✓ Erledigt?
- [ ] Kontaktdaten korrekt
- [ ] Texte aktuell
- [ ] News hinzugefügt
- [ ] (Optional) Farben angepasst

---

## 🌐 Phase 3: Online deployen (5-10 Min)

### Option A: **NETLIFY** (empfohlen – kostenlos)

1. **GitHub-Account** erstellen (falls nicht vorhanden)
   - https://github.com/signup

2. **Repository erstellen** für die Website
   ```bash
   cd kunsttherapie-site
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/DEIN-NAME/kunsttherapie-site.git
   git push -u origin main
   ```

3. **Netlify verbinden**
   - Gehe zu https://netlify.com
   - Click „New site from Git"
   - GitHub authorisieren
   - Repository wählen: `kunsttherapie-site`
   - Deploy! 🚀

4. **Custom Domain** (falls vorhanden)
   - In Netlify: Domain Settings
   - `kunsttherapie-pb.de` einbinden

**Ergebnis:** Website live auf `https://kunsttherapie-site.netlify.app`

---

### Option B: **VERCEL** (auch kostenlos)

```bash
npm install -g vercel
cd kunsttherapie-site
vercel
```

Beantworte die Fragen, Website wird live!

---

### Option C: **Eigener Hoster** (z.B. Hostinger, STRATO, etc.)

1. **FTP-Zugangsdaten** vom Hoster bekommen
2. **FileZilla oder ähnlich** öffnen
3. **kunsttherapie-site/** komplett hochladen zu `public_html/`
4. **Domain** im Hoster auf den richtigen Ordner verweisen

---

### Option D: **GitHub Pages** (kostenlos)

```bash
# Im GitHub-Repo: Settings → Pages
# Branch: main
# Folder: / (root)
# Save!
```

Website live auf `https://DEIN-NAME.github.io/kunsttherapie-site`

---

### ✓ Erledigt?
- [ ] Server-Option gewählt
- [ ] Deployment durchgeführt
- [ ] Website online erreichbar
- [ ] Domain konfiguriert (falls vorhanden)

---

## 📧 Phase 4: Kontaktformular aktivieren (10 Min)

Das Formular auf `/kontakt.html` sendet aktuell nirgendwohin. Optionen:

### A: **Formspree** (einfach, kostenlos)

1. https://formspree.io → Registrieren
2. Neues Formular erstellen
3. Bekommst `form_id` (z.B. `mwkdoqwe`)
4. Ersetze in `kontakt.html` diese Zeile:

```html
<!-- Alt: -->
<form style="display:flex; flex-direction:column; gap:10px" onsubmit="return false;">

<!-- Neu: -->
<form action="https://formspree.io/f/mwkdoqwe" method="POST" style="display:flex; flex-direction:column; gap:10px">
```

5. Button ändern:
```html
<!-- Alt: -->
<button type="button" class="btn primary" onclick="alert('...')">Senden</button>

<!-- Neu: -->
<button type="submit" class="btn primary">Senden</button>
```

**Fertig!** Jede Mail kommt dann zu `info@kunsttherapie-pb.de`

---

### B: **Mailto-Link** (einfach, aber weniger elegant)

```html
<a href="mailto:info@kunsttherapie-pb.de?subject=Kunsttherapie%20Anfrage" class="btn primary">
  E-Mail schreiben
</a>
```

---

### ✓ Erledigt?
- [ ] Formspree/Mailto eingerichtet
- [ ] Test-Nachricht versendet
- [ ] E-Mails kommen an

---

## 🔍 Phase 5: SEO & Verzeichnisse (5 Min)

### Google Search Console
1. https://search.google.com/search-console
2. „URL-Präfix" eingeben: `https://kunsttherapie-pb.de`
3. Domain verifizieren
4. Sitemap: `https://kunsttherapie-pb.de/sitemap.xml` (noch erstellen)

### Lokale Verzeichnisse
- [ ] Google My Business einrichten
- [ ] Eintrag in Jameda (Therapeuten-Portal)
- [ ] Eintrag in Healthgrades

---

## 📱 Phase 6: Finale Checks

### Desktop (Chrome, Firefox, Safari)
- [ ] Alle Seiten laden
- [ ] Schriften sind lesbar
- [ ] Bilder laden
- [ ] Links funktionieren
- [ ] Formulare funktionieren

### Mobile (iPhone, Android)
- [ ] Responsive Layout ok
- [ ] Touch funktioniert
- [ ] Canvas funktioniert
- [ ] Menü funktioniert

### Accessibility
- [ ] Tab-Navigation funktioniert
- [ ] Kontrast ist ausreichend
- [ ] Bilder haben Alt-Text

### Performance
- [ ] Website lädt schnell
- [ ] Keine JavaScript-Fehler (F12 Console)
- [ ] Lighthouse Score >90 (Chrome DevTools)

---

## 📞 Phase 7: Marketing (optional)

- [ ] Link auf LinkedIn teilen
- [ ] Link in E-Mail-Signatur
- [ ] QR-Code zur Website (z.B. auf Visitenkarten)
- [ ] Instagram-Bio: Link zur Website
- [ ] Google Ads / Local Services Ads

---

## 🎉 Erfolg!

Wenn alle Punkte abhaken sind:

✅ **Website ist live!**
✅ **Patienten können buchen!**
✅ **Professionelle Online-Präsenz!**

---

## 🆘 Problem-Lösung

| Problem | Lösung |
|---------|--------|
| Bilder laden nicht | Logo in `assets/img/logo.jpg` überprüfen |
| Formular sendet nicht | Formspree-URL überprüfen oder Mailto verwenden |
| Website lädt langsam | Bilder optimieren (TinyPNG) |
| Mobile Menü funktioniert nicht | CSS in Browser überprüfen (F12) |
| News erscheinen nicht | `data/news.json` Syntax überprüfen (JSON validator) |

---

## 📚 Weitere Ressourcen

- **Dokumentation:** `README.md`
- **CSS anpassen:** `assets/css/style.css`
- **Inhalte:** HTML-Dateien direkt editieren
- **News:** `data/news.json` editieren

---

## 📧 Kontakt Support

Falls Fragen auftauchen:
- Dokumentation lesen (`README.md`)
- ChatGPT fragen (mit Screenshot & Fehlermeldung)
- Hosting-Support kontaktieren
- GitHub Issues erstellen

---

**Viel Erfolg! 🎨✨**

*Checkliste: letzte Aktualisierung 20.05.2026*
