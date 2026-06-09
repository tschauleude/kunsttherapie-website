/**
 * Angebots-Karten: „Mehr erfahren“ klappt die Beschreibung in der Karte auf.
 */
(function () {
  const FLOW_MS = 620;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function animateOfferBody(body, open) {
    if (prefersReducedMotion()) {
      body.hidden = !open;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (!open) body.hidden = true;
        body.style.cssText = '';
        resolve();
      };

      const onEnd = (e) => {
        if (e.propertyName !== 'max-height') return;
        body.removeEventListener('transitionend', onEnd);
        finish();
      };
      body.addEventListener('transitionend', onEnd);

      if (open) {
        body.hidden = false;
        body.style.overflow = 'hidden';
        body.style.maxHeight = '0px';
        body.style.opacity = '0';
        requestAnimationFrame(() => {
          body.style.maxHeight = `${body.scrollHeight}px`;
          body.style.opacity = '1';
        });
      } else {
        body.style.overflow = 'hidden';
        body.style.maxHeight = `${body.scrollHeight}px`;
        body.style.opacity = '1';
        requestAnimationFrame(() => {
          body.style.maxHeight = '0px';
          body.style.opacity = '0';
        });
      }

      window.setTimeout(finish, FLOW_MS + 100);
    });
  }

  function initOfferToggles() {
    const root =
      document.querySelector('.page-kunsttherapie') ||
      document.querySelector('[data-i18n-page="therapy"]');
    if (!root) return;

    const offersWrap = root.querySelector('.kt-offers');
    if (!offersWrap || offersWrap.dataset.ktToggleBound === '1') return;
    offersWrap.dataset.ktToggleBound = '1';

    let toggling = false;

    function labelLearn() {
      return window.ktI18n ? window.ktI18n.t('btn.learnMore') : 'Mehr erfahren';
    }

    function labelLess() {
      return window.ktI18n ? window.ktI18n.t('btn.less') : 'Weniger';
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

      const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      window.scrollTo({ top: target, behavior });
    }

    function syncOffersLayout() {
      const anyOpen = offersWrap.querySelector('[data-offer].is-open');
      offersWrap.classList.toggle('kt-offers--has-open', !!anyOpen);
    }

    function resetToggles() {
      root.querySelectorAll('[data-offer] .kt-toggle').forEach((t) => {
        t.setAttribute('aria-expanded', 'false');
        t.textContent = labelLearn();
      });
    }

    window.ktUpdateToggleLabels = function () {
      root.querySelectorAll('[data-offer] .kt-toggle').forEach((t) => {
        const open = t.getAttribute('aria-expanded') === 'true';
        t.textContent = open ? labelLess() : labelLearn();
      });
    };

    async function toggleOffer(card, toggle) {
      if (toggling) return;
      const body = card.querySelector('.kt-offer-body');
      if (!body) return;

      toggling = true;
      const wasOpen = toggle.getAttribute('aria-expanded') === 'true';

      for (const openCard of [...root.querySelectorAll('[data-offer].is-open')]) {
        const openBody = openCard.querySelector('.kt-offer-body');
        const openToggle = openCard.querySelector('.kt-toggle');
        if (openToggle) {
          openToggle.setAttribute('aria-expanded', 'false');
          openToggle.textContent = labelLearn();
        }
        openCard.classList.remove('is-open');
        if (openBody && !openBody.hidden) {
          await animateOfferBody(openBody, false);
        }
      }

      if (!wasOpen) {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.textContent = labelLess();
        card.classList.add('is-open');
        await animateOfferBody(body, true);
        requestAnimationFrame(() => scrollOfferIntoView(card));
      } else {
        resetToggles();
      }

      syncOffersLayout();
      toggling = false;
    }

    let lastTouchToggleAt = 0;

    function handleToggleActivate(toggle) {
      const card = toggle.closest('[data-offer]');
      if (!card) return;
      toggleOffer(card, toggle);
    }

    offersWrap.addEventListener('click', (e) => {
      const toggle = e.target.closest('.kt-toggle');
      if (!toggle || !offersWrap.contains(toggle)) return;
      if (Date.now() - lastTouchToggleAt < 280) return;
      e.preventDefault();
      handleToggleActivate(toggle);
    });

    offersWrap.addEventListener(
      'touchend',
      (e) => {
        const toggle = e.target.closest('.kt-toggle');
        if (!toggle || !offersWrap.contains(toggle)) return;
        e.preventDefault();
        lastTouchToggleAt = Date.now();
        handleToggleActivate(toggle);
      },
      { passive: false }
    );
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
