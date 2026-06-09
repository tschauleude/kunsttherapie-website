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
    const range =
      compare.querySelector('[data-raum-compare-range]') ||
      compare.querySelector('#raumCompareRange');
    const afterLayer = compare.querySelector('[data-raum-compare-after]');
    const handle = compare.querySelector('[data-raum-compare-handle]');

    function setCompare(pct) {
      const clamped = Math.min(100, Math.max(0, pct));
      // Rechts Stimmungsvision, links Aktuelles Foto (Nachher-Layer von rechts einblenden)
      afterLayer.style.clipPath = `inset(0 0 0 ${100 - clamped}%)`;
      if (handle) handle.style.left = `${clamped}%`;
      if (range) {
        range.value = String(Math.round(clamped));
        range.setAttribute('aria-valuetext', `${Math.round(clamped)} Prozent`);
      }
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
    let compareDragged = false;
    let compareDragStart = 0;
    let activePointerId = null;
    const DRAG_THRESHOLD = 4;

    compare.addEventListener('pointerdown', (e) => {
      if (e.target.closest('[data-raum-hotspot]')) return;
      if (e.pointerType === 'mouse' && e.button > 0) return;
      activePointerId = e.pointerId;
      dragging = false;
      compareDragged = false;
      compareDragStart = pointerX(e);
      try {
        compare.setPointerCapture(e.pointerId);
      } catch (_) {
        /* synthetic / unsupported pointer */
      }
    });

    compare.addEventListener('pointermove', (e) => {
      if (e.pointerId !== activePointerId) return;
      const x = pointerX(e);
      if (!dragging && Math.abs(x - compareDragStart) < DRAG_THRESHOLD) return;
      dragging = true;
      compareDragged = true;
      compare.classList.add('is-dragging');
      setCompare(x);
    });

    function endCompareDrag(e) {
      if (e && activePointerId != null && e.pointerId !== activePointerId) return;
      dragging = false;
      activePointerId = null;
      compare.classList.remove('is-dragging');
      if (e) {
        try {
          compare.releasePointerCapture(e.pointerId);
        } catch (_) {
          /* already released */
        }
      }
    }

    compare.addEventListener('pointerup', endCompareDrag);
    compare.addEventListener('pointercancel', endCompareDrag);
    compare.dataset.raumCompareDragged = '0';
    compare.addEventListener('click', () => {
      compare.dataset.raumCompareDragged = compareDragged ? '1' : '0';
      compareDragged = false;
    }, true);

    setCompare(50);
  }

  /* ── Hotspots ── */
  root.querySelectorAll('[data-raum-hotspot]').forEach((pin) => {
    const tip = pin.querySelector('.kt-hotspot-tip');
    if (!tip) return;

    const y = parseFloat(pin.style.getPropertyValue('--hotspot-y'));
    if (!Number.isNaN(y) && y < 34) {
      pin.classList.add('kt-hotspot--tip-below');
    }

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
    let lastFocus = null;

    function pickLightboxImage(container) {
      if (container.hasAttribute('data-raum-compare')) {
        const range = container.querySelector('[data-raum-compare-range]');
        const val = range ? Number(range.value) : 50;
        const afterImg = container.querySelector('.kt-raum-compare-after img');
        const beforeImg = container.querySelector('.kt-raum-compare-before');
        if (val >= 50 && afterImg) return afterImg;
        return beforeImg;
      }
      return container.querySelector('img');
    }

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
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
      lastFocus = null;
    }

    lightboxTriggers.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('[data-raum-hotspot]') || e.target.closest('[data-raum-compare-range]')) return;
        if (btn.dataset.raumCompareDragged === '1') {
          btn.dataset.raumCompareDragged = '0';
          return;
        }
        const img = pickLightboxImage(btn);
        if (!img) return;
        lastFocus = e.target.closest('[data-raum-hotspot]') || btn;
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
