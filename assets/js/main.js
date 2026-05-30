(() => {
  const yearEl = document.getElementById("y");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const canvas = document.querySelector("[data-art]");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const colorInput = document.querySelector("[data-color]");
  const sizeInput = document.querySelector("[data-size]");
  const clearButton = document.querySelector("[data-clear]");
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  canvas.style.touchAction = "none";

  const getBrushColor = () => (colorInput ? colorInput.value : "#d4a574");
  const getBrushSize = () => {
    if (!sizeInput) {
      return 8;
    }

    const parsed = Number(sizeInput.value);
    return Number.isFinite(parsed) ? parsed : 8;
  };

  const applyBrushSettings = () => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = getBrushColor();
    ctx.lineWidth = getBrushSize();
  };

  const getCoordinates = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const resizeCanvas = () => {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    applyBrushSettings();
  };

  const startDrawing = (event) => {
    drawing = true;
    const pos = getCoordinates(event);
    lastX = pos.x;
    lastY = pos.y;
  };

  const draw = (event) => {
    if (!drawing) {
      return;
    }

    const pos = getCoordinates(event);
    applyBrushSettings();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  };

  const stopDrawing = () => {
    drawing = false;
  };

  if (colorInput) {
    colorInput.addEventListener("input", applyBrushSettings);
  }

  if (sizeInput) {
    sizeInput.addEventListener("input", applyBrushSettings);
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    });
  }

  canvas.addEventListener("pointerdown", startDrawing);
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointerleave", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);
  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
})();
