# 05 – Inhalte & i18n

## Das Textsystem

Jeder Text auf der Website hängt an einem Schlüssel wie `home.hero.titleHtml`.
Im HTML steht dazu ein Attribut:

```html
<h1 data-i18n="book.title">Kennenlernen oder Sitzung buchen</h1>
<p data-i18n-html="book.sub">Nur <strong>Dienstag …</strong></p>
```

Der Text im HTML ist nur der Ausgangswert – zur Laufzeit ersetzt ihn
`assets/js/i18n.js` durch den Wert aus `window.I18N_MESSAGES` in der gewählten
Sprache. Varianten: `data-i18n` (reiner Text), `data-i18n-html` (mit Auszeichnung),
`data-i18n-aria-label`.

Aktuell sind **488 Schlüssel** in DE und EN gepflegt, verteilt auf 11 Seiten-Bindings.

## Wo ein Text tatsächlich herkommt

Es gibt drei Ebenen; die spätere gewinnt:

1. **Quelltexte** – `assets/js/i18n-messages-pages.js` und die seitenweisen Dateien.
   Das ist der Stand im Repository.
2. **`data/i18n-overrides.json`** – Änderungen aus dem Admin-Panel, versionierbar,
   werden beim Build eingemischt.
3. **Datenbank** (`settings.i18n_overrides`) – dieselben Änderungen, sofort wirksam,
   ohne Deployment.

Speichert jemand im Admin-Panel, schreibt `lib/i18n-persist.js` **beide**: die
Datenbank (sofort sichtbar) und `data/i18n-overrides.json` plus die JS-Quellen
(damit die Änderung ein Deployment übersteht).

> **Deshalb gilt:** Nach Textänderungen im Admin-Panel muss
> `data/i18n-overrides.json` committet werden. Sonst gehen sie beim nächsten
> Deployment verloren, sobald jemand die Datenbank neu aufsetzt.

## Nicht direkt bearbeiten

Die Dateien `assets/js/i18n-messages-<seite>.js` (`home`, `therapy`, `about`,
`booking`, `contact`, `prices`, `news`, `events`, `atelier`, `imprint`, `privacy`,
`kostenerstattung`, `shared`) werden bei **jedem Build neu erzeugt**. Änderungen
darin sind beim nächsten `npm run build-frontend` weg.

Stattdessen:

- Texte im **Admin-Panel** ändern (empfohlen), oder
- `assets/js/i18n-messages-pages.js` bearbeiten – das ist die Quelldatei.

Welcher Schlüssel in welche Datei wandert, entscheidet `pageForKey()` in
`scripts/build-frontend.js` anhand des Präfixes (`home.` → `home`, `kt.`/`offer.`
→ `therapy`, `nav.`/`btn.`/`form.`/`consent.` → `shared` usw.).

## Der Build

`npm run build-frontend` (läuft auch automatisch vor `npm start`) führt aus:

1. **Preise spiegeln** – Werte aus `lib/site-pricing.js` in die Texte schreiben,
   damit Preisseite und übrige Erwähnungen nicht auseinanderlaufen
2. **i18n aufteilen** – alle Schlüssel auf Seitendateien verteilen, damit jede
   Seite nur ihre eigenen Texte lädt
3. **JS-Bundle** – elf Kerndateien (i18n, SEO, Consent, Accessibility, Reveal …)
   zusammenfassen, mit terser minimieren, unter `site-core.<hash>.js` ablegen
4. **CSS hashen** – `style.<hash>.css`
5. **Bilder optimieren** – WebP-Varianten in mehreren Breiten über sharp
6. **HTML patchen** – Skript- und Stylesheet-Verweise auf die gehashten Namen setzen

Ergebnis in `assets/asset-manifest.json`. Die Hashes erlauben ein Jahr
Browser-Cache; unversionierte CSS/JS bekommen bewusst `Cache-Control: no-cache`.

`SKIP_FRONTEND_BUILD=1` überspringt den Schritt.

## Prüfen

```bash
npm run validate-i18n   # DE/EN vollständig? Bindings gültig?
npm run qa              # dasselbe plus Syntaxprüfung der Frontend-Skripte
```

Ausgabe im Normalfall: `OK: 488 Schlüssel DE/EN, 11 Seiten-Bindings`. Fehlt ein
Schlüssel in einer Sprache, schlägt die CI fehl.

## Bilder

Bilder auf der Website hängen an festen **Slots** (`lib/site-images.js`), nicht an
freien Dateipfaden – so kann im Admin-Panel ein Bild ausgetauscht werden, ohne
dass HTML angefasst werden muss.

| Slot | Ort |
| --- | --- |
| `header.logo` | Logo in der Kopfzeile |
| `home.hero` | Großes Bild auf der Startseite |
| `home.gallery.1` … `.6` | Galerie der Startseite (Anzahl einstellbar) |
| `about.portrait` | Porträt auf „Über mich" |
| `therapy.raum.eingang` · `.vision` · `.innen` · `.gestalten` | Raumbilder |

Ohne Eintrag gilt das mitgelieferte Standardbild. Alt-Texte lassen sich je Slot
setzen – bei inhaltstragenden Bildern bitte tun.

## Preise

`lib/site-pricing.js` ist die Quelle; der Build spiegelt die Werte in die Texte.
Die im Admin-Panel pflegbare Preistabelle liegt zusätzlich unter
`settings.prices_table` und wird über `/api/prices-table` ausgeliefert.

> Achtung auf Widersprüche zwischen Preistexten und Buchungslogik – siehe
> [09 – Review](09-website-review.md), Befund A2.
