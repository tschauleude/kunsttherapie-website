# pdf.js (Mozilla)

Dateien aus `pdfjs-dist` Version 4.10.38, Lizenz Apache-2.0.

    pdf.min.mjs          344 KB
    pdf.worker.min.mjs  1343 KB

**Wofür:** Beim Hochladen eines Flyers erzeugt das Admin-Panel im Browser eine
Vorschau der ersten PDF-Seite und lädt sie als Bild mit hoch. Besucher sehen
dieses Bild – pdf.js wird auf den öffentlichen Seiten **nicht** geladen.

**Warum mitgeliefert statt als Abhängigkeit:** Serverseitig ließe sich keine
Vorschau erzeugen – auf dem Server gibt es weder poppler (`pdftoppm`) noch
Ghostscript, und sharp liest keine PDFs. Eine Umsetzung in Node bräuchte
zusätzlich ein natives canvas-Paket, das bei jedem Deployment gebaut werden
müsste. Im Browser geht es ohne das alles.

Die Dateien liegen hier statt in node_modules, damit `npm ci --omit=dev` auf dem
Server nichts Zusätzliches installieren muss.

**Aktualisieren:**

    npm install --no-save pdfjs-dist@<version>
    cp node_modules/pdfjs-dist/build/pdf.min.mjs assets/js/vendor/pdfjs/
    cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs assets/js/vendor/pdfjs/
