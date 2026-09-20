# 11 – Automatisches Deployment reaktivieren

Kurzfassung für den Einstieg in einem neuen Chat. Wenn du nur den fertigen
Prompt brauchst: [ganz unten](#fertiger-prompt-zum-kopieren).

---

## Befund zuerst: Es ist nicht kaputt

Geprüft am 17.09.2026 über die GitHub-Actions-API:

| | |
| --- | --- |
| Workflow | `Deploy to Strato VPS` (`.github/workflows/deploy.yml`) |
| Läufe insgesamt | 11 |
| Letzter Lauf | **17.06.2026**, Lauf #11, Commit `2e049f5` |
| Ergebnis | **erfolgreich** – Job `build` und Job `deploy` beide grün |
| SSH-Schritt | „Deploy via SSH (git pull)" lief in 8 Sekunden durch |
| Fehlgeschlagene Läufe | keine |

**Der automatische Upload ist also scharf geschaltet und hat zuletzt sauber
funktioniert.** Er hat seit dem 17. Juni nur nichts zu tun gehabt, weil seither
nichts nach `main` gemerged wurde. Das erklärt auch, warum die Inhalte auf der
Seite auf dem Stand von Juni/Juli stehen.

Es ist also **nichts zu reparieren**, sondern nur auszulösen – plus eine
Verifizierung, dass nach drei Monaten serverseitig noch alles steht.

---

## Wie der Upload funktioniert

Jeder Push auf `main` startet den Workflow:

1. **Job `build`** – Node 20, `npm ci`, `npm run build-frontend`, `npm run qa`.
   Schlägt einer dieser Schritte fehl, wird **nicht** deployt.
2. **Job `deploy`** – nur bei `main`, per SSH auf dem Strato VPS:
   ```bash
   cd $VPS_PROJECT_PATH
   git pull origin main
   npm ci --omit=dev
   pm2 restart kunsttherapie || true
   ```

Benötigte GitHub-Secrets (unter *Settings → Secrets and variables → Actions*):
`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PROJECT_PATH`, optional `VPS_PORT`.

> Die Secrets waren am 17.06. gültig. Ob der SSH-Schlüssel seither rotiert wurde
> oder der Server umgezogen ist, lässt sich nur durch einen echten Lauf klären –
> Secrets sind nach dem Anlegen nicht mehr auslesbar.

---

## Auslösen in drei Schritten

### 1. Vorher prüfen, dass der Build durchläuft

```bash
npm ci
npm run build-frontend
npm run qa
```

Beides muss grün sein, sonst bricht der Workflow vor dem Deploy ab.

### 2. Nach `main` bringen

Für die aktuelle Arbeit existiert bereits ein Pull Request:

**[PR #98 – Dokumentation und Buchungskalender-Fixes](https://github.com/tschauleude/kunsttherapie-website/pull/98)**
(Branch `claude/brave-sagan-eowru5` → `main`)

Sobald die Prüfungen im PR grün sind, genügt **Merge pull request** auf GitHub.
Das ist der Push auf `main` und löst damit den Upload aus – ein zusätzlicher
Schritt ist nicht nötig.

Falls kein PR vorliegt, ginge es auch direkt:

```bash
git checkout main
git pull origin main
git merge <branch>
git push origin main
```

Der Weg über einen Pull Request ist aber vorzuziehen: Dort laufen die Prüfungen
**vor** dem Merge, und der Stand bleibt nachvollziehbar.

### 3. Zusehen und verifizieren

- **Actions-Tab** auf GitHub: Der Lauf „Deploy to Strato VPS" muss erscheinen und
  in beiden Jobs grün werden.
- Danach live gegenprüfen:
  ```bash
  curl -s https://www.kunsttherapie-pb.de/health
  curl -sI https://www.kunsttherapie-pb.de/ | head -1
  ```
- Und im Browser: Wurde die Änderung tatsächlich sichtbar? Bei Asset-Änderungen
  hart neu laden (Strg+F5), weil gehashte Dateien ein Jahr lang gecacht werden.

---

## Wenn der Deploy-Job fehlschlägt

| Fehlerbild im Log | Ursache | Lösung |
| --- | --- | --- |
| `Permission denied (publickey)` | SSH-Schlüssel rotiert oder entfernt | Öffentlichen Schlüssel erneut in `~/.ssh/authorized_keys` auf dem VPS ablegen, privaten Teil als Secret `VPS_SSH_KEY` neu setzen |
| `Connection timed out` / `refused` | Host, Port oder Firewall geändert | `VPS_HOST` / `VPS_PORT` prüfen, VPS erreichbar? |
| `cd: … No such file or directory` | Projektpfad auf dem Server geändert | `VPS_PROJECT_PATH` korrigieren |
| `Your local changes would be overwritten` | Auf dem Server wurde direkt editiert | Auf dem Server `git status` ansehen, Änderungen sichern, dann `git reset --hard origin/main` |
| Job `build` rot, Deploy übersprungen | `npm run qa` oder der Build schlägt fehl | Lokal reproduzieren und beheben, erneut pushen |

**Immer möglich – von Hand deployen:**

```bash
ssh <user>@<host>
cd <projektpfad>
git pull origin main
npm ci --omit=dev
pm2 restart kunsttherapie
pm2 logs kunsttherapie --lines 50
```

---

## Wichtig: Was der Upload nicht mitnimmt

- **Die `.env` wird nicht übertragen.** Neue Variablen – etwa die
  Google-Zugangsdaten – müssen von Hand auf dem Server ergänzt werden.
- **Kein Frontend-Build auf dem Server.** `prestart` läuft nur bei `npm start`,
  nicht bei `pm2 restart`. Die gebauten, gehashten Dateien müssen deshalb
  **eingecheckt** sein – deshalb gehört `npm run build-frontend` vor jeden Commit,
  der CSS oder JS anfasst.
- **Keine Datenbankmigration und kein Rollback.** Zurück geht es nur über `git`.
- **Texte aus dem Admin-Panel** liegen in der Datenbank auf dem Server und werden
  vom Deployment nicht angefasst – sie sollten aber über
  `data/i18n-overrides.json` ins Repository gesichert werden.

---

## Fertiger Prompt zum Kopieren

Für ein neues Chatfenster mit Zugriff auf das Repository:

```text
Repository: tschauleude/kunsttherapie-website

Ziel: Das automatische Deployment ("automatischer Upload" auf den Strato VPS)
wieder auslösen und verifizieren.

Ausgangslage, bereits geprüft:
- Der Workflow .github/workflows/deploy.yml feuert bei jedem Push auf main.
- Der letzte Lauf war am 17.06.2026 (Lauf #11, Commit 2e049f5) und war
  ERFOLGREICH, inklusive SSH-Schritt. Es gibt keine fehlgeschlagenen Läufe.
- Das Deployment ist also nicht defekt, es wurde seit Juni nur nichts nach
  main gemerged. Es muss nichts repariert, sondern nur ausgelöst werden.
- Fertige, noch nicht gemergte Arbeit liegt im offenen Pull Request #98
  (Branch claude/brave-sagan-eowru5 -> main): Dokumentation in docs/ plus
  drei Frontend-Fixes am Buchungskalender und am Porträt.

Bitte der Reihe nach:
1. Den Status der Prüfungen in PR #98 ansehen und melden, ob sie grün sind.
   Falls rot: Ursache benennen und beheben. Zur Gegenprobe lokal
   npm ci && npm run build-frontend && npm run qa ausführen. Falls der Build
   assets/asset-manifest.json nur im Zeitstempel ändert, diese Datei nicht
   committen.
2. PR #98 nach main mergen. Der Merge IST der Push auf main und löst den
   Upload aus - ein separater Push ist nicht nötig.
3. Den ausgelösten Actions-Lauf "Deploy to Strato VPS" beobachten und melden,
   ob die Jobs "build" und "deploy" grün werden.
4. Falls der Deploy-Job fehlschlägt: das Log auswerten und die Ursache
   benennen (SSH-Schlüssel, Host/Port, Projektpfad oder lokale Änderungen
   auf dem Server). Keine Secrets erraten oder neu setzen, sondern sagen,
   welches Secret zu erneuern ist.
5. Nach erfolgreichem Deploy verifizieren:
   curl -s https://www.kunsttherapie-pb.de/health
   und melden, ob die Seite normal antwortet.

Wichtig: Die .env auf dem Server wird vom Deployment NICHT übertragen. Wenn
Google-Kalender-Zugangsdaten neu dazukommen, müssen die separat per SSH auf
dem Server eingetragen werden, gefolgt von pm2 restart kunsttherapie.
Hintergrund dazu steht in docs/08-google-kalender.md.
```
