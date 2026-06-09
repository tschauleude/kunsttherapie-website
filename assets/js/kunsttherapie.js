/**
 * Angebots-Karten: „Mehr erfahren“ klappt die Beschreibung in der Karte auf.
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

    function labelLearn() {
      return window.ktI18n ? window.ktI18n.t('btn.learnMore') : 'Mehr erfahren';
    }

    function labelLess() {
      return window.ktI18n ? window.ktI18n.t('btn.less') : 'Weniger';
    }

    function scrollOfferIntoView(card) {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      const header = document.querySelector('header');
      const headerH = header ? header.getBoundingClientRect().height : 0;
      const consent =
        typeof window.isConsentBannerVisible === 'function' && window.isConsentBannerVisible();
      const banner = consent ? document.querySelector('.consent-banner-inner') : null;
      const bannerH = banner ? banner.getBoundingClientRect().height + 12 : 0;
      const margin = isMobile ? 16 : 12;
      const cardRect = card.getBoundingClientRect();
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      let target = window.scrollY + cardRect.top - headerH - margin;
      target = Math.max(0, Math.min(target, maxScroll));

      const visibleBottom = window.innerHeight - bannerH - margin;
      if (cardRect.bottom > visibleBottom) {
        target = Math.min(
          maxScroll,
          window.scrollY + cardRect.bottom - visibleBottom
        );
      }

      const behavior =
        isMobile || window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth';
      window.scrollTo({ top: target, behavior });
    }

    function setCardOpen(card, open) {
      const body = card.querySelector('.kt-offer-body');
      const toggle = card.querySelector('.kt-toggle');
      if (!body || !toggle) return;

      body.hidden = !open;
      card.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? labelLess() : labelLearn();
    }

    function closeAllOffers() {
      root.querySelectorAll('[data-offer]').forEach((card) => setCardOpen(card, false));
    }

    window.ktUpdateToggleLabels = function () {
      root.querySelectorAll('[data-offer]').forEach((card) => {
        const toggle = card.querySelector('.kt-toggle');
        if (!toggle) return;
        const open = card.classList.contains('is-open');
        toggle.textContent = open ? labelLess() : labelLearn();
      });
    };

    function toggleOffer(card) {
      const willOpen = !card.classList.contains('is-open');
      closeAllOffers();
      if (willOpen) {
        setCardOpen(card, true);
        /* Doppel-rAF: Mobile braucht Layout nach hidden=false, bevor gescrollt wird */
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollOfferIntoView(card));
        });
      }
    }

    function onToggleActivate(e) {
      const toggle = e.target.closest('.kt-toggle');
      if (!toggle || !offersWrap.contains(toggle)) return;
      const card = toggle.closest('[data-offer]');
      if (!card) return;
      e.preventDefault();
      e.stopPropagation();
      toggleOffer(card);
    }

    /* Event-Delegation: ein Handler für alle Karten, auch nach DOM-Updates */
    offersWrap.addEventListener('click', onToggleActivate);
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
