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
    atelier: 'atelier',
    impressum: 'impressum',
    datenschutz: 'datenschutz',
    index: 'home',
  };

  /** Startseite: Abschnitt → Nav-Schlüssel */
  const HOME_SECTIONS = [
    { id: 'neuigkeiten', nav: 'neuigkeiten' },
    { id: 'angebote', nav: 'kunsttherapie' },
    { id: 'atelier', nav: 'praxis' },
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
    const hash = window.location.hash.replace('#', '');

    if (pageKey === 'kunsttherapie' && (hash === 'atelier' || hash === 'praxis')) {
      setActiveNav('praxis');
      return;
    }

    if (pageKey !== 'home') {
      setActiveNav(pageKey);
      return;
    }

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

  const CHROME_NAV = [
    ['ansatz', 'nav.ansatz'],
    ['kunsttherapie', 'nav.therapy'],
    ['praxis', 'nav.practice'],
    ['neuigkeiten', 'nav.news'],
    ['termin', 'nav.booking'],
    ['kontakt', 'nav.contact'],
  ];

  const CHROME_FOOTER = [
    ['.site-footer .footer-col:nth-child(1) h4', 'footer.practice'],
    ['.site-footer .footer-col:nth-child(1) p:nth-of-type(2)', 'footer.role'],
    ['.site-footer .footer-col:nth-child(2) h4', 'footer.contact'],
    ['.site-footer .footer-col:nth-child(3) h4', 'footer.offer'],
    ['.site-footer .footer-col:nth-child(3) a[href*="kunsttherapie"]', 'nav.therapy'],
    ['.site-footer .footer-col:nth-child(3) a[href*="buchung"]', 'btn.book'],
    ['.site-footer .footer-col:nth-child(3) a[href*="events"]', 'nav.events'],
    ['.site-footer .footer-col:nth-child(3) a[href*="neuigkeiten"]', 'nav.news'],
    ['.site-footer .footer-col:nth-child(3) a[href*="preise"]', 'footer.prices'],
    ['.site-footer .footer-col:nth-child(3) a[href*="atelier"]', 'footer.atelier'],
    ['.site-footer .footer-col:nth-child(4) h4', 'footer.legal'],
    ['.site-footer .footer-col:nth-child(4) a[href*="impressum"]', 'footer.imprint'],
    ['.site-footer .footer-col:nth-child(4) a[href*="datenschutz"]', 'footer.privacy'],
  ];

  function applySiteChrome() {
    if (!window.ktI18n) return;
    const t = window.ktI18n.t.bind(window.ktI18n);

    document.querySelectorAll('.skip-link').forEach((el) => {
      const v = t('a11y.skip');
      if (v) el.textContent = v;
    });

    document.querySelectorAll('.brand.logo-text .title').forEach((el) => {
      const v = t('brand.subtitle');
      if (v) el.textContent = v;
    });

    document.querySelectorAll('nav[data-site-nav]').forEach((nav) => {
      const label = t('nav.aria');
      if (label) nav.setAttribute('aria-label', label);
    });

    function setI18nText(el, key) {
      const v = t(key);
      if (v == null) return;
      const inner = el.querySelector(':scope > [data-i18n]');
      if (inner) inner.textContent = v;
      else if (!el.hasAttribute('data-i18n')) el.textContent = v;
    }

    CHROME_NAV.forEach(([navKey, i18nKey]) => {
      document.querySelectorAll(`nav[data-site-nav] a[data-nav="${navKey}"]`).forEach((link) => {
        if (link.hasAttribute('data-i18n')) return;
        setI18nText(link, i18nKey);
      });
    });

    CHROME_FOOTER.forEach(([sel, key]) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.hasAttribute('data-i18n')) return;
        setI18nText(el, key);
      });
    });

    document.querySelectorAll('.nav-toggle-label').forEach((el) => {
      const v = t('nav.menu');
      if (v) el.textContent = v;
    });

    document.querySelectorAll('.legal-footer').forEach((el) => {
      const tag = t('footer.tagline');
      if (!tag) return;

      const hasExtra =
        el.querySelector(
          '[data-cookie-settings], [data-a11y-open], .footer-link-btn, .a11y-footer-link'
        ) != null;

      if (!hasExtra) {
        const year = String(new Date().getFullYear());
        el.innerHTML = `&copy; <span id="y">${year}</span><span class="footer-tagline-text"> ${tag}</span>`;
        return;
      }

      let yearEl = el.querySelector('#y, #year');
      if (!yearEl) {
        yearEl = document.createElement('span');
        yearEl.id = 'y';
        el.prepend(yearEl);
        if (!el.textContent.trim().startsWith('©')) {
          el.prepend(document.createTextNode('© '));
        }
      }
      if (!yearEl.textContent?.trim()) {
        yearEl.textContent = String(new Date().getFullYear());
      }

      el.querySelectorAll('[data-i18n="footer.tagline"]').forEach((node) => node.remove());

      let taglineEl = el.querySelector('.footer-tagline-text');
      if (!taglineEl) {
        taglineEl = document.createElement('span');
        taglineEl.className = 'footer-tagline-text';
        const insertBefore = el.querySelector(
          '[data-cookie-settings], [data-a11y-open], .footer-link-btn, .a11y-footer-link'
        );
        el.insertBefore(taglineEl, insertBefore || null);
      }
      taglineEl.textContent = ` ${tag}`;
    });
  }

  window.ktApplySiteChrome = applySiteChrome;

  function initEmailLinks() {
    document.querySelectorAll('.js-email[data-u][data-d]').forEach((link) => {
      const user = link.getAttribute('data-u');
      const domain = link.getAttribute('data-d');
      if (!user || !domain) return;
      const addr = `${user}@${domain}`;
      link.href = `mailto:${addr}`;
      if (!link.hasAttribute('data-i18n') && !link.textContent.trim()) {
        link.textContent = addr;
      }
    });
  }

  window.ktInitEmailLinks = initEmailLinks;

  function initSkipLink() {
    const existing = document.querySelector('.skip-link');
    if (existing) {
      if (!existing.hasAttribute('data-i18n')) existing.setAttribute('data-i18n', 'a11y.skip');
      return;
    }
    const main = document.querySelector('main');
    if (!main) return;
    if (!main.id) main.id = 'main';

    const skip = document.createElement('a');
    skip.href = '#main';
    skip.className = 'skip-link';
    skip.setAttribute('data-i18n', 'a11y.skip');
    skip.textContent = 'Zum Inhalt springen';
    document.body.prepend(skip);
  }

  function initMobileNav() {
    const header = document.querySelector('header .header-inner');
    const nav = document.querySelector('nav[data-site-nav]');
    if (!header || !nav) return;

    /* Statischen Button aus dem HTML wiederverwenden, sonst erzeugen. */
    let toggle = header.querySelector('.nav-toggle');
    if (toggle && toggle.dataset.navBound === '1') return;

    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-toggle';
      toggle.innerHTML =
        '<span class="nav-toggle-bar" aria-hidden="true"></span><span class="nav-toggle-label">Menü</span>';
    }
    toggle.dataset.navBound = '1';
    toggle.setAttribute('aria-expanded', 'false');

    const navId = nav.id || 'site-nav';
    nav.id = navId;
    toggle.setAttribute('aria-controls', navId);

    let backdrop = document.querySelector('.nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'nav-backdrop';
      backdrop.hidden = true;
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    if (!toggle.isConnected) {
      const tools = header.querySelector('.header-tools');
      if (tools) {
        tools.appendChild(toggle);
      } else {
        header.insertBefore(toggle, nav);
      }
    }

    function setNavOpen(open) {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      backdrop.hidden = !open;
    }

    toggle.addEventListener('click', () => {
      setNavOpen(!document.body.classList.contains('nav-open'));
    });

    backdrop.addEventListener('click', () => setNavOpen(false));

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setNavOpen(false));
    });

    document.addEventListener('click', (e) => {
      if (!document.body.classList.contains('nav-open')) return;
      if (e.target.closest('nav[data-site-nav], .nav-toggle')) return;
      setNavOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        setNavOpen(false);
        toggle.focus();
      }
    });
  }

  function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        header.classList.toggle('header-scrolled', window.scrollY > 28);
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function setFooterYear() {
    const y = String(new Date().getFullYear());
    document.querySelectorAll('#y, #year').forEach((el) => {
      el.textContent = y;
    });
  }

  function bindLangSwitchButtons(wrap) {
    wrap.querySelectorAll('.lang-switch-btn[data-lang]').forEach((btn) => {
      if (btn.dataset.langBound === '1') return;
      btn.dataset.langBound = '1';
      btn.addEventListener('click', () => {
        if (window.ktI18n) window.ktI18n.setLang(btn.dataset.lang);
      });
    });
  }

  function initLangSwitch() {
    const header = document.querySelector('header .header-inner');
    if (!header) return;

    let wrap = header.querySelector('.lang-switch');
    if (wrap) {
      bindLangSwitchButtons(wrap);
      const label = window.ktI18n?.t('lang.switch');
      if (label) wrap.setAttribute('aria-label', label);
      return;
    }

    wrap = document.createElement('div');
    wrap.className = 'lang-switch';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', window.ktI18n?.t('lang.switch') || 'Sprache');

    const btns = document.createElement('div');
    btns.className = 'lang-switch-btns';

    ['de', 'en'].forEach((code) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-switch-btn';
      btn.dataset.lang = code;
      btn.textContent = code.toUpperCase();
      btns.appendChild(btn);
    });

    wrap.appendChild(btns);
    bindLangSwitchButtons(wrap);

    const tools = header.querySelector('.header-tools');
    const nav = header.querySelector('nav[data-site-nav]');
    if (tools) {
      tools.prepend(wrap);
    } else if (nav) {
      header.insertBefore(wrap, nav);
    } else {
      header.appendChild(wrap);
    }
  }

  window.ktInitLangSwitch = initLangSwitch;

  function redirectLegacyPraxisHash() {
    if (window.location.hash === '#praxis') {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}#atelier`);
    }
  }

  function initCardClickable(root = document) {
    root.querySelectorAll('.card--clickable').forEach((card) => {
      if (card.dataset.cardClickBound === '1') return;
      const link = card.querySelector('a.card-hit-area[href]');
      if (!link) return;
      card.dataset.cardClickBound = '1';

      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        link.click();
      });
    });
  }

  window.ktInitCardClickable = initCardClickable;

  function init() {
    redirectLegacyPraxisHash();
    initSkipLink();
    initEmailLinks();
    initMobileNav();
    initHeaderScroll();
    initLangSwitch();
    initCardClickable();
    applySiteChrome();
    markCurrentNav();
    initHomeScrollSpy();
    setFooterYear();
  }

  document.addEventListener('kt-lang-change', () => {
    applySiteChrome();
    initEmailLinks();
    setFooterYear();
    const group = document.querySelector('.lang-switch');
    if (group && window.ktI18n) {
      group.setAttribute('aria-label', window.ktI18n.t('lang.switch') || 'Sprache');
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
