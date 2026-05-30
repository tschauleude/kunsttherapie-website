(function () {
  const year = document.getElementById("y");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a[href]").forEach((link) => {
    const target = link.getAttribute("href");
    if (target === current) {
      link.setAttribute("aria-current", "page");
    }
  });

  const canvas = document.querySelector("[data-art]");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const colorInput = document.querySelector("[data-color]");
  const sizeInput = document.querySelector("[data-size]");
  const clearButton = document.querySelector("[data-clear]");
  let drawing = false;
  let last = null;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches ? event.touches[0] : event;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  function start(event) {
    drawing = true;
    last = pointFromEvent(event);
    event.preventDefault();
  }

  function draw(event) {
    if (!drawing || !last) {
      return;
    }

    const next = pointFromEvent(event);
    ctx.strokeStyle = colorInput ? colorInput.value : "#c47a56";
    ctx.lineWidth = sizeInput ? Number(sizeInput.value) : 8;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    last = next;
    event.preventDefault();
  }

  function stop() {
    drawing = false;
    last = null;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", draw);
  window.addEventListener("mouseup", stop);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  window.addEventListener("touchend", stop);

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
})();
