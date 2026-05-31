(function () {
  const root = document.querySelector('.page-kunsttherapie');
  if (!root) return;

  const offersWrap = root.querySelector('.kt-offers');
  const swatches = root.querySelectorAll('.kt-swatch');
  const scribble = root.querySelector('[data-scribble]');

  swatches.forEach((btn) => {
    btn.addEventListener('click', () => {
      swatches.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      if (offersWrap) {
        offersWrap.dataset.accentTheme = btn.dataset.accent || 'teal';
      }
    });
  });

  root.querySelectorAll('[data-offer]').forEach((card) => {
    const toggle = card.querySelector('.kt-toggle');
    const body = card.querySelector('.kt-offer-body');
    if (!toggle || !body) return;

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      root.querySelectorAll('[data-offer] .kt-toggle').forEach((t) => {
        t.setAttribute('aria-expanded', 'false');
        t.textContent = 'Mehr erfahren';
      });
      root.querySelectorAll('[data-offer] .kt-offer-body').forEach((b) => {
        b.hidden = true;
      });
      root.querySelectorAll('[data-offer]').forEach((c) => c.classList.remove('is-open'));

      if (!open) {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.textContent = 'Weniger';
        body.hidden = false;
        card.classList.add('is-open');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  if (!scribble) return;
  const ctx = scribble.getContext('2d');
  let drawing = false;
  const colors = {
    teal: '#557a76',
    rose: '#d18d89',
    sage: '#8fad9e',
    clay: '#c4a574',
    violet: '#9b8aa8',
  };

  function currentColor() {
    const active = root.querySelector('.kt-swatch.active');
    return colors[active?.dataset.accent] || colors.teal;
  }

  function resize() {
    const rect = scribble.getBoundingClientRect();
    scribble.width = rect.width * devicePixelRatio;
    scribble.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  resize();
  window.addEventListener('resize', resize);

  function pos(e) {
    const rect = scribble.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
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
    ctx.strokeStyle = currentColor();
    ctx.lineWidth = 3;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    e.preventDefault();
  }

  function stop() {
    drawing = false;
  }

  scribble.addEventListener('mousedown', start);
  scribble.addEventListener('mousemove', draw);
  scribble.addEventListener('mouseup', stop);
  scribble.addEventListener('mouseleave', stop);
  scribble.addEventListener('touchstart', start, { passive: false });
  scribble.addEventListener('touchmove', draw, { passive: false });
  scribble.addEventListener('touchend', stop);
})();
