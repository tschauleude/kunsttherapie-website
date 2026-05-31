/**
 * Gemeinsame UI: Skip-Link, Mobile-Menü, aktuelle Navigation.
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

  function currentNavKey() {
    const path = window.location.pathname.replace(/\/$/, '');
    if (path === '' || path.endsWith('/index') || path.endsWith('/index.html')) return 'home';
    const base = path.split('/').pop().replace(/\.html$/, '');
    return NAV_PATHS[base] || null;
  }

  function markCurrentNav() {
    const key = currentNavKey();
    if (!key) return;

    document.querySelectorAll('nav[data-site-nav] a[data-nav]').forEach((link) => {
      if (link.dataset.nav === key) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
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
    toggle.innerHTML = '<span class="nav-toggle-bar" aria-hidden="true"></span><span class="nav-toggle-label">Menü</span>';

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
    setFooterYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
