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
    overlay.setAttribute('aria-label', 'Vergrößertes Bild');
    overlay.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="Schließen">&times;</button>
      <button type="button" class="lightbox-nav lightbox-prev" aria-label="Vorheriges Bild">&#8249;</button>
      <button type="button" class="lightbox-nav lightbox-next" aria-label="Nächstes Bild">&#8250;</button>
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

  const canvas = document.querySelector('canvas[data-art]');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let drawing = false;
  let color = '#d4a574';
  let size = 4;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  resize();
  window.addEventListener('resize', resize);

  const colorInput = document.querySelector('[data-color]');
  const sizeInput = document.querySelector('[data-size]');
  const clearBtn = document.querySelector('[data-clear]');

  if (colorInput) colorInput.addEventListener('input', (e) => { color = e.target.value; });
  if (sizeInput) sizeInput.addEventListener('input', (e) => { size = Number(e.target.value) || 4; });
  if (clearBtn) clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  function pos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }

  function start(e) {
    drawing = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.preventDefault();
  }

  function draw(e) {
    if (!drawing) return;
    const p = pos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    e.preventDefault();
  }

  function stop() {
    drawing = false;
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stop);
})();
