/**
 * Angebots-Karten: native <details> + Akkordeon (nur eine Karte offen).
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

    function updateLabel(details) {
      const label = details.querySelector('.kt-toggle-label');
      if (!label) return;
      label.textContent = details.open ? labelLess() : labelLearn();
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

    window.ktUpdateToggleLabels = function () {
      offers.forEach(updateLabel);
    };

    offers.forEach((details) => {
      updateLabel(details);

      details.addEventListener('toggle', () => {
        updateLabel(details);

        if (details.open) {
          offers.forEach((other) => {
            if (other !== details && other.open) other.open = false;
          });
          requestAnimationFrame(() => scrollOfferIntoView(details));
        }

        syncOffersLayout();
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
