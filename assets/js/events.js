const EVENTS_API_URL = window.location.origin + '/api';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

function formatEventDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderEventCard(item) {
  const date = formatEventDate(item.date);
  const imageHtml = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="" class="event-image"/>`
    : `<div class="event-image event-image-placeholder">Termin</div>`;

  const meta = [
    date,
    item.time ? `Uhrzeit: ${item.time}` : null,
    item.location ? `Ort: ${item.location}` : null,
    item.capacity ? `${item.capacity} Plätze` : null,
  ].filter(Boolean);

  return `
    <div class="event-card">
      ${imageHtml}
      <div class="event-content">
        <div class="event-date">${escapeHtml(date)}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <div class="event-meta">
          ${meta.map((m) => `<span>${escapeHtml(m)}</span>`).join('')}
        </div>
        <p>${escapeHtml(item.description)}</p>
        <a href="kontakt.html" class="event-cta">Anmelden</a>
      </div>
    </div>
  `;
}

async function loadEvents() {
  const loading = document.getElementById('eventsLoading');
  const empty = document.getElementById('eventsEmpty');
  const list = document.getElementById('eventsList');
  if (!list) return;

  try {
    const response = await fetch(`${EVENTS_API_URL}/events`);
    if (!response.ok) throw new Error('Events laden fehlgeschlagen');
    const events = await response.json();

    if (loading) loading.style.display = 'none';

    if (!events.length) {
      if (empty) empty.style.display = 'block';
      return;
    }

    list.innerHTML = events.map(renderEventCard).join('');
  } catch (err) {
    if (loading) {
      loading.innerHTML =
        '<p style="color:var(--text-light)">Termine konnten gerade nicht geladen werden. Bitte später erneut versuchen.</p>';
    }
    console.error('Events load error:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadEvents);
