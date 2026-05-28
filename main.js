(function () {
  const year = document.getElementById("y");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const canvas = document.querySelector("[data-art]");
  if (!canvas) {
    return;
  }

  const colorInput = document.querySelector("[data-color]");
  const sizeInput = document.querySelector("[data-size]");
  const clearButton = document.querySelector("[data-clear]");
  const context = canvas.getContext("2d");
  let drawing = false;
  let lastPoint = null;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const image = context.getImageData(0, 0, canvas.width || 1, canvas.height || 1);
    canvas.width = Math.max(1, Math.floor(rect.width * window.devicePixelRatio));
    canvas.height = Math.max(1, Math.floor(rect.height * window.devicePixelRatio));
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, rect.width, rect.height);

    if (image.width > 1 && image.height > 1) {
      context.putImageData(image, 0, 0);
    }
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches && event.touches[0];
    const clientX = touch ? touch.clientX : event.clientX;
    const clientY = touch ? touch.clientY : event.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function drawTo(point) {
    if (!lastPoint) {
      lastPoint = point;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = colorInput ? colorInput.value : "#9c3ae8";
    context.lineWidth = sizeInput ? Number(sizeInput.value) : 8;
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPoint = point;
  }

  function startDrawing(event) {
    drawing = true;
    lastPoint = pointFromEvent(event);
    drawTo(lastPoint);
    event.preventDefault();
  }

  function moveDrawing(event) {
    if (!drawing) {
      return;
    }
    drawTo(pointFromEvent(event));
    event.preventDefault();
  }

  function stopDrawing() {
    drawing = false;
    lastPoint = null;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", moveDrawing);
  window.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("touchstart", startDrawing, { passive: false });
  canvas.addEventListener("touchmove", moveDrawing, { passive: false });
  window.addEventListener("touchend", stopDrawing);

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      const rect = canvas.getBoundingClientRect();
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, rect.width, rect.height);
    });
  }
})();
