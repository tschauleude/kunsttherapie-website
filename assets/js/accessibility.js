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

  function tr(key) {
    const v = window.ktI18n?.t(key);
    return v != null ? v : '';
  }

  let prefs = load();
  apply(prefs);

  const panelId = 'a11yPanel';
  const toggleId = 'a11yToggle';

  function panelHtml() {
    const closeLabel = tr('a11y.close') || tr('btn.close') || 'Schließen';
    return `
    <header class="a11y-panel-head">
      <h2 id="a11yPanelTitle">${tr('a11y.title')}</h2>
      <button type="button" class="a11y-panel-close" data-a11y-close aria-label="${closeLabel}">×</button>
    </header>
    <p class="a11y-panel-intro">${tr('a11y.intro')}</p>
    <form class="a11y-form" id="a11yForm">
      <fieldset>
        <legend>${tr('a11y.fontSize')}</legend>
        <label><input type="radio" name="textSize" value="normal"/> ${tr('a11y.font.normal')}</label>
        <label><input type="radio" name="textSize" value="large"/> ${tr('a11y.font.large')}</label>
        <label><input type="radio" name="textSize" value="xlarge"/> ${tr('a11y.font.xlarge')}</label>
      </fieldset>
      <fieldset>
        <legend>${tr('a11y.contrast')}</legend>
        <label><input type="radio" name="contrast" value="default"/> ${tr('a11y.contrast.default')}</label>
        <label><input type="radio" name="contrast" value="high"/> ${tr('a11y.contrast.high')}</label>
      </fieldset>
      <fieldset>
        <legend>${tr('a11y.motion')}</legend>
        <label><input type="radio" name="motion" value="default"/> ${tr('a11y.motion.default')}</label>
        <label><input type="radio" name="motion" value="reduce"/> ${tr('a11y.motion.reduce')}</label>
      </fieldset>
      <fieldset>
        <legend>${tr('a11y.links')}</legend>
        <label><input type="radio" name="links" value="default"/> ${tr('a11y.links.default')}</label>
        <label><input type="radio" name="links" value="underline"/> ${tr('a11y.links.underline')}</label>
      </fieldset>
      <fieldset>
        <legend>${tr('a11y.spacing')}</legend>
        <label><input type="radio" name="spacing" value="default"/> ${tr('a11y.spacing.default')}</label>
        <label><input type="radio" name="spacing" value="readable"/> ${tr('a11y.spacing.readable')}</label>
      </fieldset>
      <fieldset>
        <legend>${tr('a11y.focus')}</legend>
        <label><input type="radio" name="focus" value="default"/> ${tr('a11y.focus.default')}</label>
        <label><input type="radio" name="focus" value="strong"/> ${tr('a11y.focus.strong')}</label>
      </fieldset>
      <div class="a11y-actions">
        <button type="button" class="btn outline" data-a11y-reset>${tr('a11y.reset')}</button>
      </div>
    </form>
    <p class="a11y-live" id="a11yLive" role="status" aria-live="polite" aria-atomic="true"></p>
  `;
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = toggleId;
  toggle.className = 'a11y-fab';
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

  function applyToggleLabel() {
    toggle.setAttribute('aria-label', tr('a11y.toggle') || 'Barrierefreiheit');
  }

  applyToggleLabel();
  panel.innerHTML = panelHtml();

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  let form = panel.querySelector('#a11yForm');
  let live = panel.querySelector('#a11yLive');

  function syncForm() {
    if (!form) return;
    Object.keys(defaults).forEach((key) => {
      const input = form.querySelector(`input[name="${key}"][value="${prefs[key]}"]`);
      if (input) input.checked = true;
    });
  }

  function announce(msg) {
    if (live) live.textContent = msg;
  }

  function onFormChange(e) {
    const target = e.target;
    if (!(target instanceof HTMLInputElement) || target.type !== 'radio') return;
    if (!target.closest('#a11yForm')) return;
    prefs = { ...prefs, [target.name]: target.value };
    save(prefs);
    apply(prefs);
    announce(tr('a11y.announce.set') || 'Einstellung übernommen.');
  }

  function onReset() {
    prefs = { ...defaults };
    save(prefs);
    apply(prefs);
    syncForm();
    announce(tr('a11y.announce.reset') || 'Alle Einstellungen zurückgesetzt.');
  }

  let panelBusy = false;

  function openPanel() {
    if (panelBusy || !panel.hidden) return;
    // Refresh panel text if i18n wasn't ready when it was first created
    if (!tr('a11y.title')) refreshPanelI18n();
    panelBusy = true;
    syncForm();

    const finish = () => {
      toggle.setAttribute('aria-expanded', 'true');
      panelBusy = false;
      panel.querySelector('[data-a11y-close]')?.focus();
    };

    if (window.flowMotion) {
      window.flowMotion.open(panel, 'a11y-panel-visible').then(finish);
      return;
    }
    panel.hidden = false;
    panel.classList.add('a11y-panel-visible');
    finish();
  }

  function closePanel() {
    if (panelBusy || panel.hidden) return;
    panelBusy = true;

    const finish = () => {
      toggle.setAttribute('aria-expanded', 'false');
      panelBusy = false;
      toggle.focus();
    };

    if (window.flowMotion) {
      window.flowMotion.close(panel, 'a11y-panel-visible').then(finish);
      return;
    }
    panel.classList.remove('a11y-panel-visible');
    panel.hidden = true;
    finish();
  }

  function refreshPanelI18n() {
    const wasOpen = !panel.hidden;
    panel.innerHTML = panelHtml();
    form = panel.querySelector('#a11yForm');
    live = panel.querySelector('#a11yLive');
    applyToggleLabel();
    syncForm();
    panel.classList.toggle('a11y-panel-visible', wasOpen);
    panel.hidden = !wasOpen;
    document.querySelectorAll('[data-a11y-open]').forEach((el) => {
      el.textContent = tr('a11y.footerBtn') || 'Barrierefreiheit';
    });
  }

  toggle.addEventListener('click', () => {
    if (panel.hidden) openPanel();
    else closePanel();
  });

  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-a11y-close]')) closePanel();
    if (e.target.closest('[data-a11y-reset]')) onReset();
  });

  panel.addEventListener('change', onFormChange);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      e.preventDefault();
      closePanel();
    }
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
    btn.textContent = tr('a11y.footerBtn') || 'Barrierefreiheit';
    btn.addEventListener('click', (e) => { e.preventDefault(); openPanel(); });
    legalFooter.appendChild(sep);
    legalFooter.appendChild(btn);
  }

  if (
    prefs.motion === 'default' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    prefs.motion = 'reduce';
    save(prefs);
    apply(prefs);
    syncForm();
  }

  document.addEventListener('kt-lang-change', refreshPanelI18n);
})();
