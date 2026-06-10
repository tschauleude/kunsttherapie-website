const EVENTS_API_URL = window.location.origin + '/api';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

function eventsLocale() {
  return window.ktI18n?.getLocale?.() || 'de-DE';
}

function formatEventDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(eventsLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function metaLine(key, value) {
  const tpl = window.ktI18n?.t(key);
  if (!tpl) return String(value);
  return tpl.replace('{value}', String(value));
}

function renderEventCard(item) {
  const date = formatEventDate(item.date);
  const imageHtml = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="" class="event-image"/>`
    : `<div class="event-image event-image-placeholder">${window.ktI18n?.t('eventsPage.cardDate') || 'Termin'}</div>`;

  const meta = [
    date,
    item.time ? metaLine('eventsPage.metaTime', item.time) : null,
    item.location ? metaLine('eventsPage.metaLocation', item.location) : null,
    item.capacity ? metaLine('eventsPage.metaCapacity', item.capacity) : null,
  ].filter(Boolean);

  return `
    <div class="event-card card card--clickable">
      ${imageHtml}
      <div class="event-content">
        <div class="event-date">${escapeHtml(date)}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <div class="event-meta">
          ${meta.map((m) => `<span>${escapeHtml(m)}</span>`).join('')}
        </div>
        <p>${escapeHtml(item.description)}</p>
        <a href="kontakt" class="event-cta card-hit-area">${window.ktI18n?.t('eventsPage.signUp') || 'Anmelden'}</a>
      </div>
    </div>
  `;
}

let cachedEvents = null;

function renderEventsList(events) {
  const empty = document.getElementById('eventsEmpty');
  const list = document.getElementById('eventsList');
  if (!list) return;

  if (!events.length) {
    if (empty) empty.style.display = 'block';
    list.innerHTML = '';
    return;
  }

  if (empty) empty.style.display = 'none';
  list.innerHTML = events.map(renderEventCard).join('');
  if (window.ktInitCardClickable) window.ktInitCardClickable(list);
  if (window.revealStagger) {
    window.revealStagger(list.querySelectorAll('.event-card'));
  }
}

async function loadEvents({ refetch = true } = {}) {
  const loading = document.getElementById('eventsLoading');
  const empty = document.getElementById('eventsEmpty');
  const list = document.getElementById('eventsList');
  if (!list) return;

  if (!refetch && cachedEvents) {
    renderEventsList(cachedEvents);
    return;
  }

  try {
    const response = await fetch(`${EVENTS_API_URL}/events`);
    if (!response.ok) throw new Error('Events laden fehlgeschlagen');
    const events = await response.json();
    cachedEvents = events;

    if (loading) loading.style.display = 'none';

    if (!events.length) {
      if (empty) empty.style.display = 'block';
      return;
    }

    renderEventsList(events);
  } catch (err) {
    if (loading) {
      const errText =
        window.ktI18n?.t('eventsPage.error') ||
        'Termine konnten gerade nicht geladen werden. Bitte später erneut versuchen.';
      loading.innerHTML = `<p style="color:var(--text-light)">${errText}</p>`;
    }
    console.error('Events load error:', err);
  }
}

document.addEventListener('kt-lang-change', () => {
  if (document.getElementById('eventsList')) loadEvents({ refetch: false });
});

document.addEventListener('DOMContentLoaded', loadEvents);
