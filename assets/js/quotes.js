/**
 * Dezente Zitat-Rotation – sanftes Crossfade, pausiert bei Hover/Fokus.
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const INTERVAL_MS = 9000;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-quote-showcase]').forEach((root) => {
    const slides = [...root.querySelectorAll('[data-quote-slide]')];
    const dots = [...root.querySelectorAll('[data-quote-dot]')];
    if (slides.length < 2) return;

    let index = slides.findIndex((s) => s.classList.contains('is-active'));
    if (index < 0) index = 0;

    let timer = null;
    let paused = false;

    function show(next) {
      if (next === index) return;
      slides[index].classList.remove('is-active');
      dots[index]?.classList.remove('is-active');
      dots[index]?.setAttribute('aria-selected', 'false');

      index = (next + slides.length) % slides.length;

      slides[index].classList.add('is-active');
      dots[index]?.classList.add('is-active');
      dots[index]?.setAttribute('aria-selected', 'true');
    }

    function next() {
      show(index + 1);
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

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        show(i);
        start();
      });
    });

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
})();
