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

  /* ── Vorher/Nachher-Slider (GPU: Breiten-Clip + rAF, Maus folgt ohne Klick) ── */
  const compare = root.querySelector('[data-raum-compare]');
  if (compare) {
    const media = compare.querySelector('.kt-raum-compare-media') || compare;
    const range =
      compare.querySelector('[data-raum-compare-range]') ||
      compare.querySelector('#raumCompareRange');

    let compareLeft = 0;
    let compareWidth = 1;
    let pendingPct = null;
    let rafId = 0;
    let activePointerId = null;
    let compareDragged = false;
    let hoverScrub = false;

    function measureCompare() {
      const rect = compare.getBoundingClientRect();
      compareLeft = rect.left;
      compareWidth = Math.max(rect.width, 1);
    }

    function clampPct(pct) {
      return Math.min(99, Math.max(1, pct));
    }

    function applyCompare(pct) {
      const clamped = clampPct(pct);
      compare.style.setProperty('--compare-pct', String(clamped));
      if (range) {
        const rounded = Math.round(clamped);
        if (Number(range.value) !== rounded) {
          range.value = String(rounded);
          range.setAttribute('aria-valuetext', `${rounded} Prozent`);
        }
      }
    }

    function flushCompare() {
      rafId = 0;
      if (pendingPct == null) return;
      const pct = pendingPct;
      pendingPct = null;
      applyCompare(pct);
    }

    function setCompare(pct) {
      pendingPct = pct;
      if (!rafId) {
        rafId = requestAnimationFrame(flushCompare);
      }
    }

    function pctFromClientX(clientX) {
      return ((clientX - compareLeft) / compareWidth) * 100;
    }

    function pctFromEvent(e) {
      const clientX = e.touches?.[0]?.clientX ?? e.clientX;
      return pctFromClientX(clientX);
    }

    if (range) {
      range.addEventListener('input', () => {
        measureCompare();
        applyCompare(Number(range.value));
      });
    }

    function shouldIgnoreDragTarget(target) {
      return target?.closest?.('[data-raum-hotspot]');
    }

    function startScrub() {
      compare.classList.add('is-scrubbing');
    }

    function stopScrub() {
      compare.classList.remove('is-scrubbing', 'is-dragging');
    }

    function beginDrag(e) {
      if (shouldIgnoreDragTarget(e.target)) return false;
      if (e.pointerType === 'mouse' && e.button > 0) return false;
      measureCompare();
      activePointerId = e.pointerId;
      compareDragged = false;
      hoverScrub = false;
      startScrub();
      setCompare(pctFromEvent(e));
      try {
        (media.setPointerCapture ? media : compare).setPointerCapture(e.pointerId);
      } catch (_) {
        /* unsupported */
      }
      return true;
    }

    function moveDrag(e) {
      if (activePointerId != null) {
        if (e.pointerId !== activePointerId) return;
        compareDragged = true;
        compare.classList.add('is-dragging');
        if (e.cancelable) e.preventDefault();
        setCompare(pctFromEvent(e));
        return;
      }

      if (e.pointerType === 'mouse' && !shouldIgnoreDragTarget(e.target)) {
        if (!hoverScrub) {
          hoverScrub = true;
          measureCompare();
          startScrub();
        }
        setCompare(pctFromEvent(e));
      }
    }

    function endDrag(e) {
      if (e && activePointerId != null && e.pointerId !== activePointerId) return;
      activePointerId = null;
      hoverScrub = false;
      stopScrub();
      if (e) {
        try {
          (media.releasePointerCapture ? media : compare).releasePointerCapture(e.pointerId);
        } catch (_) {
          /* already released */
        }
      }
    }

    const dragSurface = media;
    measureCompare();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(measureCompare).observe(compare);
    }
    window.addEventListener('resize', measureCompare, { passive: true });
    dragSurface.addEventListener('pointerenter', measureCompare);
    dragSurface.addEventListener('pointerdown', beginDrag);
    dragSurface.addEventListener('pointermove', moveDrag);
    dragSurface.addEventListener('pointerup', endDrag);
    dragSurface.addEventListener('pointercancel', endDrag);
    dragSurface.addEventListener('pointerleave', (e) => {
      if (activePointerId == null && e.pointerType === 'mouse') {
        hoverScrub = false;
        stopScrub();
      }
    });

    compare.dataset.raumCompareDragged = '0';
    compare.addEventListener(
      'click',
      () => {
        compare.dataset.raumCompareDragged = compareDragged ? '1' : '0';
        compareDragged = false;
      },
      true
    );

    applyCompare(50);
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
        const rangeEl =
          container.querySelector('[data-raum-compare-range]') ||
          container.querySelector('#raumCompareRange');
        const val = rangeEl ? Number(rangeEl.value) : 50;
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
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLb();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) closeLb();
    });
  }

  /* ── Sanfte Einblendung ── */
  if (!prefersReducedMotion) {
    root.classList.add('is-ready');
  }
})();
