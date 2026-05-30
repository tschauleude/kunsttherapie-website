document.addEventListener('DOMContentLoaded', () => {
  const yearTarget = document.getElementById('y');
  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }

  const canvas = document.querySelector('[data-art]');
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const colorInput = document.querySelector('[data-color]');
  const sizeInput = document.querySelector('[data-size]');
  const clearButton = document.querySelector('[data-clear]');
  let isDrawing = false;

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const getPoint = (event) => {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches && event.touches[0];
    const source = touch || event;

    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    const point = getPoint(event);

    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!isDrawing) {
      return;
    }

    event.preventDefault();
    const point = getPoint(event);

    ctx.strokeStyle = colorInput ? colorInput.value : '#d4a574';
    ctx.lineWidth = sizeInput ? Number(sizeInput.value) : 8;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing = false;
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
  canvas.addEventListener('touchcancel', stopDrawing);

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
});
