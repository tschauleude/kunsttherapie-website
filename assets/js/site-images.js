/**
 * Wendet Admin-Bild-Overrides auf [data-site-image] an (Fallback: HTML-Standard).
 * Steuert außerdem, wie viele Galerie-Bilder auf der Startseite sichtbar sind.
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const GALLERY_LAYOUT_CLASSES = [
    'image-gallery--duo',
    'image-gallery--trio',
    'image-gallery--six',
  ];

  function applyToElement(el, url) {
    if (!url) return;

    if (el.tagName === 'IMG') {
      el.src = url;
      const picture = el.closest('picture');
      if (picture) {
        picture.querySelectorAll('source').forEach((source) => source.remove());
      }
      return;
    }

    const img = el.querySelector('img');
    if (img) applyToElement(img, url);
  }

  function applyGalleryCount(count) {
    const gallery = document.querySelector('[data-gallery]');
    if (!gallery) return;

    const safe = Math.min(6, Math.max(1, Number.parseInt(count, 10) || 6));
    const items = [...gallery.querySelectorAll('[data-gallery-open]')];

    items.forEach((item, i) => {
      const show = i < safe;
      item.hidden = !show;
    });

    items.forEach((item) => item.classList.remove('gallery-item--wide'));

    GALLERY_LAYOUT_CLASSES.forEach((cls) => gallery.classList.remove(cls));

    if (safe <= 2) gallery.classList.add('image-gallery--duo');
    else if (safe === 3) gallery.classList.add('image-gallery--trio');
    else if (safe >= 5) gallery.classList.add('image-gallery--six');

    const lastVisible = items[safe - 1];
    if (lastVisible && safe === 5) {
      lastVisible.classList.add('gallery-item--wide');
    }

    gallery.dataset.galleryCount = String(safe);
    document.dispatchEvent(new CustomEvent('kt-gallery-count', { detail: { count: safe } }));
  }

  window.ktApplyGalleryCount = applyGalleryCount;

  async function applySiteImages() {
    try {
      const res = await fetch('/api/site-images', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();
      const images = data.images || {};

      document.querySelectorAll('[data-site-image]').forEach((el) => {
        const slot = el.getAttribute('data-site-image');
        const url = images[slot];
        if (!url) return;
        applyToElement(el, url);
      });

      if (data.galleryCount != null) {
        applyGalleryCount(data.galleryCount);
      }
    } catch (_) {
      /* statisches Hosting ohne API */
    }
  }

  function initGalleryLayout() {
    const gallery = document.querySelector('[data-gallery]');
    if (!gallery) return;
    const preset = gallery.dataset.galleryCount;
    applyGalleryCount(preset ? Number(preset) : 6);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initGalleryLayout();
      applySiteImages();
    });
  } else {
    initGalleryLayout();
    applySiteImages();
  }
})();
