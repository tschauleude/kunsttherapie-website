/**
 * Wendet Admin-Bild-Overrides auf [data-site-image] an (Fallback: HTML-Standard).
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

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
    } catch (_) {
      /* statisches Hosting ohne API */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySiteImages);
  } else {
    applySiteImages();
  }
})();
