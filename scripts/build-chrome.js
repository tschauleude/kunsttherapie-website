#!/usr/bin/env node
/**
 * Erzeugt Header/Footer-Snippets für öffentliche Seiten (Referenz / künftige Syncs).
 * Ausführung: node scripts/build-chrome.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const HEADER = `  <a class="skip-link" href="#main">Zum Inhalt springen</a>
  <header>
    <div class="container header-inner">
      <a class="brand logo-text" href="index.html">
        <span class="name">Martina Schwierzke</span>
        <span class="title">Kunsttherapie Paderborn</span>
      </a>
      <nav id="site-nav" data-site-nav aria-label="Hauptnavigation">
        <ul>
          <li><a href="ueber-mich.html" data-nav="ansatz">Mein Ansatz</a></li>
          <li><a href="kunsttherapie.html" data-nav="kunsttherapie">Kunsttherapie</a></li>
          <li><a href="kunsttherapie.html#praxis" data-nav="praxis">Die Praxis</a></li>
          <li><a href="neuigkeiten.html" data-nav="neuigkeiten">Neuigkeiten</a></li>
          <li><a href="buchung.html" class="nav-cta" data-nav="termin">Termin</a></li>
          <li><a href="kontakt.html" data-nav="kontakt">Kontakt</a></li>
        </ul>
      </nav>
    </div>
  </header>`;

const FOOTER = `  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <h4>Praxis</h4>
        <p><strong>Martina Schwierzke</strong></p>
        <p>Psychosoziale &amp; Klinische Kunsttherapeutin</p>
        <p>Otto-Stadler-Straße 23c<br>33102 Paderborn</p>
      </div>
      <div class="footer-col">
        <h4>Kontakt</h4>
        <p><a href="tel:+495251690111">Tel. 05251-690111</a></p>
        <p><a href="tel:+491704790790">Mobil 0170-4790790</a></p>
        <a href="mailto:info@kunsttherapie-pb.de">info@kunsttherapie-pb.de</a>
      </div>
      <div class="footer-col">
        <h4>Angebot</h4>
        <a href="kunsttherapie.html">Kunsttherapie</a>
        <a href="buchung.html">Termin buchen</a>
        <a href="events.html">Veranstaltungen</a>
        <a href="neuigkeiten.html">Neuigkeiten</a>
        <a href="preise.html">Preise</a>
        <a href="atelier.html"><span data-i18n="footer.atelier">Live-Atelier</span></a>
      </div>
      <div class="footer-col">
        <h4>Rechtliches</h4>
        <a href="impressum.html">Impressum</a>
        <a href="datenschutz.html">Datenschutz</a>
      </div>
    </div>
    <div class="container legal-footer">
      &copy; <span id="y"></span> Martina Schwierzke · Kunsttherapie Paderborn
    </div>
  </footer>`;

const SCRIPTS = `  <script src="assets/js/consent.js"></script>
  <script src="assets/js/site.js"></script>
  <script src="assets/js/reveal.js"></script>
  <script src="assets/js/scroll-top.js"></script>`;

const dir = path.join(ROOT, 'partials');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'header.html'), HEADER);
fs.writeFileSync(path.join(dir, 'footer.html'), FOOTER);
fs.writeFileSync(path.join(dir, 'scripts-base.html'), SCRIPTS);
console.log('Wrote partials/header.html, footer.html, scripts-base.html');
