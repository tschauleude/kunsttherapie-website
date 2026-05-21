const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const currentPage = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll("[data-nav-links] a").forEach((link) => {
  const href = link.getAttribute("href");
  if (href === currentPage || (currentPage === "" && href === "index.html")) {
    link.classList.add("active");
  }
});

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 })
  : null;

document.querySelectorAll(".reveal").forEach((element) => {
  if (revealObserver) {
    revealObserver.observe(element);
  } else {
    element.classList.add("visible");
  }
});

const canvas = document.querySelector("#atelierCanvas");
if (canvas instanceof HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  const swatches = Array.from(document.querySelectorAll("[data-color]"));
  const sizeInput = document.querySelector("#brushSize");
  const clearButton = document.querySelector("[data-clear-canvas]");
  let drawing = false;
  let lastPoint = null;
  let color = swatches[0]?.getAttribute("data-color") || "#d4a574";
  let brushSize = sizeInput instanceof HTMLInputElement ? Number(sizeInput.value) : 18;

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    paintPaper();
  };

  const paintPaper = () => {
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#fffaf0");
    gradient.addColorStop(1, "#f5ead7");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    for (let i = 0; i < 18; i += 1) {
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = i % 2 ? "#d4a574" : "#5b8fc4";
      ctx.beginPath();
      ctx.arc(Math.random() * rect.width, Math.random() * rect.height, 10 + Math.random() * 24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const pointFromEvent = (event) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const clientY = event.touches?.[0]?.clientY ?? event.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const draw = (point) => {
    if (!ctx || !lastPoint) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, point.x, point.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    lastPoint = point;
  };

  const start = (event) => {
    event.preventDefault();
    drawing = true;
    lastPoint = pointFromEvent(event);
  };

  const move = (event) => {
    if (!drawing) return;
    event.preventDefault();
    draw(pointFromEvent(event));
  };

  const end = () => {
    drawing = false;
    lastPoint = null;
  };

  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      color = swatch.getAttribute("data-color") || color;
      swatches.forEach((item) => item.classList.remove("active"));
      swatch.classList.add("active");
    });
  });

  if (sizeInput instanceof HTMLInputElement) {
    sizeInput.addEventListener("input", () => {
      brushSize = Number(sizeInput.value);
    });
  }

  clearButton?.addEventListener("click", paintPaper);
  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
}

const contactForm = document.querySelector("[data-contact-form]");
if (contactForm instanceof HTMLFormElement) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const subject = encodeURIComponent(String(formData.get("topic") || "Kunsttherapie Anfrage"));
    const body = encodeURIComponent([
      `Name: ${formData.get("name") || ""}`,
      `E-Mail: ${formData.get("email") || ""}`,
      `Telefon: ${formData.get("phone") || ""}`,
      "",
      String(formData.get("message") || "")
    ].join("\n"));

    window.location.href = `mailto:info@kunsttherapie-pb.de?subject=${subject}&body=${body}`;
  });
}
