/**
 * Einheitliche Ein-/Ausblend- und Höhen-Animationen (CSS-Tokens --ease-flow, --duration-flow).
 */
(function () {
  const FALLBACK_MS = 620;

  function durationMs() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--duration-flow').trim();
    if (!raw) return FALLBACK_MS;
    if (raw.endsWith('ms')) return parseFloat(raw) || FALLBACK_MS;
    if (raw.endsWith('s')) return (parseFloat(raw) || 0.62) * 1000;
    return FALLBACK_MS;
  }

  function reducedMotion() {
    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('a11y-reduce-motion')
    );
  }

  function flowOpen(el, visibleClass = 'flow-visible') {
    if (!el) return Promise.resolve();
    if (reducedMotion()) {
      el.hidden = false;
      el.classList.add(visibleClass);
      return Promise.resolve();
    }
    el.hidden = false;
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        el.classList.add(visibleClass);
        window.setTimeout(resolve, durationMs());
      });
    });
  }

  function flowClose(el, visibleClass = 'flow-visible') {
    if (!el) return Promise.resolve();
    if (reducedMotion()) {
      el.classList.remove(visibleClass);
      el.hidden = true;
      return Promise.resolve();
    }
    el.classList.remove(visibleClass);
    return new Promise((resolve) => {
      window.setTimeout(() => {
        el.hidden = true;
        resolve();
      }, durationMs());
    });
  }

  function expandHeight(el) {
    if (!el) return Promise.resolve();
    if (reducedMotion()) {
      el.hidden = false;
      el.style.height = '';
      el.style.overflow = '';
      el.style.transition = '';
      return Promise.resolve();
    }

    el.hidden = false;
    el.style.overflow = 'hidden';
    el.style.height = '0px';
    const target = el.scrollHeight;

    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        el.style.transition = 'height var(--duration-flow) var(--ease-flow)';
        el.style.height = `${target}px`;
      });

      const finish = () => {
        el.style.height = '';
        el.style.overflow = '';
        el.style.transition = '';
        resolve();
      };

      const onEnd = (e) => {
        if (e.propertyName !== 'height') return;
        el.removeEventListener('transitionend', onEnd);
        finish();
      };

      el.addEventListener('transitionend', onEnd);
      window.setTimeout(() => {
        el.removeEventListener('transitionend', onEnd);
        finish();
      }, durationMs() + 80);
    });
  }

  function collapseHeight(el) {
    if (!el) return Promise.resolve();
    if (reducedMotion()) {
      el.hidden = true;
      el.style.height = '';
      el.style.overflow = '';
      el.style.transition = '';
      return Promise.resolve();
    }

    el.style.overflow = 'hidden';
    el.style.height = `${el.scrollHeight}px`;

    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        el.style.transition = 'height var(--duration-flow) var(--ease-flow)';
        el.style.height = '0px';
      });

      const finish = () => {
        el.hidden = true;
        el.style.height = '';
        el.style.overflow = '';
        el.style.transition = '';
        resolve();
      };

      const onEnd = (e) => {
        if (e.propertyName !== 'height') return;
        el.removeEventListener('transitionend', onEnd);
        finish();
      };

      el.addEventListener('transitionend', onEnd);
      window.setTimeout(() => {
        el.removeEventListener('transitionend', onEnd);
        finish();
      }, durationMs() + 80);
    });
  }

  window.flowMotion = {
    open: flowOpen,
    close: flowClose,
    expand: expandHeight,
    collapse: collapseHeight,
    durationMs,
  };
})();
