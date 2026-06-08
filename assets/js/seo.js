/**
 * Strukturierte Daten (Schema.org) für lokale Suche – WebPage/WebSite (LocalBusiness statisch im HTML).
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const origin = 'https://kunsttherapie.mkmpb.de';
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const pageUrl = origin + (path === '/' ? '/' : path);
  const lang = document.documentElement.lang === 'en' ? 'en-GB' : 'de-DE';
  const ogImage = origin + '/assets/img/Gruppen-und-Einzeltherapie-768x524.jpg';
  const localBusinessId = origin + '/#localbusiness';

  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageUrl + '#webpage',
    url: pageUrl,
    name: document.title,
    description:
      document.querySelector('meta[name="description"]')?.getAttribute('content') || undefined,
    isPartOf: { '@id': origin + '/#website' },
    about: { '@id': localBusinessId },
    inLanguage: lang,
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: ogImage,
    },
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': origin + '/#website',
    url: origin + '/',
    name: 'Kunsttherapie Paderborn',
    description: 'Website des Kunsttherapie-Ateliers in Paderborn',
    inLanguage: ['de-DE', 'en-GB'],
    publisher: { '@id': localBusinessId },
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [website, webPage],
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'kt-schema-org';
  script.textContent = JSON.stringify(graph);
  document.head.appendChild(script);

  document.addEventListener('kt-lang-change', function (e) {
    const nextLang = e.detail?.lang === 'en' ? 'en-GB' : 'de-DE';
    try {
      const data = JSON.parse(script.textContent);
      const page = data['@graph']?.find((n) => n['@type'] === 'WebPage');
      if (page) page.inLanguage = nextLang;
      script.textContent = JSON.stringify(data);
    } catch (_) {
      /* ignore */
    }
  });
})();
