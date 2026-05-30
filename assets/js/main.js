(() => {
  const footerYear = document.getElementById("y");
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  const canvas = document.querySelector("canvas[data-art]");
  if (!canvas) {
    return;
  }

  const colorInput = document.querySelector("input[data-color]");
  const sizeInput = document.querySelector("input[data-size]");
  const clearButton = document.querySelector("button[data-clear]");
  const ctx = canvas.getContext("2d");

  const resizeCanvas = () => {
    const ratio = window.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(bounds.width * ratio));
    canvas.height = Math.max(1, Math.floor(bounds.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  const getPos = (event) => {
    const bounds = canvas.getBoundingClientRect();
    const source = event.touches ? event.touches[0] : event;
    return {
      x: source.clientX - bounds.left,
      y: source.clientY - bounds.top,
    };
  };

  const getColor = () => (colorInput ? colorInput.value : "#d4a574");
  const getSize = () => (sizeInput ? Number(sizeInput.value) : 8);

  const startDraw = (event) => {
    drawing = true;
    const pos = getPos(event);
    lastX = pos.x;
    lastY = pos.y;
  };

  const draw = (event) => {
    if (!drawing) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const pos = getPos(event);
    ctx.strokeStyle = getColor();
    ctx.lineWidth = getSize();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  };

  const stopDraw = () => {
    drawing = false;
  };

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  window.addEventListener("mouseup", stopDraw);
  canvas.addEventListener("mouseleave", stopDraw);

  canvas.addEventListener("touchstart", startDraw, { passive: true });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", stopDraw, { passive: true });

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
})();
