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

  const COMPARE_ZOOM_DOUBLE_MS = 450;

  /* ── Vorher/Nachher-Slider ── */
  const compare = root.querySelector('[data-raum-compare]');
  if (compare) {
    const media = compare.querySelector('.kt-raum-compare-media') || compare;
    const range =
      compare.querySelector('[data-raum-compare-range]') ||
      compare.querySelector('#raumCompareRange');
    const afterLayer = compare.querySelector('[data-raum-compare-after]');
    const handle = compare.querySelector('[data-raum-compare-handle]');

    let compareFrame = null;
    let pendingPct = null;
    let dragRect = null;

    function percentLabel(n) {
      const tpl = tr('ui.percent', '{n} Prozent');
      return String(tpl).replace('{n}', String(n));
    }

    function syncRange(pct) {
      if (!range) return;
      const rounded = Math.round(pct);
      range.value = String(rounded);
      range.setAttribute('aria-valuetext', percentLabel(rounded));
    }

    function afterClipInset(pct) {
      if (pct <= 0) return 100;
      if (pct >= 100) return 0;
      return 100 - pct;
    }

    function applyCompare(pct, syncInput = true) {
      const clamped = Math.min(100, Math.max(0, pct));
      compare.style.setProperty('--compare-pct', `${clamped}%`);
      if (afterLayer) {
        afterLayer.style.clipPath = `inset(0 0 0 ${afterClipInset(clamped)}%)`;
      }
      if (syncInput) syncRange(clamped);
    }

    function setCompare(pct) {
      if (!afterLayer) return;
      pendingPct = pct;
      if (compareFrame != null) return;
      compareFrame = requestAnimationFrame(() => {
        compareFrame = null;
        if (pendingPct == null) return;
        applyCompare(pendingPct, false);
        pendingPct = null;
      });
    }

    function setCompareImmediate(pct) {
      if (compareFrame != null) {
        cancelAnimationFrame(compareFrame);
        compareFrame = null;
      }
      pendingPct = null;
      applyCompare(pct, true);
    }

    function pointerX(e) {
      const rect = dragRect || media.getBoundingClientRect();
      const clientX = e.clientX;
      if (!rect.width) return 50;
      return ((clientX - rect.left) / rect.width) * 100;
    }

    if (range) {
      const onRangeInput = () => setCompareImmediate(Number(range.value));
      range.addEventListener('input', onRangeInput);
      range.addEventListener('change', onRangeInput);
      range.addEventListener('touchstart', () => {
        compare.classList.add('is-scrubbing');
      }, { passive: true });
      range.addEventListener('touchend', () => {
        compare.classList.remove('is-scrubbing', 'is-dragging');
      }, { passive: true });
    }

    let dragging = false;
    let compareDragged = false;
    let compareDragStart = 0;
    let activePointerId = null;
    const DRAG_THRESHOLD = 3;

    function shouldIgnoreDragTarget(target) {
      return target?.closest?.('[data-raum-hotspot], [data-raum-compare-range]');
    }

    function beginDrag(e) {
      if (shouldIgnoreDragTarget(e.target)) return false;
      if (e.pointerType === 'mouse' && e.button > 0) return false;
      activePointerId = e.pointerId;
      dragging = false;
      compareDragged = false;
      dragRect = media.getBoundingClientRect();
      compareDragStart = pointerX(e);
      try {
        (media.setPointerCapture ? media : compare).setPointerCapture(e.pointerId);
      } catch (_) {
        /* unsupported */
      }
      return true;
    }

    function moveDrag(e) {
      if (activePointerId == null || e.pointerId !== activePointerId) return;
      const x = pointerX(e);
      if (!dragging && Math.abs(x - compareDragStart) < DRAG_THRESHOLD) return;
      if (!dragging) {
        dragging = true;
        compare.classList.add('is-scrubbing', 'is-dragging');
      }
      compareDragged = true;
      delete compare.dataset.raumZoomPrimed;
      if (e.cancelable) e.preventDefault();
      setCompare(x);
    }

    function endDrag(e) {
      if (e && activePointerId != null && e.pointerId !== activePointerId) return;
      if (pendingPct != null || compareFrame != null) {
        if (compareFrame != null) {
          cancelAnimationFrame(compareFrame);
          compareFrame = null;
        }
        if (pendingPct != null) {
          applyCompare(pendingPct, true);
          pendingPct = null;
        } else {
          const pct = Number.parseFloat(compare.style.getPropertyValue('--compare-pct')) || 50;
          syncRange(pct);
        }
      }
      dragging = false;
      activePointerId = null;
      dragRect = null;
      compare.classList.remove('is-dragging', 'is-scrubbing');
      if (e) {
        try {
          (media.releasePointerCapture ? media : compare).releasePointerCapture(e.pointerId);
        } catch (_) {
          /* already released */
        }
      }
    }

    const dragSurface = media;
    dragSurface.addEventListener('pointerdown', beginDrag);
    dragSurface.addEventListener('pointermove', moveDrag);
    dragSurface.addEventListener('pointerup', endDrag);
    dragSurface.addEventListener('pointercancel', endDrag);

    window.addEventListener('resize', () => {
      if (!dragging) dragRect = null;
    });

    compare.dataset.raumCompareDragged = '0';
    compare.addEventListener(
      'click',
      () => {
        compare.dataset.raumCompareDragged = compareDragged ? '1' : '0';
        compareDragged = false;
        if (compare.dataset.raumCompareDragged === '1') {
          delete compare.dataset.raumZoomPrimed;
        }
      },
      true
    );

    setCompareImmediate(50);

    document.addEventListener('kt-lang-change', () => {
      if (range) {
        const rounded = Number.parseInt(range.value, 10) || 50;
        syncRange(rounded);
      }
    });
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
      const focusClose = () => lbClose.focus();
      if (window.flowMotion) {
        window.flowMotion.open(overlay, 'lightbox-visible').then(focusClose);
      } else {
        overlay.classList.add('lightbox-visible');
        focusClose();
      }
    }

    function closeLb() {
      const after = () => {
        document.body.classList.remove('lightbox-open');
        lbImg.removeAttribute('src');
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        lastFocus = null;
      };
      if (window.flowMotion) {
        window.flowMotion.close(overlay, 'lightbox-visible').then(after);
        return;
      }
      overlay.classList.remove('lightbox-visible');
      overlay.hidden = true;
      after();
    }

    lightboxTriggers.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        if (e.target.closest('[data-raum-hotspot]') || e.target.closest('[data-raum-compare-range]')) return;
        if (btn.dataset.raumCompareDragged === '1') {
          btn.dataset.raumCompareDragged = '0';
          return;
        }
        if (btn.hasAttribute('data-raum-compare')) {
          const primed = Number(btn.dataset.raumZoomPrimed || 0);
          const now = Date.now();
          if (!primed || now - primed > COMPARE_ZOOM_DOUBLE_MS) {
            btn.dataset.raumZoomPrimed = String(now);
            return;
          }
          delete btn.dataset.raumZoomPrimed;
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
