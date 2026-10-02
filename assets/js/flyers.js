/* Flyer-Sektion auf der Startseite: lädt die im Admin-Panel hochgeladenen
   PDFs und zeigt sie als Liste. Ohne veröffentlichte Flyer bleibt die Sektion
   verborgen – so steht auf der Seite nie eine leere Überschrift. */
(function () {
  const section = document.getElementById('flyer');
  const list = document.getElementById('flyerList');
  if (!section || !list) return;

  function t(key, fallback) {
    return (window.ktI18n && window.ktI18n.t && window.ktI18n.t(key)) || fallback;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Dateigröße in einer Form, die auch ohne Technikwissen etwas sagt. */
  function readableSize(bytes) {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1).replace('.', ',')} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  /** Nur eigene Upload-Pfade verlinken – nichts, was von außen kommen könnte. */
  function safeUrl(url) {
    return typeof url === 'string' && /^\/uploads\/flyer\/[A-Za-z0-9._-]+\.pdf$/.test(url)
      ? url
      : null;
  }

  function renderFlyer(flyer) {
    const url = safeUrl(flyer.url);
    if (!url) return '';

    const size = readableSize(flyer.sizeBytes);
    const meta = ['PDF', size].filter(Boolean).join(' · ');
    const label = t('home.flyers.open', 'Flyer ansehen');
    const hint = t('home.flyers.newTab', 'öffnet sich in einem neuen Fenster');
    const desc = flyer.description
      ? `<p class="flyer-card-text">${escapeHtml(flyer.description)}</p>`
      : '';

    return `<li class="flyer-card">
      <span class="flyer-card-icon" aria-hidden="true">PDF</span>
      <div class="flyer-card-body">
        <h3 class="flyer-card-title">${escapeHtml(flyer.title)}</h3>
        ${desc}
        <p class="flyer-card-meta">${escapeHtml(meta)}</p>
      </div>
      <a class="btn outline flyer-card-link" href="${url}" target="_blank" rel="noopener">
        ${escapeHtml(label)}<span class="visually-hidden"> (${escapeHtml(flyer.title)}, ${escapeHtml(hint)})</span>
      </a>
    </li>`;
  }

  let cached = null;

  function render(flyers) {
    const html = flyers.map(renderFlyer).join('');
    if (!html) {
      section.hidden = true;
      return;
    }
    list.innerHTML = html;
    section.hidden = false;
    if (window.revealStagger) {
      window.revealStagger([section.querySelector('.section-intro'), ...list.children].filter(Boolean));
    }
  }

  async function loadFlyers() {
    try {
      const res = await fetch('/api/flyers', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      cached = Array.isArray(data.flyers) ? data.flyers : [];
      render(cached);
    } catch (err) {
      // Flyer sind eine Ergänzung – fehlen sie, bleibt die Sektion einfach weg.
      section.hidden = true;
      console.error('Flyer konnten nicht geladen werden:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', loadFlyers);
  // Nach einem Sprachwechsel die Beschriftungen neu setzen.
  document.addEventListener('kt-lang-change', () => {
    if (cached) render(cached);
  });
})();
