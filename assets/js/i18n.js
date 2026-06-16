/**
 * Zweisprachigkeit DE / EN – data-i18n, data-i18n-html, Meta, Platzhalter.
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const STORAGE_KEY = 'kt-lang';
  const DEFAULT_LANG = 'de';
  const RENTED_COPY_PATTERN =
    /\b(angemietet\w*|gemietet\w*|gemiet\w*|vermiet\w*|untermiet\w*|miete\w*|mieter\w*|pacht\w*|rent(?:ed|ing|s|al)?|leas(?:ed|ing|e)?)\b/i;
  const RENTED_PREFIX_PATTERN =
    /\b(angemietet\w*|gemietet\w*|gemiet\w*|vermietet\w*|untermietet\w*|rented|leased|rental)\s+/gi;

  function getMessages() {
    return window.I18N_MESSAGES || { de: {}, en: {} };
  }

  function sanitizeRentedText(val) {
    if (typeof val !== 'string') return val;
    return val
      .replace(RENTED_PREFIX_PATTERN, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^\s*[-–—]\s*/, '')
      .trim();
  }

  function cleanMessage(val) {
    if (typeof val !== 'string') return val;
    const sanitized = sanitizeRentedText(val);
    return RENTED_COPY_PATTERN.test(sanitized) ? null : sanitized;
  }

  function scrubLoadedMessages() {
    const msgs = window.I18N_MESSAGES;
    if (!msgs) return;
    ['de', 'en'].forEach((lang) => {
      for (const [key, val] of Object.entries(msgs[lang] || {})) {
        const cleaned = cleanMessage(val);
        if (cleaned == null) delete msgs[lang][key];
        else msgs[lang][key] = cleaned;
      }
    });
  }

  async function loadOverrides() {
    try {
      const res = await fetch('/api/i18n/overrides', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();
      if (!window.I18N_MESSAGES) window.I18N_MESSAGES = { de: {}, en: {} };
      ['de', 'en'].forEach((lang) => {
        if (!data[lang] || typeof data[lang] !== 'object') return;
        for (const [key, val] of Object.entries(data[lang])) {
          const cleaned = cleanMessage(val);
          if (cleaned != null) window.I18N_MESSAGES[lang][key] = cleaned;
        }
      });
    } catch (_) {
      /* offline / static hosting without API */
    }
  }

  function detectLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'de' || stored === 'en') return stored;
    return DEFAULT_LANG;
  }

  let currentLang = detectLang();

  function t(key) {
    const msgs = getMessages()[currentLang] || {};
    if (msgs[key] != null) {
      const cleaned = cleanMessage(msgs[key]);
      if (cleaned != null) return cleaned;
    }
    const fallback = getMessages().de[key];
    if (fallback == null) return null;
    return cleanMessage(fallback);
  }

  function localeTag() {
    return currentLang === 'en' ? 'en-GB' : 'de-DE';
  }

  function applyMeta() {
    const page = document.body.dataset.i18nPage;
    if (!page) return;

    const title = t(`meta.${page}.title`);
    const desc = t(`meta.${page}.description`);
    if (title) document.title = title;
    if (desc) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', desc);
      document.querySelectorAll('meta[property="og:description"], meta[name="twitter:description"]').forEach((el) => {
        el.setAttribute('content', desc);
      });
    }
    if (title) {
      document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach((el) => {
        el.setAttribute('content', title);
      });
    }

    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', currentLang === 'en' ? 'en_GB' : 'de_DE');
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'de';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      if (el.hasAttribute('data-i18n-dynamic')) return;
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val == null) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('placeholder')) el.placeholder = val;
        else el.value = val;
      } else if (el.tagName === 'A' && el.querySelector('[data-i18n]')) {
        /* Link text lives in nested data-i18n span */
      } else {
        el.textContent = val;
      }
    });

    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      const val = t(key);
      if (val != null) el.innerHTML = val;
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      const val = t(key);
      if (val != null) el.title = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = t(key);
      if (val != null) el.placeholder = val;
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label');
      const val = t(key);
      if (val != null) el.setAttribute('aria-label', val);
    });

    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      const key = el.getAttribute('data-i18n-alt');
      const val = t(key);
      if (val != null) el.setAttribute('alt', val);
    });

    document.querySelectorAll('.lang-switch-btn[data-lang]').forEach((btn) => {
      const code = btn.getAttribute('data-lang');
      btn.textContent = code ? code.toUpperCase() : btn.textContent;
      const active = code === currentLang;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('is-active', active);
    });

    applyMeta();
    applyPageBindings();
    if (typeof window.ktInitEmailLinks === 'function') window.ktInitEmailLinks();
    document.dispatchEvent(new CustomEvent('kt-lang-change', { detail: { lang: currentLang } }));
  }

  function applyPageBindings() {
    const page = document.body.dataset.i18nPage;
    const bindings = window.I18N_PAGE_BINDINGS?.[page];
    if (!bindings || !bindings.length) return;

    bindings.forEach(({ sel, key, attr }) => {
      const val = t(key);
      if (val == null) return;
      document.querySelectorAll(sel).forEach((el) => {
        if (el.hasAttribute('data-i18n') || el.hasAttribute('data-i18n-html')) return;
        if (attr === 'html') el.innerHTML = val;
        else if (attr === 'placeholder') el.placeholder = val;
        else if (attr === 'title') el.title = val;
        else if (attr === 'aria-label') el.setAttribute('aria-label', val);
        else if (attr === 'alt') el.setAttribute('alt', val);
        else if (attr.startsWith('data-')) el.setAttribute(attr, val);
        else el.textContent = val;
      });
    });
  }

  function setLang(lang) {
    if (lang !== 'de' && lang !== 'en') return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
    if (window.ktUpdateToggleLabels) window.ktUpdateToggleLabels();
  }

  window.ktI18n = {
    t,
    setLang,
    getLang: () => currentLang,
    getLocale: localeTag,
    apply: applyTranslations,
  };

  async function boot() {
    scrubLoadedMessages();
    await loadOverrides();
    applyTranslations();
    if (typeof window.ktInitLangSwitch === 'function') {
      window.ktInitLangSwitch();
    }
    if (typeof window.ktApplySiteChrome === 'function') {
      window.ktApplySiteChrome();
    }
  }

  function scheduleBoot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        boot();
      });
      return;
    }
    /* Body-Skripte (z. B. site.js) laufen erst danach – einen Tick warten */
    window.setTimeout(boot, 0);
  }

  scheduleBoot();
})();
