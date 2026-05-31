/**
 * Zweisprachigkeit DE / EN – data-i18n, data-i18n-html, localStorage.
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const STORAGE_KEY = 'kt-lang';
  const DEFAULT_LANG = 'de';

  function getMessages() {
    return window.I18N_MESSAGES || { de: {}, en: {} };
  }

  function detectLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'de' || stored === 'en') return stored;
    const browser = (navigator.language || '').toLowerCase();
    if (browser.startsWith('en')) return 'en';
    return DEFAULT_LANG;
  }

  let currentLang = detectLang();

  function t(key) {
    const msgs = getMessages()[currentLang] || {};
    if (msgs[key] != null) return msgs[key];
    const fallback = getMessages().de[key];
    return fallback != null ? fallback : null;
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'de';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val == null) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('placeholder')) el.placeholder = val;
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

    document.querySelectorAll('[data-lang]').forEach((btn) => {
      const active = btn.getAttribute('data-lang') === currentLang;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('is-active', active);
    });

    document.dispatchEvent(new CustomEvent('kt-lang-change', { detail: { lang: currentLang } }));
  }

  function setLang(lang) {
    if (lang !== 'de' && lang !== 'en') return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
    if (window.ktUpdateToggleLabels) window.ktUpdateToggleLabels();
  }

  window.ktI18n = { t, setLang, getLang: () => currentLang, apply: applyTranslations };

  document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
  });
})();
