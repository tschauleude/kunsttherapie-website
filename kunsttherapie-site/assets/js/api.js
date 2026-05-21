const API_BASE = window.KUNSTTHERAPIE_CONFIG?.apiBase || window.KUNSTTHERAPIE_API_BASE || "http://localhost:3000/api";

const fallback = {
  news: [
    {
      title: "Neue kreative Gruppen starten",
      content: "Kleine, geschützte Gruppen für Menschen, die über Farbe, Ton und Collage wieder in Kontakt mit den eigenen Ressourcen kommen möchten.",
      date: "2026-06-04",
      status: "published"
    },
    {
      title: "Offenes Atelier: Kunst als Auszeit",
      content: "Ein niedrigschwelliger Abend zum Ankommen, Ausprobieren und Kraft schöpfen. Keine Vorerfahrung nötig.",
      date: "2026-06-18",
      status: "published"
    }
  ],
  events: [
    {
      title: "Workshop: Aquarell & innere Landschaften",
      description: "Ein ruhiger Kunsttherapie-Workshop mit Impulsen, Materialerkundung und gemeinsamer Reflexion.",
      event_date: "2026-06-20",
      event_time: "17:30",
      location: "Otto-Stadler-Str. 23c, Paderborn",
      capacity: "8 Plätze",
      status: "published"
    }
  ],
  services: [
    {
      title: "Einzelbegleitung",
      description: "Individuelle kunsttherapeutische Begleitung in einem achtsamen, ressourcenorientierten Rahmen.",
      price: "auf Anfrage",
      duration: "60-90 Minuten",
      active: 1
    },
    {
      title: "Gruppenangebote",
      description: "Kleine Gruppen mit Ton, Farbe, Collage und kreativen Methoden zur Stärkung von Ausdruck und Selbstwirksamkeit.",
      price: "ab 55 EUR",
      duration: "fortlaufend",
      active: 1
    }
  ]
};

const formatDate = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
};

async function fetchCollection(name) {
  try {
    const response = await fetch(`${API_BASE}/${name}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`API antwortet mit ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) && data.length ? { data, source: "api" } : { data: fallback[name], source: "fallback" };
  } catch (error) {
    console.info(`Nutze lokale Demo-Daten fuer ${name}:`, error.message);
    return { data: fallback[name], source: "fallback" };
  }
}

function setState(target, source) {
  if (!target) return;
  target.textContent = source === "api"
    ? "Aktuelle Inhalte aus dem Atelier-CMS."
    : "Aktuelle Hinweise - auch ohne laufenden Server sauber vorbereitet.";
}

async function renderNews() {
  const list = document.querySelector("[data-news-list]");
  if (!list) return;
  const state = document.querySelector("[data-api-state]");
  const { data, source } = await fetchCollection("news");
  setState(state, source);

  list.innerHTML = data.map((item) => `
    <article class="card pad reveal visible">
      <span class="eyebrow">${formatDate(item.date || item.created_at)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.content || item.text || "")}</p>
      <div class="tag-list">
        <span class="tag">Kunsttherapie</span>
        <span class="tag">Paderborn</span>
      </div>
    </article>
  `).join("");
}

async function renderEvents() {
  const list = document.querySelector("[data-events-list]");
  if (!list) return;
  const state = document.querySelector("[data-api-state]");
  const { data, source } = await fetchCollection("events");
  setState(state, source);

  list.innerHTML = data.map((item) => `
    <article class="timeline-item reveal visible">
      <div class="timeline-date">${formatDate(item.event_date || item.date).replace(" ", "<br>")}</div>
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description || "")}</p>
        <div class="tag-list">
          ${item.event_time ? `<span class="tag">${escapeHtml(item.event_time)} Uhr</span>` : ""}
          ${item.location ? `<span class="tag">${escapeHtml(item.location)}</span>` : ""}
          ${item.capacity ? `<span class="tag">${escapeHtml(String(item.capacity))}</span>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

async function renderServices() {
  const list = document.querySelector("[data-services-list]");
  if (!list) return;
  const { data } = await fetchCollection("services");

  list.innerHTML = data.filter((item) => item.active !== 0).map((item) => `
    <article class="card pad reveal visible">
      <div class="icon-bloom"></div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description || "")}</p>
      <div class="price">${escapeHtml(item.price || "auf Anfrage")} <small>${escapeHtml(item.duration || "")}</small></div>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderNews();
renderEvents();
renderServices();
