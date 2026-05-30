function initCanvasAtelier() {
  const canvas = document.querySelector("[data-art]");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const colorInput = document.querySelector("[data-color]");
  const sizeInput = document.querySelector("[data-size]");
  const clearButton = document.querySelector("[data-clear]");

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let drawing = false;
  let last = { x: 0, y: 0 };

  function getPos(event) {
    const bounds = canvas.getBoundingClientRect();
    if (event.touches && event.touches[0]) {
      return {
        x: event.touches[0].clientX - bounds.left,
        y: event.touches[0].clientY - bounds.top
      };
    }

    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    };
  }

  function start(event) {
    drawing = true;
    last = getPos(event);
  }

  function move(event) {
    if (!drawing) return;
    event.preventDefault();
    const current = getPos(event);
    ctx.strokeStyle = colorInput?.value || "#ba8a63";
    ctx.lineWidth = Number(sizeInput?.value || 8);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
    last = current;
  }

  function stop() {
    drawing = false;
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseup", stop);
  canvas.addEventListener("mouseleave", stop);

  canvas.addEventListener("touchstart", start, { passive: true });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", stop);
  canvas.addEventListener("touchcancel", stop);

  clearButton?.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

function markActiveNavLink() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    if (href === path) {
      link.style.background = "rgba(186, 138, 99, 0.14)";
      link.style.color = "#3b332e";
    }
  });
}

function initYearPlaceholders() {
  const yearEl = document.getElementById("y");
  if (yearEl && !yearEl.textContent.trim()) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

document.addEventListener("DOMContentLoaded", () => {
  markActiveNavLink();
  initCanvasAtelier();
  initYearPlaceholders();
});
