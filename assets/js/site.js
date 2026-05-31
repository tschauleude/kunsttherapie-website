/**
 * Gemeinsame UI: Skip-Link, Mobile-Menü, dynamische Navigation.
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const NAV_PATHS = {
    'ueber-mich': 'ansatz',
    kunsttherapie: 'kunsttherapie',
    buchung: 'termin',
    kontakt: 'kontakt',
    neuigkeiten: 'neuigkeiten',
    events: 'events',
    preise: 'preise',
    impressum: 'impressum',
    datenschutz: 'datenschutz',
    index: 'home',
  };

  /** Startseite: Abschnitt → Nav-Schlüssel */
  const HOME_SECTIONS = [
    { id: 'neuigkeiten', nav: 'neuigkeiten' },
    { id: 'angebote', nav: 'kunsttherapie' },
    { id: 'praxis', nav: 'praxis' },
  ];

  function currentNavKey() {
    const path = window.location.pathname.replace(/\/$/, '');
    if (path === '' || path.endsWith('/index') || path.endsWith('/index.html')) return 'home';
    const base = path.split('/').pop().replace(/\.html$/, '');
    return NAV_PATHS[base] || null;
  }

  function setActiveNav(key) {
    document.querySelectorAll('nav[data-site-nav] a[data-nav]').forEach((link) => {
      const active = Boolean(key && link.dataset.nav === key);
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function markCurrentNav() {
    const pageKey = currentNavKey();
    if (pageKey !== 'home') {
      setActiveNav(pageKey);
      return;
    }

    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const match = HOME_SECTIONS.find((s) => s.id === hash);
      if (match) {
        setActiveNav(match.nav);
        return;
      }
    }

    updateHomeScrollNav();
  }

  function updateHomeScrollNav() {
    if (currentNavKey() !== 'home') return;

    const headerOffset = 100;
    const scrollPos = window.scrollY + headerOffset;

    if (scrollPos < 180) {
      setActiveNav(null);
      return;
    }

    let activeNav = null;
    HOME_SECTIONS.forEach(({ id, nav }) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.offsetTop <= scrollPos) {
        activeNav = nav;
      }
    });

    setActiveNav(activeNav);
  }

  function initHomeScrollSpy() {
    if (currentNavKey() !== 'home') return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateHomeScrollNav();
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', markCurrentNav);
  }

  function initSkipLink() {
    if (document.querySelector('.skip-link')) return;
    const main = document.querySelector('main');
    if (!main) return;
    if (!main.id) main.id = 'main';

    const skip = document.createElement('a');
    skip.href = '#main';
    skip.className = 'skip-link';
    skip.textContent = 'Zum Inhalt springen';
    document.body.prepend(skip);
  }

  function initMobileNav() {
    const header = document.querySelector('header .header-inner');
    const nav = document.querySelector('nav[data-site-nav]');
    if (!header || !nav || header.querySelector('.nav-toggle')) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'site-nav');
    toggle.innerHTML =
      '<span class="nav-toggle-bar" aria-hidden="true"></span><span class="nav-toggle-label">Menü</span>';

    const navId = nav.id || 'site-nav';
    nav.id = navId;
    toggle.setAttribute('aria-controls', navId);

    header.insertBefore(toggle, nav);

    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  function setFooterYear() {
    const y = String(new Date().getFullYear());
    document.querySelectorAll('#y, #year').forEach((el) => {
      el.textContent = y;
    });
  }

  function init() {
    initSkipLink();
    initMobileNav();
    markCurrentNav();
    initHomeScrollSpy();
    setFooterYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
