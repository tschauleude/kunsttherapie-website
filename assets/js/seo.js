/**
 * Strukturierte Daten (Schema.org) für lokale Suche – alle öffentlichen Seiten.
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const origin = 'https://kunsttherapie.mkmpb.de';
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const pageUrl = origin + (path === '/' ? '/' : path);
  const lang = document.documentElement.lang === 'en' ? 'en-GB' : 'de-DE';
  const ogImage = origin + '/assets/img/Gruppen-und-Einzeltherapie-768x524.jpg';

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': origin + '/#atelier',
    name: 'Kunsttherapie Paderborn',
    description:
      'Psychosoziale und klinische Kunsttherapie in Paderborn: Gruppen Dienstag morgens, Auszeit Donnerstag abends, Einzelsitzungen und Teambuilding.',
    url: origin + '/',
    image: ogImage,
    telephone: '+49-5251-690111',
    email: 'info@kunsttherapie-pb.de',
    priceRange: '€€',
    areaServed: {
      '@type': 'City',
      name: 'Paderborn',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Otto-Stadler-Straße 23c',
      addressLocality: 'Paderborn',
      postalCode: '33102',
      addressCountry: 'DE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 51.7189,
      longitude: 8.7575,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Tuesday',
        opens: '11:00',
        closes: '12:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Thursday',
        opens: '18:00',
        closes: '19:30',
      },
    ],
    employee: {
      '@type': 'Person',
      name: 'Martina Schwierzke',
      jobTitle: 'Psychosoziale und klinische Kunsttherapeutin',
    },
    sameAs: [],
  };

  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageUrl + '#webpage',
    url: pageUrl,
    name: document.title,
    description:
      document.querySelector('meta[name="description"]')?.getAttribute('content') || undefined,
    isPartOf: { '@id': origin + '/#website' },
    about: { '@id': origin + '/#atelier' },
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
    publisher: { '@id': origin + '/#atelier' },
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [website, localBusiness, webPage],
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
