// Navigation year + gallery lightbox + mini canvas atelier
(function () {
  const yearEl = document.getElementById('y');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initGalleryLightbox();

  function initGalleryLightbox() {
    const gallery = document.querySelector('[data-gallery]');
    if (!gallery) return;

    const triggers = [...gallery.querySelectorAll('[data-gallery-open] img')];
    if (!triggers.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    function tr(key, fallback) {
      const v = window.ktI18n?.t(key);
      return v != null ? v : fallback;
    }

    overlay.setAttribute('aria-label', tr('ui.lightbox.title', 'Vergrößertes Bild'));
    overlay.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="${tr('btn.close', 'Schließen')}">&times;</button>
      <button type="button" class="lightbox-nav lightbox-prev" aria-label="${tr('ui.lightbox.prev', 'Vorheriges Bild')}">&#8249;</button>
      <button type="button" class="lightbox-nav lightbox-next" aria-label="${tr('ui.lightbox.next', 'Nächstes Bild')}">&#8250;</button>
      <figure class="lightbox-dialog">
        <img class="lightbox-img" src="" alt=""/>
        <figcaption class="lightbox-caption"></figcaption>
      </figure>
    `;
    document.body.appendChild(overlay);

    const lightboxImg = overlay.querySelector('.lightbox-img');
    const caption = overlay.querySelector('.lightbox-caption');
    const btnClose = overlay.querySelector('.lightbox-close');
    const btnPrev = overlay.querySelector('.lightbox-prev');
    const btnNext = overlay.querySelector('.lightbox-next');
    let index = 0;

    function show(i) {
      index = (i + triggers.length) % triggers.length;
      const img = triggers[index];
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      caption.textContent = img.alt;
      overlay.hidden = false;
      document.body.classList.add('lightbox-open');
      btnClose.focus();
    }

    function close() {
      overlay.hidden = true;
      document.body.classList.remove('lightbox-open');
      lightboxImg.removeAttribute('src');
    }

    gallery.querySelectorAll('[data-gallery-open]').forEach((btn, i) => {
      btn.addEventListener('click', () => show(i));
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
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
      if (overlay.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }

})();
