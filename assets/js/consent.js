/**
 * DSGVO: Einwilligung für externe Dienste (Google Maps).
 * Notwendig: Einstellungen + Neuigkeiten-Hinweis (localStorage, keine Tracking-Cookies).
 */
(function () {
  const STORAGE_KEY = 'kunsttherapie_consent_v1';

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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      /* private mode / quota – UI trotzdem aktualisieren */
    }
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
    applyMaps(Boolean(consent.external));
    syncToggleInputs(consent);
  }

  function syncToggleInputs(consent) {
    const ext = document.getElementById('consentExternal');
    if (ext) ext.checked = Boolean(consent.external);
  }

  let bannerResizeObserver = null;

  function updateBannerOffset() {
    const b = document.getElementById('consentBanner');
    const visible = Boolean(b && !b.hidden);
    if (!visible) {
      document.body.classList.remove('consent-banner-visible');
      document.body.style.removeProperty('--consent-banner-offset');
      bannerResizeObserver?.disconnect();
      bannerResizeObserver = null;
      return;
    }

    const inner = b.querySelector('.consent-banner-inner');
    const bannerStyle = inner ? getComputedStyle(b) : null;
    const pad =
      (bannerStyle ? parseFloat(bannerStyle.paddingBottom) + parseFloat(bannerStyle.paddingTop) : 0) || 16;
    const height = inner ? Math.ceil(inner.getBoundingClientRect().height + pad) : 176;

    document.body.classList.add('consent-banner-visible');
    document.body.style.setProperty('--consent-banner-offset', `${height}px`);

    if (inner && !bannerResizeObserver) {
      bannerResizeObserver = new ResizeObserver(() => updateBannerOffset());
      bannerResizeObserver.observe(inner);
    }
  }

  function hideBanner() {
    const b = document.getElementById('consentBanner');
    if (b) b.hidden = true;
    updateBannerOffset();
    window.dispatchEvent(new CustomEvent('consent-banner-closed'));
    emitConsentSettled();
  }

  function showBanner() {
    const b = document.getElementById('consentBanner');
    if (b) b.hidden = false;
    requestAnimationFrame(updateBannerOffset);
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

  let settingsBusy = false;

  function hideSettings() {
    const s = document.getElementById('consentSettings');
    if (!s || s.hidden) {
      emitConsentSettled();
      return;
    }
    if (settingsBusy) return;
    settingsBusy = true;

    const finish = () => {
      document.body.classList.remove('consent-settings-open');
      settingsBusy = false;
      emitConsentSettled();
    };

    if (window.flowMotion) {
      window.flowMotion.close(s, 'consent-settings-visible').then(finish);
      return;
    }
    s.classList.remove('consent-settings-visible');
    s.hidden = true;
    finish();
  }

  function showSettings() {
    const s = document.getElementById('consentSettings');
    if (!s || settingsBusy) return;
    if (!s.hidden) return;

    settingsBusy = true;
    syncToggleInputs(getConsent() || { external: false });

    const focusPanel = () => {
      document.body.classList.add('consent-settings-open');
      settingsBusy = false;
      s.querySelector('.consent-settings-panel')?.focus?.();
    };

    if (window.flowMotion) {
      window.flowMotion.open(s, 'consent-settings-visible').then(focusPanel);
      return;
    }
    s.hidden = false;
    s.classList.add('consent-settings-visible');
    focusPanel();
  }

  function tr(key) {
    const v = window.ktI18n?.t(key);
    return v != null ? v : '';
  }

  function consentMarkup() {
    const close = tr('btn.close') || 'Schließen';
    return `
      <div id="consentBanner" class="consent-banner" role="region" aria-labelledby="consentBannerTitle" hidden>
        <div class="consent-banner-inner card">
          <h2 id="consentBannerTitle">${tr('consent.banner.title')}</h2>
          <p class="consent-lead">${tr('consent.lead')}</p>
          <ul class="consent-list">${tr('consent.list')}</ul>
          <p class="note">${tr('consent.note')}</p>
          <div class="consent-actions">
            <button type="button" class="btn primary" data-consent-all>${tr('consent.acceptAll')}</button>
            <button type="button" class="btn primary" data-consent-essential>${tr('consent.essential')}</button>
            <button type="button" class="btn outline" data-consent-settings>${tr('consent.settings')}</button>
          </div>
        </div>
      </div>
      <div id="consentSettings" class="consent-settings" role="dialog" aria-modal="true" aria-labelledby="consentSettingsTitle" hidden>
        <div class="consent-settings-backdrop" data-consent-close-settings></div>
        <div class="consent-settings-panel card" tabindex="-1">
          <button type="button" class="consent-settings-close" data-consent-close-settings aria-label="${close}">&times;</button>
          <h2 id="consentSettingsTitle">${tr('consent.settingsTitle')}</h2>
          <div class="consent-option">
            <label><input type="checkbox" checked disabled> <span>${tr('consent.necessary')}</span></label>
            <p class="note">${tr('consent.necessaryNote')}</p>
          </div>
          <div class="consent-option">
            <label><input type="checkbox" id="consentExternal"> <span>${tr('consent.external')}</span></label>
            <p class="note">${tr('consent.externalNote')}</p>
          </div>
          <div class="consent-actions">
            <button type="button" class="btn primary" data-consent-save>${tr('consent.save')}</button>
          </div>
          <p class="note" style="margin-top:1rem">${tr('consent.legalLinks')}</p>
        </div>
      </div>
    `;
  }

  function applyConsentI18n() {
    const title = document.getElementById('consentBannerTitle');
    if (!title) return;

    const close = tr('btn.close') || 'Schließen';
    const setHtml = (sel, key) => {
      const el = document.querySelector(sel);
      const val = tr(key);
      if (el && val != null) el.innerHTML = val;
    };
    const setText = (sel, key) => {
      const el = document.querySelector(sel);
      const val = tr(key);
      if (el && val != null) el.textContent = val;
    };

    setText('#consentBannerTitle', 'consent.banner.title');
    setHtml('#consentBanner .consent-lead', 'consent.lead');
    setHtml('#consentBanner .consent-list', 'consent.list');
    setHtml('#consentBanner .consent-banner-inner > .note', 'consent.note');
    setText('[data-consent-all]', 'consent.acceptAll');
    setText('[data-consent-essential]', 'consent.essential');
    setText('[data-consent-settings]', 'consent.settings');
    setText('#consentSettingsTitle', 'consent.settingsTitle');
    setText('#consentSettings .consent-option:nth-of-type(1) label span', 'consent.necessary');
    setHtml('#consentSettings .consent-option:nth-of-type(1) .note', 'consent.necessaryNote');
    setText('#consentSettings .consent-option:nth-of-type(2) label span', 'consent.external');
    setHtml('#consentSettings .consent-option:nth-of-type(2) .note', 'consent.externalNote');
    setText('[data-consent-save]', 'consent.save');
    setHtml('#consentSettings .consent-settings-panel > .note', 'consent.legalLinks');

    const closeBtn = document.querySelector('.consent-settings-close');
    if (closeBtn) closeBtn.setAttribute('aria-label', close);
  }

  function bindConsentUi(wrap) {
    wrap.querySelector('[data-consent-all]')?.addEventListener('click', () => {
      saveConsent({ external: true });
    });
    wrap.querySelector('[data-consent-essential]')?.addEventListener('click', () => {
      saveConsent({ external: false });
    });
    wrap.querySelector('[data-consent-settings]')?.addEventListener('click', showSettings);
    wrap.querySelector('[data-consent-save]')?.addEventListener('click', () => {
      saveConsent({ external: document.getElementById('consentExternal')?.checked || false });
    });
    wrap.querySelectorAll('[data-consent-close-settings]').forEach((el) => {
      el.addEventListener('click', hideSettings);
    });
  }

  function injectUi() {
    if (document.getElementById('consentBanner')) return;

    const wrap = document.createElement('div');
    wrap.innerHTML = consentMarkup();
    document.body.appendChild(wrap);

    bindConsentUi(wrap);

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
      btn.textContent = tr('consent.footerLink') || 'Cookie-Einstellungen';
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

  document.addEventListener('kt-lang-change', () => {
    if (document.getElementById('consentBanner')) applyConsentI18n();
    document.querySelectorAll('[data-cookie-settings]').forEach((btn) => {
      btn.textContent = tr('consent.footerLink') || 'Cookie-Einstellungen';
    });
    updateBannerOffset();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    window.setTimeout(init, 0);
  }
})();
