# 🎨 KUNSTTHERAPIE WEBSITE + CMS – QUICK START

## Du hast folgende Dateien:

```
kunsttherapie-site/        ← WEBSITE FRONTEND
kunsttherapie-cms/         ← CMS BACKEND (Admin-Panel)
CMS-WEBSITE-INTEGRATION-GUIDE.md  ← Detailliertes Handbuch
```

---

## 🚀 SOFORT STARTEN (3 SCHRITTE):

### Schritt 1: Backend installieren

```bash
cd kunsttherapie-cms
npm install
```

Dauert ca. 1-2 Minuten.

### Schritt 2: Backend starten

```bash
npm run dev
```

Du solltest sehen:
```
🎨 Kunsttherapie CMS Backend
Server running on http://localhost:3000
Admin Panel: http://localhost:3000/admin
```

### Schritt 3: Admin-Panel öffnen

Öffne Browser:
```
http://localhost:3000/admin
```

Login:
- **Benutzername:** admin
- **Passwort:** admin123

---

## ✅ JETZT KANNST DU:

- 📰 News hinzufügen
- 📅 Events erstellen
- 💜 Services verwalten

**Alle Änderungen erscheinen sofort auf der Website!**

---

## 🌐 WEBSITE ANSCHAUEN

In neuer Terminal-Session:

```bash
cd kunsttherapie-site
python3 -m http.server 8080
```

Öffne Browser:
```
http://localhost:8080
```

Du siehst:
- Startseite mit Bildern
- News-Seite (lädt von CMS)
- Events-Seite (lädt von CMS)

---

## ⚠️ WICHTIG

- **Passwort ändern** nach dem ersten Login!
- Beide Server müssen laufen (Port 3000 & 8080)
- Regelmäßig Backups von `kunsttherapie-cms/database.sqlite` machen

---

## 📖 Mehr Infos?

Lies: `CMS-WEBSITE-INTEGRATION-GUIDE.md`

---

🎉 **Du bist ready to go!** 🚀
