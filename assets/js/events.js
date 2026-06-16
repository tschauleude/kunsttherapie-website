const EVENTS_API_URL = window.location.origin + '/api';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

// ── Event Registration Modal ──────────────────────────────────────────────────

let regModal = null;
let regCurrentEventId = null;
let regCurrentEventTitle = '';

function tr(key, fallback) {
  const v = window.ktI18n?.t(key);
  return v != null ? v : (fallback || key);
}

function buildRegModal() {
  if (regModal) return;
  regModal = document.createElement('div');
  regModal.id = 'eventRegModal';
  regModal.className = 'event-reg-modal';
  regModal.hidden = true;
  regModal.setAttribute('role', 'dialog');
  regModal.setAttribute('aria-modal', 'true');
  regModal.setAttribute('aria-labelledby', 'eventRegTitle');
  regModal.innerHTML = `
    <div class="event-reg-backdrop" id="eventRegBackdrop"></div>
    <div class="event-reg-panel card">
      <button type="button" class="event-reg-close" id="eventRegClose" aria-label="${tr('btn.close', 'Schließen')}">&times;</button>
      <h2 id="eventRegTitle">${tr('eventsPage.register.title', 'Anmeldung')}</h2>
      <p class="sub" id="eventRegSubtitle"></p>
      <form id="eventRegForm" novalidate>
        <input type="text" name="website" class="visually-hidden" tabindex="-1" autocomplete="off"/>
        <input type="hidden" name="_formAt"/>
        <div class="form-group">
          <label for="regName">${tr('form.name', 'Name')} *</label>
          <input type="text" id="regName" name="name" required autocomplete="name" placeholder="${tr('form.name', 'Name')}"/>
        </div>
        <div class="form-group">
          <label for="regEmail">${tr('form.email', 'E-Mail')} *</label>
          <input type="email" id="regEmail" name="email" required autocomplete="email" placeholder="${tr('form.email', 'E-Mail')}"/>
        </div>
        <div class="form-group">
          <label for="regPhone">${tr('form.phone', 'Telefon (optional)')}</label>
          <input type="tel" id="regPhone" name="phone" autocomplete="tel" placeholder="${tr('form.phone', 'Telefon (optional)')}"/>
        </div>
        <div class="form-group">
          <label for="regMessage">${tr('eventsPage.register.message', 'Nachricht / Fragen (optional)')}</label>
          <textarea id="regMessage" name="message" rows="3" placeholder="${tr('eventsPage.register.messagePlaceholder', 'Gibt es etwas, das ich wissen sollte?')}"></textarea>
        </div>
        <div class="event-reg-actions">
          <button type="submit" class="btn primary" id="eventRegSubmit">${tr('eventsPage.register.submit', 'Verbindlich anmelden')}</button>
          <button type="button" class="btn outline" id="eventRegCancel">${tr('btn.close', 'Abbrechen')}</button>
        </div>
        <p id="eventRegMsg" class="event-reg-msg" hidden></p>
      </form>
    </div>
  `;
  document.body.appendChild(regModal);

  document.getElementById('eventRegClose').addEventListener('click', closeRegModal);
  document.getElementById('eventRegCancel').addEventListener('click', closeRegModal);
  document.getElementById('eventRegBackdrop').addEventListener('click', closeRegModal);
  document.getElementById('eventRegForm').addEventListener('submit', submitRegistration);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !regModal.hidden) {
      e.preventDefault();
      closeRegModal();
    }
  });
}

function openRegModal(eventId, eventTitle) {
  buildRegModal();
  regCurrentEventId = eventId;
  regCurrentEventTitle = eventTitle;
  document.getElementById('eventRegTitle').textContent = tr('eventsPage.register.title', 'Anmeldung');
  document.getElementById('eventRegSubtitle').textContent = eventTitle;
  document.getElementById('eventRegForm').reset();
  document.getElementById('eventRegForm').querySelector('[name="_formAt"]').value = Date.now();
  const msg = document.getElementById('eventRegMsg');
  msg.hidden = true;
  msg.textContent = '';
  regModal.hidden = false;
  document.body.classList.add('reg-modal-open');
  document.getElementById('regName').focus();
}

function closeRegModal() {
  if (!regModal) return;
  regModal.hidden = true;
  document.body.classList.remove('reg-modal-open');
}

async function submitRegistration(e) {
  e.preventDefault();
  if (!regCurrentEventId) return;

  const form = e.currentTarget;
  const submitBtn = document.getElementById('eventRegSubmit');
  const msgEl = document.getElementById('eventRegMsg');
  const origText = submitBtn.textContent;

  submitBtn.disabled = true;
  submitBtn.textContent = tr('eventsPage.register.sending', 'Wird gesendet …');
  msgEl.hidden = true;

  const data = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    message: form.message.value.trim(),
    website: form.website.value,
    _formAt: form._formAt.value,
  };

  try {
    const res = await fetch(`${EVENTS_API_URL}/events/${regCurrentEventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Fehler beim Senden');

    msgEl.textContent = json.message || tr('eventsPage.register.success', 'Anmeldung eingegangen! Du erhältst eine Bestätigungs-E-Mail.');
    msgEl.className = 'event-reg-msg event-reg-msg--success';
    msgEl.hidden = false;
    form.reset();
    submitBtn.disabled = true;
    setTimeout(closeRegModal, 3500);
  } catch (err) {
    msgEl.textContent = err.message || tr('eventsPage.register.error', 'Fehler – bitte erneut versuchen.');
    msgEl.className = 'event-reg-msg event-reg-msg--error';
    msgEl.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = origText;
  }
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
    ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" class="event-image"/>`
    : `<div class="event-image event-image-placeholder">${window.ktI18n?.t('eventsPage.cardDate') || 'Termin'}</div>`;

  const meta = [
    date,
    item.time ? metaLine('eventsPage.metaTime', item.time) : null,
    item.location ? metaLine('eventsPage.metaLocation', item.location) : null,
    item.capacity ? metaLine('eventsPage.metaCapacity', item.capacity) : null,
  ].filter(Boolean);

  return `
    <div class="event-card card">
      ${imageHtml}
      <div class="event-content">
        <div class="event-date">${escapeHtml(date)}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <div class="event-meta">
          ${meta.map((m) => `<span>${escapeHtml(m)}</span>`).join('')}
        </div>
        <p>${escapeHtml(item.description)}</p>
        <div class="event-card-actions">
          <button type="button" class="btn primary event-reg-btn"
            data-event-id="${escapeHtml(String(item.id))}"
            data-event-title="${escapeHtml(item.title)}">
            ${window.ktI18n?.t('eventsPage.register.cta') || 'Jetzt anmelden'}
          </button>
          <a href="kontakt" class="btn outline">${window.ktI18n?.t('eventsPage.signUp') || 'Kontakt'}</a>
        </div>
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
  list.querySelectorAll('.event-reg-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openRegModal(btn.dataset.eventId, btn.dataset.eventTitle);
    });
  });
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
