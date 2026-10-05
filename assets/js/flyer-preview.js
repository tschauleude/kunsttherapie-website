/* Vorschaubild für einen Flyer erzeugen.
 *
 * Läuft ausschließlich im Admin-Panel: Beim Hochladen wird die erste Seite der
 * PDF im Browser gerendert und als JPEG mitgeschickt. Besucher bekommen später
 * nur dieses Bild zu sehen – pdf.js wird auf den öffentlichen Seiten nie
 * geladen (es sind zusammen rund 1,7 MB).
 *
 * Serverseitig ginge es nicht: Auf dem Server gibt es weder poppler noch
 * Ghostscript, und sharp liest keine PDFs.
 */
(function () {
  const PDFJS_PFAD = '/assets/js/vendor/pdfjs/pdf.min.mjs';
  const WORKER_PFAD = '/assets/js/vendor/pdfjs/pdf.worker.min.mjs';
  const BREITE = 1000; // Längste Kante der Vorschau

  let pdfjsLaden = null;

  /** pdf.js erst laden, wenn wirklich eine PDF verarbeitet wird. */
  function ladePdfJs() {
    if (!pdfjsLaden) {
      pdfjsLaden = import(PDFJS_PFAD).then((mod) => {
        mod.GlobalWorkerOptions.workerSrc = WORKER_PFAD;
        return mod;
      });
    }
    return pdfjsLaden;
  }

  /**
   * Erste Seite einer PDF als JPEG-Datei.
   * Gibt null zurück, wenn etwas schiefgeht – der Flyer lässt sich dann
   * trotzdem speichern, nur eben ohne Vorschaubild.
   */
  async function erzeugeVorschau(datei) {
    try {
      const pdfjs = await ladePdfJs();
      const daten = new Uint8Array(await datei.arrayBuffer());
      const dokument = await pdfjs.getDocument({ data: daten }).promise;
      const seite = await dokument.getPage(1);

      const ausgangsMasse = seite.getViewport({ scale: 1 });
      const skalierung = BREITE / Math.max(ausgangsMasse.width, ausgangsMasse.height);
      const viewport = seite.getViewport({ scale: Math.min(skalierung, 3) });

      const leinwand = document.createElement('canvas');
      leinwand.width = Math.round(viewport.width);
      leinwand.height = Math.round(viewport.height);
      const ctx = leinwand.getContext('2d');
      if (!ctx) return null;

      // Weißer Grund: PDF-Seiten sind oft durchsichtig, sonst wird es schwarz.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, leinwand.width, leinwand.height);

      await seite.render({ canvasContext: ctx, viewport }).promise;
      await dokument.destroy();

      const blob = await new Promise((fertig) => leinwand.toBlob(fertig, 'image/jpeg', 0.82));
      if (!blob) return null;

      return new File([blob], 'flyer-vorschau.jpg', { type: 'image/jpeg', lastModified: Date.now() });
    } catch (err) {
      console.error('Vorschau konnte nicht erzeugt werden:', err);
      return null;
    }
  }

  window.ktFlyerVorschau = erzeugeVorschau;
})();
