// Kunsttherapie Paderborn – gemeinsames Frontend-Skript
// Wird auf allen Seiten eingebunden und arbeitet defensiv:
// Funktionen laufen nur, wenn die zugehörigen Elemente existieren.

(function () {
  "use strict";

  function setFooterYear() {
    var yearEl = document.getElementById("y");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  // Interaktives Mini-Atelier (nur auf der Startseite vorhanden)
  function initCanvas() {
    var canvas = document.querySelector("[data-art]");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var colorInput = document.querySelector("[data-color]");
    var sizeInput = document.querySelector("[data-size]");
    var clearBtn = document.querySelector("[data-clear]");

    var drawing = false;
    var lastX = 0;
    var lastY = 0;

    function resizeCanvas() {
      // Inhalt sichern, damit beim Resize nicht gelöscht wird
      var snapshot = null;
      if (canvas.width > 0 && canvas.height > 0) {
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (snapshot) {
        ctx.putImageData(snapshot, 0, 0);
      }
    }

    function pointerPos(evt) {
      var rect = canvas.getBoundingClientRect();
      var point = evt.touches && evt.touches.length ? evt.touches[0] : evt;
      return {
        x: point.clientX - rect.left,
        y: point.clientY - rect.top,
      };
    }

    function startDraw(evt) {
      drawing = true;
      var pos = pointerPos(evt);
      lastX = pos.x;
      lastY = pos.y;
    }

    function draw(evt) {
      if (!drawing) return;
      evt.preventDefault();
      var pos = pointerPos(evt);
      ctx.strokeStyle = colorInput ? colorInput.value : "#d4a574";
      ctx.lineWidth = sizeInput ? Number(sizeInput.value) : 8;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    }

    function stopDraw() {
      drawing = false;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stopDraw);

    canvas.addEventListener("touchstart", startDraw, { passive: true });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setFooterYear();
    initCanvas();
  });
})();
