(function () {
  // Aktuelles Jahr im Footer
  document.querySelectorAll("[data-year], #y").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Sanftes Einblenden beim Scrollen
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  // Mini-Atelier (Canvas)
  var canvas = document.querySelector("[data-art]");
  if (!canvas) return;

  var colorInput = document.querySelector("[data-color]");
  var sizeInput = document.querySelector("[data-size]");
  var clearButton = document.querySelector("[data-clear]");
  var context = canvas.getContext("2d");
  var drawing = false;
  var lastPoint = null;

  function paintBackground(width, height) {
    context.fillStyle = "#fbf6fb";
    context.fillRect(0, 0, width, height);
  }

  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * window.devicePixelRatio));
    canvas.height = Math.max(1, Math.floor(rect.height * window.devicePixelRatio));
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    paintBackground(rect.width, rect.height);
  }

  function pointFromEvent(event) {
    var rect = canvas.getBoundingClientRect();
    var touch = event.touches && event.touches[0];
    var clientX = touch ? touch.clientX : event.clientX;
    var clientY = touch ? touch.clientY : event.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function drawTo(point) {
    if (!lastPoint) lastPoint = point;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = colorInput ? colorInput.value : "#e05ed6";
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
    if (!drawing) return;
    drawTo(pointFromEvent(event));
    event.preventDefault();
  }

  function stopDrawing() {
    drawing = false;
    lastPoint = null;
  }

  resizeCanvas();
  window.addEventListener("resize", function () {
    var data = context.getImageData(0, 0, canvas.width, canvas.height);
    resizeCanvas();
    context.putImageData(data, 0, 0);
  });
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", moveDrawing);
  window.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("touchstart", startDrawing, { passive: false });
  canvas.addEventListener("touchmove", moveDrawing, { passive: false });
  window.addEventListener("touchend", stopDrawing);

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      var rect = canvas.getBoundingClientRect();
      paintBackground(rect.width, rect.height);
    });
  }
})();
