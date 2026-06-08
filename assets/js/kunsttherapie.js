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
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  document.addEventListener('kt-lang-change', window.ktUpdateToggleLabels);

  function stripHtml(html) {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.textContent.replace(/\s+/g, ' ').trim();
  }

  function updateFaqSchema() {
    if (!window.ktI18n) return;
    const t = window.ktI18n.t.bind(window.ktI18n);
    const mainEntity = [];

    for (let i = 1; i <= 12; i += 1) {
      const name = t(`kt.faq${i}.q`);
      const answerHtml = t(`kt.faq${i}.a`);
      if (!name || !answerHtml) continue;
      mainEntity.push({
        '@type': 'Question',
        name,
        acceptedAnswer: {
          '@type': 'Answer',
          text: stripHtml(answerHtml),
        },
      });
    }

    if (!mainEntity.length) return;

    let script = document.getElementById('kt-faq-schema');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'kt-faq-schema';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${window.location.origin}${window.location.pathname.replace(/\/$/, '') || '/kunsttherapie'}#faq`,
      inLanguage: document.documentElement.lang === 'en' ? 'en-GB' : 'de-DE',
      mainEntity,
    });
  }

  document.addEventListener('kt-lang-change', updateFaqSchema);
  window.setTimeout(updateFaqSchema, 0);
})();
