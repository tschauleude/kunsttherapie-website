// Kunsttherapie Paderborn – Haupt-Skript
// Navigation, Footer-Jahr und interaktives Mini-Atelier (Canvas)

(function () {
  "use strict";

  // Aktuelles Jahr im Footer setzen (falls vorhanden)
  function setFooterYear() {
    var yearEl = document.getElementById("y");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  // Aktiven Navigationspunkt anhand der URL markieren
  function markActiveNav() {
    var current = window.location.pathname.split("/").pop() || "index.html";
    var links = document.querySelectorAll("nav a[href]");
    links.forEach(function (link) {
      var href = link.getAttribute("href");
      if (href === current) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  // Interaktives Mini-Atelier (Zeichen-Canvas)
  function setupCanvas() {
    var canvas = document.querySelector("[data-art]");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    var colorInput = document.querySelector("[data-color]");
    var sizeInput = document.querySelector("[data-size]");
    var clearBtn = document.querySelector("[data-clear]");

    var drawing = false;
    var lastX = 0;
    var lastY = 0;

    // Canvas an die Container-Breite anpassen (mit Geräte-Pixeldichte)
    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      var displayWidth = rect.width || canvas.parentElement.clientWidth || 600;
      var displayHeight = 360;

      canvas.style.height = displayHeight + "px";
      canvas.width = Math.round(displayWidth * dpr);
      canvas.height = Math.round(displayHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    function pointerPos(e) {
      var rect = canvas.getBoundingClientRect();
      var point = e.touches && e.touches.length ? e.touches[0] : e;
      return {
        x: point.clientX - rect.left,
        y: point.clientY - rect.top
      };
    }

    function start(e) {
      drawing = true;
      var p = pointerPos(e);
      lastX = p.x;
      lastY = p.y;
    }

    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      var p = pointerPos(e);
      ctx.strokeStyle = colorInput ? colorInput.value : "#d4a574";
      ctx.lineWidth = sizeInput ? Number(sizeInput.value) : 8;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastX = p.x;
      lastY = p.y;
    }

    function stop() {
      drawing = false;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);

    canvas.addEventListener("touchstart", start, { passive: true });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", stop);

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setFooterYear();
    markActiveNav();
    setupCanvas();
  });
})();
