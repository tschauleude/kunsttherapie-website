/**
 * Startseiten-Galerie: Lightbox mit Vorschaustreifen, Wischgesten und Tastatur.
 */
(function () {
  if (window.__ktGalleryInit) return;
  window.__ktGalleryInit = true;

  const LIGHTBOX_BLANK =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  const gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;

  function tr(key, fallback) {
    const v = window.ktI18n?.t(key);
    return v != null ? v : fallback;
  }

  function getSlides() {
    return [...gallery.querySelectorAll('[data-gallery-open]:not([hidden])')].map((btn) => {
      const img = btn.querySelector('img');
      return img ? { btn, img } : null;
    }).filter(Boolean);
  }

  function slideSrc(img) {
    return img.currentSrc || img.src;
  }

  function updateGalleryAria() {
    const prefix = tr('home.gallery.openPrefix', 'Bild vergrößern: ');
    getSlides().forEach(({ btn, img }) => {
      btn.setAttribute('aria-label', prefix + (img.alt || ''));
    });
  }

  updateGalleryAria();
  document.addEventListener('kt-lang-change', updateGalleryAria);
  document.addEventListener('kt-gallery-count', updateGalleryAria);

  const overlay = document.createElement('div');
  overlay.className = 'lightbox lightbox--gallery';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', tr('ui.lightbox.title', 'Vergrößertes Bild'));
  overlay.innerHTML = `
    <button type="button" class="lightbox-close" data-lightbox-close aria-label="${tr('btn.close', 'Schließen')}">&times;</button>
    <button type="button" class="lightbox-nav lightbox-prev" data-lightbox-prev aria-label="${tr('ui.lightbox.prev', 'Vorheriges Bild')}">&#8249;</button>
    <button type="button" class="lightbox-nav lightbox-next" data-lightbox-next aria-label="${tr('ui.lightbox.next', 'Nächstes Bild')}">&#8250;</button>
    <div class="lightbox-stage">
      <figure class="lightbox-dialog">
        <img class="lightbox-img" src="${LIGHTBOX_BLANK}" alt="" decoding="async"/>
        <figcaption class="lightbox-caption"></figcaption>
      </figure>
      <div class="lightbox-meta">
        <span class="lightbox-counter" aria-live="polite"></span>
      </div>
      <div class="lightbox-thumbs" role="tablist" aria-label="${tr('ui.lightbox.thumbs', 'Galerie-Vorschau')}"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const stage = overlay.querySelector('.lightbox-stage');
  const lightboxImg = overlay.querySelector('.lightbox-img');
  const caption = overlay.querySelector('.lightbox-caption');
  const counter = overlay.querySelector('.lightbox-counter');
  const thumbsWrap = overlay.querySelector('.lightbox-thumbs');
  const btnClose = overlay.querySelector('[data-lightbox-close]');
  const btnPrev = overlay.querySelector('[data-lightbox-prev]');
  const btnNext = overlay.querySelector('[data-lightbox-next]');

  let index = 0;
  let lastFocus = null;
  let touchStartX = 0;
  let touchStartY = 0;

  function buildThumbs() {
    thumbsWrap.innerHTML = '';
    getSlides().forEach(({ img }, i) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'lightbox-thumb';
      thumb.setAttribute('role', 'tab');
      thumb.setAttribute('aria-selected', i === index ? 'true' : 'false');
      const imgLabel = window.ktI18n?.t('ui.imageN')?.replace('{n}', String(i + 1)) || `Bild ${i + 1}`;
      thumb.setAttribute('aria-label', img.alt || imgLabel);
      const thumbImg = document.createElement('img');
      thumbImg.src = slideSrc(img);
      thumbImg.alt = '';
      thumbImg.loading = 'lazy';
      thumbImg.decoding = 'async';
      thumb.appendChild(thumbImg);
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        show(i);
      });
      thumbsWrap.appendChild(thumb);
    });
  }

  function updateThumbs() {
    thumbsWrap.querySelectorAll('.lightbox-thumb').forEach((t, i) => {
      const active = i === index;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
  }

  function preloadAdjacent(slides) {
    const prev = slides[(index - 1 + slides.length) % slides.length];
    const next = slides[(index + 1) % slides.length];
    [prev, next].forEach(({ img }) => {
      const pre = new Image();
      pre.src = slideSrc(img);
    });
  }

  function show(i) {
    const slides = getSlides();
    if (!slides.length) return;
    index = (i + slides.length) % slides.length;
    const { img } = slides[index];
    lightboxImg.src = slideSrc(img);
    lightboxImg.alt = img.alt;
    caption.textContent = img.alt;
    counter.textContent = `${index + 1} / ${slides.length}`;
    overlay.hidden = false;
    document.body.classList.add('lightbox-open');
    btnPrev.hidden = slides.length < 2;
    btnNext.hidden = slides.length < 2;
    thumbsWrap.hidden = slides.length < 2;
    updateThumbs();
    preloadAdjacent(slides);
    const focusClose = () => btnClose.focus();
    if (window.flowMotion) {
      window.flowMotion.open(overlay, 'lightbox-visible').then(focusClose);
    } else {
      overlay.classList.add('lightbox-visible');
      focusClose();
    }
  }

  function close() {
    const after = () => {
      document.body.classList.remove('lightbox-open');
      lightboxImg.src = LIGHTBOX_BLANK;
      lightboxImg.alt = '';
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
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

  function onKeydown(e) {
    if (overlay.hidden) return;
    const slides = getSlides();
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowLeft' && slides.length > 1) {
      e.preventDefault();
      show(index - 1);
    } else if (e.key === 'ArrowRight' && slides.length > 1) {
      e.preventDefault();
      show(index + 1);
    } else if (e.key === 'Tab') {
      const focusable = [...overlay.querySelectorAll(
        'button:not([hidden]), [href], input, [tabindex]:not([tabindex="-1"])'
      )].filter((el) => !el.hidden && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openFromButton(btn) {
    if (!btn || btn.hidden) return;
    lastFocus = btn;
    buildThumbs();
    const slides = getSlides();
    const slideIndex = slides.findIndex((s) => s.btn === btn);
    if (slideIndex >= 0) {
      // Gleicher Klick soll die Lightbox nicht sofort wieder schließen.
      requestAnimationFrame(() => show(slideIndex));
    }
  }

  gallery.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-gallery-open]');
    if (!btn || !gallery.contains(btn)) return;
    e.preventDefault();
    openFromButton(btn);
  });

  gallery.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const btn = e.target.closest('[data-gallery-open]');
    if (!btn || !gallery.contains(btn)) return;
    e.preventDefault();
    openFromButton(btn);
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    show(index - 1);
  });
  btnNext.addEventListener('click', (e) => {
    e.stopPropagation();
    show(index + 1);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === stage) close();
  });

  stage.addEventListener('click', (e) => e.stopPropagation());

  overlay.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  overlay.addEventListener(
    'touchend',
    (e) => {
      if (overlay.hidden || getSlides().length < 2) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) show(index + 1);
      else show(index - 1);
    },
    { passive: true }
  );

  document.addEventListener('keydown', onKeydown);

  document.addEventListener('kt-lang-change', () => {
    overlay.setAttribute('aria-label', tr('ui.lightbox.title', 'Vergrößertes Bild'));
    btnClose.setAttribute('aria-label', tr('btn.close', 'Schließen'));
    btnPrev.setAttribute('aria-label', tr('ui.lightbox.prev', 'Vorheriges Bild'));
    btnNext.setAttribute('aria-label', tr('ui.lightbox.next', 'Nächstes Bild'));
    thumbsWrap.setAttribute('aria-label', tr('ui.lightbox.thumbs', 'Galerie-Vorschau'));
    updateGalleryAria();
    if (!overlay.hidden) {
      const slides = getSlides();
      if (slides[index]) {
        caption.textContent = slides[index].img.alt;
        lightboxImg.alt = slides[index].img.alt;
      }
    }
  });
})();
