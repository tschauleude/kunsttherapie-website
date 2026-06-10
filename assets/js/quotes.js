/**
 * Dezente Zitat-Rotation – sanftes Crossfade, pausiert bei Hover/Fokus.
 * Navigation per Delegation, damit Pfeile zuverlässig klickbar bleiben.
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const INTERVAL_MS = 9000;
  const showcases = new WeakMap();

  function initQuoteShowcases() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('[data-quote-showcase]').forEach((root) => {
      if (showcases.has(root)) return;

      const slides = [...root.querySelectorAll('[data-quote-slide]')];
      const dots = [...root.querySelectorAll('[data-quote-dot]')];
      if (slides.length < 2) return;

      let index = slides.findIndex((s) => s.classList.contains('is-active'));
      if (index < 0) index = 0;

      let timer = null;
      let paused = false;

      function show(next) {
        const target = ((next % slides.length) + slides.length) % slides.length;
        if (target === index) return;

        slides[index].classList.remove('is-active');
        dots[index]?.classList.remove('is-active');
        dots[index]?.setAttribute('aria-selected', 'false');

        index = target;

        slides[index].classList.add('is-active');
        dots[index]?.classList.add('is-active');
        dots[index]?.setAttribute('aria-selected', 'true');
      }

      function next() {
        show(index + 1);
      }

      function prev() {
        show(index - 1);
      }

      function start() {
        if (reducedMotion || paused) return;
        stop();
        timer = window.setInterval(next, INTERVAL_MS);
      }

      function stop() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }

      showcases.set(root, { show, next, prev, start, stop, setPaused(value) {
        paused = value;
        if (paused) stop();
        else start();
      } });

      root.addEventListener('mouseenter', () => {
        paused = true;
        stop();
      });
      root.addEventListener('mouseleave', () => {
        paused = false;
        start();
      });
      root.addEventListener('focusin', () => {
        paused = true;
        stop();
      });
      root.addEventListener('focusout', (e) => {
        if (!root.contains(e.relatedTarget)) {
          paused = false;
          start();
        }
      });

      start();
    });
  }

  document.addEventListener(
    'click',
    (e) => {
      const prevBtn = e.target.closest('[data-quote-prev]');
      const nextBtn = e.target.closest('[data-quote-next]');
      const dot = e.target.closest('[data-quote-dot]');

      if (!prevBtn && !nextBtn && !dot) return;

      const root = (prevBtn || nextBtn || dot).closest('[data-quote-showcase]');
      if (!root) return;

      const state = showcases.get(root);
      if (!state) return;

      e.preventDefault();
      e.stopPropagation();

      if (prevBtn) state.prev();
      else if (nextBtn) state.next();
      else if (dot) {
        const i = Number(dot.dataset.quoteDot);
        if (Number.isFinite(i)) state.show(i);
      }

      state.start();
    },
    true
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuoteShowcases);
  } else {
    initQuoteShowcases();
  }
})();
