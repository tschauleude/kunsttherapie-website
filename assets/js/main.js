// Navigation year + mini canvas atelier
(function () {
  const yearEl = document.getElementById('y');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
