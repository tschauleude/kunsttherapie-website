/**
 * Angebots-Karten: <details> + eigener Toggle-Button + Akkordeon.
 */
(function () {
  function initOfferToggles() {
    const root =
      document.querySelector('.page-kunsttherapie') ||
      document.querySelector('[data-i18n-page="therapy"]');
    if (!root) return;

    const offersWrap = root.querySelector('.kt-offers');
    if (!offersWrap || offersWrap.dataset.ktToggleBound === '1') return;
    offersWrap.dataset.ktToggleBound = '1';

    const offers = [...offersWrap.querySelectorAll('details[data-offer]')];
    if (!offers.length) return;

    function labelLearn() {
      const v = window.ktI18n?.t('btn.learnMore');
      return v || 'Mehr erfahren';
    }

    function labelLess() {
      const v = window.ktI18n?.t('btn.less');
      return v || 'Weniger';
    }

    function ensureOfferBody(details) {
      const body = details.querySelector('.kt-offer-body');
      if (!body || body.textContent.trim()) return;
      const key = body.getAttribute('data-i18n-html');
      if (!key) return;
      const html = window.ktI18n?.t(key);
      if (html) body.innerHTML = html;
    }

    function updateToggle(details) {
      const btn = details.querySelector('.kt-offer-toggle');
      if (!btn) return;
      const text = details.open ? labelLess() : labelLearn();
      btn.textContent = text || (details.open ? 'Weniger' : 'Mehr erfahren');
      btn.setAttribute('aria-expanded', details.open ? 'true' : 'false');
    }

    function scrollOfferIntoView(card) {
      const header = document.querySelector('header');
      const headerH = header ? header.getBoundingClientRect().height : 0;
      const consent =
        typeof window.isConsentBannerVisible === 'function' && window.isConsentBannerVisible();
      const banner = consent ? document.querySelector('.consent-banner-inner') : null;
      const bannerH = banner ? banner.getBoundingClientRect().height : 0;
      const cardRect = card.getBoundingClientRect();
      const top = window.scrollY + cardRect.top - headerH - 12;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      let target = Math.max(0, Math.min(top, maxScroll));

      const visibleBottom = window.innerHeight - bannerH - 8;
      if (cardRect.bottom > visibleBottom) {
        target = Math.min(maxScroll, window.scrollY + cardRect.bottom - visibleBottom);
      }

      const behavior =
        window.matchMedia('(max-width: 768px), (prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth';
      window.scrollTo({ top: target, behavior });
    }

    function syncOffersLayout() {
      const anyOpen = offersWrap.querySelector('details[data-offer][open]');
      offersWrap.classList.toggle('kt-offers--has-open', !!anyOpen);
    }

    function closeOthers(except) {
      offers.forEach((other) => {
        if (other !== except && other.open) other.open = false;
      });
    }

    function setOpen(details, open) {
      ensureOfferBody(details);
      if (open) {
        closeOthers(details);
        details.open = true;
        requestAnimationFrame(() => scrollOfferIntoView(details));
      } else {
        details.open = false;
      }
      updateToggle(details);
      syncOffersLayout();
    }

    window.ktUpdateToggleLabels = function () {
      offers.forEach((details) => {
        ensureOfferBody(details);
        updateToggle(details);
      });
    };

    offers.forEach((details) => {
      ensureOfferBody(details);
      updateToggle(details);

      const btn = details.querySelector('.kt-offer-toggle');
      btn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(details, !details.open);
      });

      details.addEventListener('toggle', () => {
        ensureOfferBody(details);
        if (details.open) closeOthers(details);
        updateToggle(details);
        syncOffersLayout();
        if (details.open) requestAnimationFrame(() => scrollOfferIntoView(details));
      });
    });

    syncOffersLayout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOfferToggles);
  } else {
    initOfferToggles();
  }

  document.addEventListener('kt-lang-change', () => {
    if (typeof window.ktUpdateToggleLabels === 'function') window.ktUpdateToggleLabels();
  });
})();

/**
 * FAQ JSON-LD aus aktuellen i18n-Texten (inkl. Admin-Overrides).
 */
(function () {
  const schemaEl = document.getElementById('kt-faq-schema');
  if (!schemaEl) return;

  function tr(key) {
    return window.ktI18n?.t(key) ?? null;
  }

  function faqPlainText(html) {
    const box = document.createElement('div');
    box.innerHTML = html || '';
    return box.textContent.replace(/\s+/g, ' ').trim();
  }

  function updateFaqSchema() {
    if (!window.ktI18n) return;
    const lang = window.ktI18n.getLang();
    const mainEntity = [];

    for (let i = 1; i <= 12; i += 1) {
      const q = tr(`kt.faq${i}.q`);
      const aHtml = tr(`kt.faq${i}.a`);
      if (!q || !aHtml) continue;
      mainEntity.push({
        '@type': 'Question',
        name: q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faqPlainText(aHtml),
        },
      });
    }

    if (!mainEntity.length) return;

    const origin = window.location.origin || 'https://kunsttherapie.mkmpb.de';
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${origin}${window.location.pathname}#faq`,
      inLanguage: lang === 'en' ? 'en' : 'de',
      mainEntity,
    };
    schemaEl.textContent = JSON.stringify(schema);
  }

  document.addEventListener('kt-lang-change', updateFaqSchema);
  document.addEventListener('DOMContentLoaded', () => {
    window.setTimeout(updateFaqSchema, 0);
  });
})();
