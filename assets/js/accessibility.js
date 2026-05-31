/**
 * Barrierefreiheits-Einstellungen (WCAG 2.2 / EN 301 549).
 * Präferenzen werden in localStorage gespeichert.
 */
(function () {
  if (document.body.classList.contains('admin-app')) return;

  const STORAGE_KEY = 'kunsttherapie-a11y';
  const root = document.documentElement;

  const defaults = {
    textSize: 'normal',
    contrast: 'default',
    motion: 'default',
    links: 'default',
    spacing: 'default',
    focus: 'default',
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
    } catch {
      return { ...defaults };
    }
  }

  function save(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }

  function apply(prefs) {
    root.dataset.a11yText = prefs.textSize;
    root.dataset.a11yContrast = prefs.contrast;
    root.dataset.a11yMotion = prefs.motion;
    root.dataset.a11yLinks = prefs.links;
    root.dataset.a11ySpacing = prefs.spacing;
    root.dataset.a11yFocus = prefs.focus;
    root.classList.toggle('a11y-reduce-motion', prefs.motion === 'reduce');
    root.classList.toggle('a11y-high-contrast', prefs.contrast === 'high');
  }

  let prefs = load();
  apply(prefs);

  const panelId = 'a11yPanel';
  const toggleId = 'a11yToggle';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = toggleId;
  toggle.className = 'a11y-fab';
  toggle.setAttribute('aria-label', 'Barrierefreiheit-Einstellungen öffnen');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', panelId);
  toggle.innerHTML =
    '<span class="a11y-fab-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="2"/><path d="M12 8v2M7 20l2-6M17 20l-2-6M5 14h14"/></svg></span>';

  const panel = document.createElement('section');
  panel.id = panelId;
  panel.className = 'a11y-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'a11yPanelTitle');
  panel.innerHTML = `
    <header class="a11y-panel-head">
      <h2 id="a11yPanelTitle">Barrierefreiheit</h2>
      <button type="button" class="a11y-panel-close" data-a11y-close aria-label="Einstellungen schließen">×</button>
    </header>
    <p class="a11y-panel-intro">Passen Sie die Darstellung an Ihre Bedürfnisse an. Einstellungen werden auf diesem Gerät gespeichert.</p>
    <form class="a11y-form" id="a11yForm">
      <fieldset>
        <legend>Schriftgröße</legend>
        <label><input type="radio" name="textSize" value="normal"/> Standard</label>
        <label><input type="radio" name="textSize" value="large"/> Größer</label>
        <label><input type="radio" name="textSize" value="xlarge"/> Sehr groß</label>
      </fieldset>
      <fieldset>
        <legend>Kontrast</legend>
        <label><input type="radio" name="contrast" value="default"/> Standard</label>
        <label><input type="radio" name="contrast" value="high"/> Hoher Kontrast</label>
      </fieldset>
      <fieldset>
        <legend>Bewegung</legend>
        <label><input type="radio" name="motion" value="default"/> Standard</label>
        <label><input type="radio" name="motion" value="reduce"/> Reduziert</label>
      </fieldset>
      <fieldset>
        <legend>Links</legend>
        <label><input type="radio" name="links" value="default"/> Standard</label>
        <label><input type="radio" name="links" value="underline"/> Immer unterstrichen</label>
      </fieldset>
      <fieldset>
        <legend>Lesbarkeit</legend>
        <label><input type="radio" name="spacing" value="default"/> Standard</label>
        <label><input type="radio" name="spacing" value="readable"/> Mehr Zeilenabstand</label>
      </fieldset>
      <fieldset>
        <legend>Tastatur-Fokus</legend>
        <label><input type="radio" name="focus" value="default"/> Standard</label>
        <label><input type="radio" name="focus" value="strong"/> Deutlicher Fokusrahmen</label>
      </fieldset>
      <div class="a11y-actions">
        <button type="button" class="btn outline" data-a11y-reset>Zurücksetzen</button>
      </div>
    </form>
    <p class="a11y-live" id="a11yLive" role="status" aria-live="polite" aria-atomic="true"></p>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  const form = panel.querySelector('#a11yForm');
  const live = panel.querySelector('#a11yLive');

  function syncForm() {
    Object.keys(defaults).forEach((key) => {
      const input = form.querySelector(`input[name="${key}"][value="${prefs[key]}"]`);
      if (input) input.checked = true;
    });
  }

  function announce(msg) {
    if (live) live.textContent = msg;
  }

  function openPanel() {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    syncForm();
    panel.querySelector('[data-a11y-close]')?.focus();
  }

  function closePanel() {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (panel.hidden) openPanel();
    else closePanel();
  });

  panel.querySelector('[data-a11y-close]')?.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      e.preventDefault();
      closePanel();
    }
  });

  form.addEventListener('change', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || t.type !== 'radio') return;
    prefs = { ...prefs, [t.name]: t.value };
    save(prefs);
    apply(prefs);
    announce('Einstellung übernommen.');
  });

  panel.querySelector('[data-a11y-reset]')?.addEventListener('click', () => {
    prefs = { ...defaults };
    save(prefs);
    apply(prefs);
    syncForm();
    announce('Alle Einstellungen zurückgesetzt.');
  });

  syncForm();

  document.querySelectorAll('[data-a11y-open]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openPanel();
    });
  });

  const legalFooter = document.querySelector('.legal-footer');
  if (legalFooter && !legalFooter.querySelector('[data-a11y-open]')) {
    const sep = document.createTextNode(' · ');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'a11y-footer-link';
    btn.setAttribute('data-a11y-open', '');
    btn.textContent = 'Barrierefreiheit';
    legalFooter.appendChild(sep);
    legalFooter.appendChild(btn);
  }

  /* System-Präferenz „Bewegung reduzieren“ beim ersten Besuch respektieren */
  if (
    prefs.motion === 'default' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    prefs.motion = 'reduce';
    save(prefs);
    apply(prefs);
    syncForm();
  }
})();
