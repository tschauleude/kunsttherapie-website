/**
 * Einheitliche Ein-/Ausblend- und Höhen-Animationen (CSS-Tokens --ease-flow, --duration-flow).
 * Cancellable timers verhindern Race-Conditions bei schnellem Öffnen/Schließen.
 */
(function () {
  const FALLBACK_MS = 620;
  const elState = new WeakMap();

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

  function state(el) {
    if (!elState.has(el)) elState.set(el, { gen: 0, timers: [] });
    return elState.get(el);
  }

  function bump(el) {
    const s = state(el);
    s.timers.forEach((id) => window.clearTimeout(id));
    s.timers = [];
    s.gen += 1;
    return s.gen;
  }

  function schedule(el, gen, fn, ms) {
    const id = window.setTimeout(() => {
      if (state(el).gen !== gen) return;
      fn();
    }, ms);
    state(el).timers.push(id);
  }

  function flowOpen(el, visibleClass = 'flow-visible') {
    if (!el) return Promise.resolve();
    const gen = bump(el);

    if (reducedMotion()) {
      el.hidden = false;
      el.classList.add(visibleClass);
      return Promise.resolve();
    }

    el.hidden = false;
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        if (state(el).gen !== gen) return;
        el.classList.add(visibleClass);
        schedule(el, gen, resolve, durationMs());
      });
    });
  }

  function flowClose(el, visibleClass = 'flow-visible') {
    if (!el) return Promise.resolve();
    const gen = bump(el);

    if (reducedMotion()) {
      el.classList.remove(visibleClass);
      el.hidden = true;
      return Promise.resolve();
    }

    el.classList.remove(visibleClass);
    return new Promise((resolve) => {
      schedule(el, gen, () => {
        el.hidden = true;
        resolve();
      }, durationMs());
    });
  }

  function expandHeight(el) {
    if (!el) return Promise.resolve();
    const gen = bump(el);

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
      const finish = () => {
        if (state(el).gen !== gen) return;
        el.style.height = '';
        el.style.overflow = '';
        el.style.transition = '';
        resolve();
      };

      requestAnimationFrame(() => {
        if (state(el).gen !== gen) return;
        el.style.transition = 'height var(--duration-flow) var(--ease-flow)';
        el.style.height = `${target}px`;
      });

      const onEnd = (e) => {
        if (e.propertyName !== 'height' || state(el).gen !== gen) return;
        el.removeEventListener('transitionend', onEnd);
        finish();
      };

      el.addEventListener('transitionend', onEnd);
      schedule(el, gen, () => {
        el.removeEventListener('transitionend', onEnd);
        finish();
      }, durationMs() + 80);
    });
  }

  function collapseHeight(el) {
    if (!el) return Promise.resolve();
    const gen = bump(el);

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
      const finish = () => {
        if (state(el).gen !== gen) return;
        el.hidden = true;
        el.style.height = '';
        el.style.overflow = '';
        el.style.transition = '';
        resolve();
      };

      requestAnimationFrame(() => {
        if (state(el).gen !== gen) return;
        el.style.transition = 'height var(--duration-flow) var(--ease-flow)';
        el.style.height = '0px';
      });

      const onEnd = (e) => {
        if (e.propertyName !== 'height' || state(el).gen !== gen) return;
        el.removeEventListener('transitionend', onEnd);
        finish();
      };

      el.addEventListener('transitionend', onEnd);
      schedule(el, gen, () => {
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
    reducedMotion,
  };
})();
