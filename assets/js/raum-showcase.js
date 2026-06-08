/**
 * Interaktive Raum-Showcase: Tabs, Vorher/Nachher-Slider, Hotspots, Lightbox.
 */
(function () {
  const root = document.querySelector('[data-raum-showcase]');
  if (!root) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tr(key, fallback) {
    return window.ktI18n ? window.ktI18n.t(key) : fallback;
  }

  /* ── Tabs ── */
  const tabs = [...root.querySelectorAll('[data-raum-tab]')];
  const panels = [...root.querySelectorAll('[data-raum-panel]')];

  function activateTab(id) {
    tabs.forEach((tab) => {
      const active = tab.dataset.raumTab === id;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const show = panel.dataset.raumPanel === id;
      panel.hidden = !show;
      panel.classList.toggle('is-active', show);
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.raumTab));
    tab.addEventListener('keydown', (e) => {
      const idx = tabs.indexOf(tab);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
        tabs[next].focus();
        activateTab(tabs[next].dataset.raumTab);
      }
    });
  });

  /* ── Vorher/Nachher-Slider ── */
  const compare = root.querySelector('[data-raum-compare]');
  if (compare) {
    const range = compare.querySelector('[data-raum-compare-range]');
    const afterLayer = compare.querySelector('[data-raum-compare-after]');
    const handle = compare.querySelector('[data-raum-compare-handle]');

    function setCompare(pct) {
      const clamped = Math.min(100, Math.max(0, pct));
      afterLayer.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
      if (handle) handle.style.left = `${clamped}%`;
      if (range) range.value = String(clamped);
      compare.style.setProperty('--compare-pct', `${clamped}%`);
    }

    function pointerX(e) {
      const rect = compare.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      return ((clientX - rect.left) / rect.width) * 100;
    }

    if (range) {
      range.addEventListener('input', () => setCompare(Number(range.value)));
    }

    let dragging = false;
    compare.addEventListener('pointerdown', (e) => {
      if (e.target.closest('[data-raum-hotspot]')) return;
      dragging = true;
      compare.setPointerCapture(e.pointerId);
      setCompare(pointerX(e));
    });
    compare.addEventListener('pointermove', (e) => {
      if (dragging) setCompare(pointerX(e));
    });
    compare.addEventListener('pointerup', () => { dragging = false; });
    compare.addEventListener('pointercancel', () => { dragging = false; });

    setCompare(50);
  }

  /* ── Hotspots ── */
  root.querySelectorAll('[data-raum-hotspot]').forEach((pin) => {
    const tip = pin.querySelector('.kt-hotspot-tip');
    if (!tip) return;

    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = pin.classList.toggle('is-open');
      root.querySelectorAll('[data-raum-hotspot].is-open').forEach((other) => {
        if (other !== pin) other.classList.remove('is-open');
      });
      if (open) pin.classList.add('is-open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-raum-hotspot]')) {
      root.querySelectorAll('[data-raum-hotspot].is-open').forEach((p) => p.classList.remove('is-open'));
    }
  });

  /* ── Lightbox für Showcase-Bilder ── */
  const lightboxTriggers = [...root.querySelectorAll('[data-raum-lightbox]')];
  if (lightboxTriggers.length) {
    let overlay = document.querySelector('.lightbox[data-raum-lightbox-root]');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.dataset.raumLightboxRoot = '';
      overlay.hidden = true;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', tr('ui.lightbox.title', 'Vergrößertes Bild'));
      overlay.innerHTML = `
        <button type="button" class="lightbox-close" aria-label="${tr('btn.close', 'Schließen')}">&times;</button>
        <figure class="lightbox-dialog">
          <img class="lightbox-img" src="" alt=""/>
          <figcaption class="lightbox-caption"></figcaption>
        </figure>`;
      document.body.appendChild(overlay);
    }

    const lbImg = overlay.querySelector('.lightbox-img');
    const lbCaption = overlay.querySelector('.lightbox-caption');
    const lbClose = overlay.querySelector('.lightbox-close');

    function openLb(src, alt, caption) {
      lbImg.src = src;
      lbImg.alt = alt;
      lbCaption.textContent = caption || '';
      overlay.hidden = false;
      document.body.classList.add('lightbox-open');
      lbClose.focus();
    }

    function closeLb() {
      overlay.hidden = true;
      document.body.classList.remove('lightbox-open');
      lbImg.removeAttribute('src');
    }

    lightboxTriggers.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('[data-raum-hotspot]') || e.target.closest('[data-raum-compare-range]')) return;
        const img = btn.querySelector('img');
        if (!img) return;
        openLb(img.currentSrc || img.src, img.alt, btn.dataset.raumCaption || img.alt);
      });
    });

    lbClose.addEventListener('click', closeLb);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLb(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) closeLb();
    });
  }

  /* ── Sanfte Einblendung ── */
  if (!prefersReducedMotion) {
    root.classList.add('is-ready');
  }
})();
