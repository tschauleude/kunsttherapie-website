/**
 * Sequenzielles Einblenden: Elemente erscheinen nacheinander (staggered reveal).
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const STEP_MS = 100;
  const HEADER_STEP_MS = 52;
  const SECTION_GAP_MS = 165;
  const INITIAL_DELAY_MS = 90;
  const SKIP_SELECTOR =
    '.consent-banner, .consent-settings, #newsPopup, .lightbox, [hidden], script, style, noscript';

  let queue = Promise.resolve();

  function prefersReducedMotion() {
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-reduce-motion')
    );
  }

  function isSkipped(el) {
    if (!el || !(el instanceof Element)) return true;
    if (el.matches(SKIP_SELECTOR)) return true;
    if (el.closest(SKIP_SELECTOR)) return true;
    if (el.closest('[data-reveal-skip]')) return true;
    if (el.offsetParent === null) return true;
    return false;
  }

  function collectSectionBlocks(section, add, seen) {
    if (section.hidden) return;

    const intro = section.querySelector(':scope > .section-intro, :scope > .page-hero');
    if (intro) {
      [...intro.children].forEach((child) => add(child));
    }

    const heroGrid = section.querySelector(':scope > .hero-grid');
    if (heroGrid) {
      [...heroGrid.children].forEach((child) => add(child));
    }

    if (section.classList.contains('kt-hero')) {
      section.querySelectorAll(':scope > .card').forEach((el) => add(el));
    }

    section
      .querySelectorAll(
        ':scope > .services-grid > .card, :scope > .image-gallery > .gallery-item, :scope > .kt-offers > [data-offer], :scope > .card.hero-left, :scope > .card.canvasWrap, :scope > .booking-layout > .card, :scope > .booking-form-panel, :scope > .twoCol > div'
      )
      .forEach((el) => add(el));

    section.querySelectorAll(':scope > .center').forEach((el) => add(el));

    section.querySelectorAll(':scope > .quote-showcase').forEach((el) => add(el));

    section.querySelectorAll(':scope > .card').forEach((el) => add(el));
  }

  function collectFlatMain(main, add, seen) {
    main.querySelectorAll('.page-hero > *, .section-intro > *').forEach((el) => add(el));
    main.querySelectorAll('.booking-layout > .card, .booking-form-panel, :scope > .card').forEach((el) => {
      add(el);
    });
  }

  function collectPageTargets() {
    const seen = new Set();
    const items = [];

    function add(el) {
      if (isSkipped(el) || seen.has(el)) return;
      seen.add(el);
      items.push(el);
    }

    const brand = document.querySelector('header .brand');
    if (brand) add(brand);
    document.querySelectorAll('header nav li').forEach((el) => add(el));

    const main = document.querySelector('main');
    if (main) {
      const sections = main.querySelectorAll(':scope > section');
      if (sections.length) {
        sections.forEach((section) => collectSectionBlocks(section, add, seen));
      } else {
        collectFlatMain(main, add, seen);
        const heroGrid = main.querySelector(':scope > .hero-grid');
        if (heroGrid) {
          [...heroGrid.children].forEach((child) => add(child));
        }
        main.querySelectorAll(':scope > .card').forEach((el) => add(el));
      }
    }

    document.querySelectorAll('.site-footer .footer-col').forEach((el) => add(el));
    const legal = document.querySelector('.site-footer .legal-footer');
    if (legal) add(legal);

    return items;
  }

  function prepareElement(el) {
    if (el.classList.contains('reveal-item')) return;
    el.classList.add('reveal-item');
  }

  function revealElement(el) {
    el.classList.add('reveal-visible');
  }

  function runSequence(elements, startDelay = 0) {
    if (!elements.length) return Promise.resolve();

    if (prefersReducedMotion()) {
      elements.forEach((el) => {
        prepareElement(el);
        revealElement(el);
      });
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let delay = startDelay;
      let prevSection = null;

      elements.forEach((el) => {
        const section = el.closest('main > section');
        if (prevSection && section && section !== prevSection) {
          delay += SECTION_GAP_MS;
        }
        if (section) prevSection = section;

        prepareElement(el);
        const at = delay;
        window.setTimeout(() => revealElement(el), at);
        delay += el.closest('header') ? HEADER_STEP_MS : STEP_MS;
      });

      window.setTimeout(resolve, delay + 180);
    });
  }

  function revealStagger(nodes, options = {}) {
    const list = [...nodes].filter((el) => el && !isSkipped(el));
    if (!list.length) return Promise.resolve();

    const task = () => runSequence(list, options.delay || 0);
    queue = queue.then(task);
    return queue;
  }

  function initPage() {
    const targets = collectPageTargets();
    if (!targets.length) return;

    document.documentElement.classList.add('reveal-active');

    if (prefersReducedMotion()) {
      targets.forEach((el) => {
        prepareElement(el);
        revealElement(el);
      });
      return;
    }

    queue = queue.then(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(() => {
            targets.forEach((el) => prepareElement(el));
            requestAnimationFrame(() => {
              runSequence(targets, INITIAL_DELAY_MS).then(resolve);
            });
          });
        })
    );
  }

  window.revealStagger = revealStagger;
  window.whenRevealIdle = function whenRevealIdle() {
    return queue;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }
})();
