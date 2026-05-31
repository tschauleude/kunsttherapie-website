/**
 * Strukturierte Daten (Schema.org) für lokale Suche – alle öffentlichen Seiten.
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const origin = 'https://kunsttherapie.mkmpb.de';
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const pageUrl = origin + (path === '/' ? '/' : path);

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': origin + '/#praxis',
    name: 'Kunsttherapie Paderborn – Martina Schwierzke',
    description:
      'Psychosoziale und klinische Kunsttherapie in Paderborn: Gruppen Dienstag morgens, Auszeit Donnerstag abends, Einzelsitzungen und Teambuilding.',
    url: origin + '/',
    image: origin + '/assets/img/Gruppen-und-Einzeltherapie-768x524.jpg',
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
        opens: '09:00',
        closes: '13:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Thursday',
        opens: '17:00',
        closes: '21:00',
      },
    ],
    founder: {
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
    about: { '@id': origin + '/#praxis' },
    inLanguage: 'de-DE',
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': origin + '/#website',
    url: origin + '/',
    name: 'Kunsttherapie Paderborn',
    description: 'Website der Kunsttherapie-Praxis Martina Schwierzke in Paderborn',
    inLanguage: 'de-DE',
    publisher: { '@id': origin + '/#praxis' },
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [website, localBusiness, webPage],
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(graph);
  document.head.appendChild(script);
})();
