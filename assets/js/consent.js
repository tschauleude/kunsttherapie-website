/**
 * DSGVO: Einwilligung für externe Dienste (Google Maps, Google Fonts).
 * Notwendig: Einstellungen + Neuigkeiten-Hinweis (localStorage, keine Tracking-Cookies).
 */
(function () {
  const STORAGE_KEY = 'kunsttherapie_consent_v1';
  const FONT_URL =
    'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap';

  let fontsLoaded = false;

  function getConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveConsent(partial) {
    const next = {
      v: 1,
      necessary: true,
      external: false,
      updated: Date.now(),
      ...getConsent(),
      ...partial,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyConsent(next);
    window.dispatchEvent(new CustomEvent('consent-updated', { detail: next }));
    hideBanner();
    hideSettings();
  }

  function hasChosen() {
    return Boolean(getConsent());
  }

  window.hasExternalConsent = function hasExternalConsent() {
    const c = getConsent();
    return Boolean(c && c.external);
  };

  window.openCookieSettings = function openCookieSettings() {
    showSettings();
  };

  function loadFonts() {
    if (fontsLoaded) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    document.head.appendChild(link);
    document.documentElement.classList.add('fonts-loaded');
    fontsLoaded = true;
  }

  function applyMaps(enabled) {
    document.querySelectorAll('[data-google-maps-src]').forEach((iframe) => {
      const wrap = iframe.closest('.map-consent-wrap');
      const placeholder = wrap?.querySelector('[data-map-placeholder]');
      if (enabled) {
        if (!iframe.src) iframe.src = iframe.dataset.googleMapsSrc;
        iframe.hidden = false;
        if (placeholder) placeholder.hidden = true;
      } else {
        iframe.removeAttribute('src');
        iframe.hidden = true;
        if (placeholder) placeholder.hidden = false;
      }
    });
  }

  function applyConsent(consent) {
    if (consent.external) {
      loadFonts();
      applyMaps(true);
    } else {
      applyMaps(false);
    }
    syncToggleInputs(consent);
  }

  function syncToggleInputs(consent) {
    const ext = document.getElementById('consentExternal');
    if (ext) ext.checked = Boolean(consent.external);
  }

  function hideBanner() {
    const b = document.getElementById('consentBanner');
    if (b) b.hidden = true;
    window.dispatchEvent(new CustomEvent('consent-banner-closed'));
    emitConsentSettled();
  }

  function showBanner() {
    const b = document.getElementById('consentBanner');
    if (b) b.hidden = false;
  }

  window.isConsentBannerVisible = function isConsentBannerVisible() {
    const b = document.getElementById('consentBanner');
    return Boolean(b && !b.hidden);
  };

  window.isConsentSettingsVisible = function isConsentSettingsVisible() {
    const s = document.getElementById('consentSettings');
    return Boolean(s && !s.hidden);
  };

  function isConsentUiBlocking() {
    return window.isConsentBannerVisible() || window.isConsentSettingsVisible();
  }

  function emitConsentSettled() {
    if (!isConsentUiBlocking()) {
      window.dispatchEvent(new CustomEvent('consent-settled'));
    }
  }

  /**
   * Callback wenn Cookie-Banner und Einstellungen-Dialog geschlossen sind.
   * @param {Function} callback
   * @param {number} delayMs Pause danach (z. B. bevor Neuigkeiten-Popup)
   */
  window.whenConsentSettled = function whenConsentSettled(callback, delayMs = 500) {
    const run = () => window.setTimeout(callback, delayMs);

    const tryRun = () => {
      if (!isConsentUiBlocking()) run();
    };

    if (!isConsentUiBlocking()) {
      tryRun();
      return;
    }

    window.addEventListener('consent-settled', tryRun, { once: true });
    window.addEventListener('consent-updated', tryRun, { once: true });
  };

  function hideSettings() {
    const s = document.getElementById('consentSettings');
    if (s) s.hidden = true;
    document.body.classList.remove('consent-settings-open');
    emitConsentSettled();
  }

  function showSettings() {
    const s = document.getElementById('consentSettings');
    if (s) {
      syncToggleInputs(getConsent() || { external: false });
      s.hidden = false;
      document.body.classList.add('consent-settings-open');
      s.querySelector('.consent-settings-panel')?.focus?.();
    }
  }

  function injectUi() {
    if (document.getElementById('consentBanner')) return;

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div id="consentBanner" class="consent-banner" role="region" aria-labelledby="consentBannerTitle" hidden>
        <div class="consent-banner-inner card">
          <h2 id="consentBannerTitle">Datenschutz & Cookies</h2>
          <p class="consent-lead">
            Wir setzen <strong>kein Tracking</strong> ein und verkaufen keine Daten.
            Gespeichert werden nur das, was du uns aktiv gibst (z.&nbsp;B. Terminbuchung)
            sowie technische Einstellungen auf deinem Gerät.
          </p>
          <ul class="consent-list">
            <li><strong>Notwendig:</strong> Cookie-Einstellungen, Hinweis zu Neuigkeiten (lokal im Browser)</li>
            <li><strong>Optional:</strong> Google Maps &amp; Google Fonts (Datenübertragung in die USA möglich)</li>
          </ul>
          <p class="note">
            Terminbuchungen werden auf unserem Server gespeichert und können mit dem
            <strong>Google Kalender der Praxis</strong> synchronisiert werden (nicht auf deinem Gerät).
            <a href="/datenschutz">Datenschutzerklärung</a>
          </p>
          <div class="consent-actions">
            <button type="button" class="btn primary" data-consent-all>Alle akzeptieren</button>
            <button type="button" class="btn outline" data-consent-essential>Nur notwendige</button>
            <button type="button" class="btn outline" data-consent-settings>Einstellungen</button>
          </div>
        </div>
      </div>
      <div id="consentSettings" class="consent-settings" role="dialog" aria-modal="true" aria-labelledby="consentSettingsTitle" hidden>
        <div class="consent-settings-backdrop" data-consent-close-settings></div>
        <div class="consent-settings-panel card" tabindex="-1">
          <button type="button" class="consent-settings-close" data-consent-close-settings aria-label="Schließen">&times;</button>
          <h2 id="consentSettingsTitle">Cookie-Einstellungen</h2>
          <div class="consent-option">
            <label><input type="checkbox" checked disabled> Notwendig</label>
            <p class="note">Speichert deine Auswahl und ob du den Neuigkeiten-Hinweis schon gesehen hast. Ohne Tracking.</p>
          </div>
          <div class="consent-option">
            <label><input type="checkbox" id="consentExternal"> Externe Medien (Google)</label>
            <p class="note">Google Maps auf Kontakt- und Angebotsseiten sowie Schriftarten von Google Fonts.</p>
          </div>
          <div class="consent-actions">
            <button type="button" class="btn primary" data-consent-save>Auswahl speichern</button>
          </div>
          <p class="note" style="margin-top:1rem"><a href="/datenschutz">Datenschutzerklärung</a> · <a href="/impressum">Impressum</a></p>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    document.querySelector('[data-consent-all]')?.addEventListener('click', () => {
      saveConsent({ external: true });
    });
    document.querySelector('[data-consent-essential]')?.addEventListener('click', () => {
      saveConsent({ external: false });
    });
    document.querySelector('[data-consent-settings]')?.addEventListener('click', showSettings);
    document.querySelector('[data-consent-save]')?.addEventListener('click', () => {
      saveConsent({ external: document.getElementById('consentExternal')?.checked || false });
    });
    document.querySelectorAll('[data-consent-close-settings]').forEach((el) => {
      el.addEventListener('click', hideSettings);
    });

    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-enable-maps]')) {
        saveConsent({ external: true });
      }
    });
  }

  function injectFooterLink() {
    document.querySelectorAll('.legal-footer').forEach((footer) => {
      if (footer.querySelector('[data-cookie-settings]')) return;
      const sep = footer.textContent.trim().endsWith('·') ? ' ' : ' · ';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'footer-link-btn';
      btn.dataset.cookieSettings = '1';
      btn.textContent = 'Cookie-Einstellungen';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showSettings();
      });
      footer.appendChild(document.createTextNode(sep));
      footer.appendChild(btn);
    });
  }

  function init() {
    injectUi();
    injectFooterLink();

    const existing = getConsent();
    if (existing) {
      applyConsent(existing);
      hideBanner();
    } else {
      showBanner();
    }

    window.__consentReady = true;
    window.dispatchEvent(
      new CustomEvent('consent-ready', {
        detail: existing || { necessary: true, external: false },
      })
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
