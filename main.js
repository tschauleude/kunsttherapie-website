(function () {
  const yearNode = document.getElementById("y");
  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.style.borderColor = "rgba(185, 111, 101, 0.35)";
      link.style.background = "rgba(185, 111, 101, 0.11)";
      link.style.color = "#9e5349";
    }
  });

  const canvas = document.querySelector("canvas[data-art]");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const colorInput = document.querySelector("input[data-color]");
  const sizeInput = document.querySelector("input[data-size]");
  const clearButton = document.querySelector("button[data-clear]");
  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Keep previously painted strokes when viewport changes.
    if (snapshot.width > 0 && snapshot.height > 0) {
      const offscreen = document.createElement("canvas");
      offscreen.width = snapshot.width;
      offscreen.height = snapshot.height;
      offscreen.getContext("2d").putImageData(snapshot, 0, 0);
      ctx.drawImage(offscreen, 0, 0, rect.width, rect.height);
    }
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const source = event.touches ? event.touches[0] : event;
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top
    };
  }

  function startDraw(event) {
    drawing = true;
    const point = pointerPosition(event);
    lastX = point.x;
    lastY = point.y;
  }

  function draw(event) {
    if (!drawing) return;
    event.preventDefault();

    const point = pointerPosition(event);
    ctx.strokeStyle = colorInput ? colorInput.value : "#b96f65";
    ctx.lineWidth = sizeInput ? Number(sizeInput.value) : 8;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastX = point.x;
    lastY = point.y;
  }

  function stopDraw() {
    drawing = false;
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  window.addEventListener("mouseup", stopDraw);
  canvas.addEventListener("mouseleave", stopDraw);

  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", stopDraw);

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
})();
