/**
 * Angebots-Karten: „Mehr erfahren“ klappt die Beschreibung in der Karte auf.
 */
(function () {
  const root =
    document.querySelector('.page-kunsttherapie') ||
    document.querySelector('[data-i18n-page="therapy"]');
  if (!root) return;

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
    const top = window.scrollY + card.getBoundingClientRect().top - headerH - 12;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const target = Math.max(0, Math.min(top, maxScroll - bannerH * 0.35));
    window.scrollTo({ top: target, behavior: 'smooth' });
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

  root.querySelectorAll('[data-offer]').forEach((card) => {
    const toggle = card.querySelector('.kt-toggle');
    const body = card.querySelector('.kt-offer-body');
    if (!toggle || !body) return;

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      resetToggles();
      root.querySelectorAll('[data-offer] .kt-offer-body').forEach((b) => {
        b.hidden = true;
      });
      root.querySelectorAll('[data-offer]').forEach((c) => c.classList.remove('is-open'));

      if (!open) {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.textContent = labelLess();
        body.hidden = false;
        card.classList.add('is-open');
        scrollOfferIntoView(card);
      }
    });
  });

  document.addEventListener('kt-lang-change', window.ktUpdateToggleLabels);
})();
