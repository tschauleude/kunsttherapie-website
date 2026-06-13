/**
 * Mini-Atelier: Zeichnen, Formen, Kollage, Entwurf speichern, optional ans Atelier senden.
 */
(function () {
  const root = document.getElementById('atelierApp');
  if (!root) return;

  const canvas = root.querySelector('#atelierCanvas');
  const ctx = canvas.getContext('2d');
  const statusEl = root.querySelector('[data-atelier-status]');
  const collageBar = root.querySelector('[data-collage-bar]');
  const canvasWrap = root.querySelector('.atelier-canvas-wrap');

  const STORAGE_KEY = 'kunsttherapie-atelier-draft-v1';
  const MAX_COLLAGE = 6;
  const MAX_HISTORY = 40;

  let tool = 'brush';
  let color = '#557a76';
  let size = 8;
  let fillShapes = false;

  let drawing = false;
  let shapeStart = null;
  let currentPath = null;

  let collageItems = [];
  let selectedCollageId = null;
  let dragCollage = null;

  const strokes = [];
  const history = [];
  let historyIndex = -1;

  const collageImages = new Map();

  function tr(key, fallback) {
    const v = window.ktI18n?.t(key);
    return v != null ? v : fallback;
  }

  function trN(key, n, fallback) {
    return String(tr(key, fallback)).replace('{n}', String(n));
  }

  function markStarted() {
    canvasWrap?.classList.add('has-started');
  }

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'atelier-status' + (type ? ` atelier-status-${type}` : '');
    statusEl.hidden = !msg;
  }

  function canvasSize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      render();
    }
    return { w, h, dpr, cssW: rect.width, cssH: rect.height };
  }

  function resize() {
    canvasSize();
  }

  function pushHistory() {
    history.splice(historyIndex + 1);
    history.push({
      strokes: JSON.parse(JSON.stringify(strokes)),
      collage: collageItems.map((c) => ({ ...c })),
    });
    if (history.length > MAX_HISTORY) history.shift();
    historyIndex = history.length - 1;
    updateUndoRedoButtons();
  }

  function restoreHistory(index) {
    const snap = history[index];
    if (!snap) return;
    strokes.length = 0;
    strokes.push(...JSON.parse(JSON.stringify(snap.strokes)));
    collageItems.length = 0;
    snap.collage.forEach((c) => {
      collageItems.push({ ...c });
      if (!collageImages.has(c.id) && c.src) {
        const img = new Image();
        img.src = c.src;
        collageImages.set(c.id, img);
      }
    });
    selectedCollageId = null;
    syncCollageBar();
    render();
    updateUndoRedoButtons();
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex -= 1;
    restoreHistory(historyIndex);
    setStatus(tr('atelier.msg.undo', 'Rückgängig'), 'info');
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    restoreHistory(historyIndex);
    setStatus(tr('atelier.msg.redo', 'Wiederhergestellt'), 'info');
  }

  function updateUndoRedoButtons() {
    const u = root.querySelector('[data-undo]');
    const r = root.querySelector('[data-redo]');
    if (u) u.disabled = historyIndex <= 0;
    if (r) r.disabled = historyIndex >= history.length - 1;
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const { dpr } = canvasSize();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: ((t.clientX - rect.left) / rect.width) * (canvas.width / dpr),
      y: ((t.clientY - rect.top) / rect.height) * (canvas.height / dpr),
    };
  }

  function hitCollage(p) {
    for (let i = collageItems.length - 1; i >= 0; i--) {
      const c = collageItems[i];
      if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) {
        return c;
      }
    }
    return null;
  }

  function drawPath(path, targetCtx) {
    const c = targetCtx || ctx;
    if (path.type === 'path' && path.points.length > 1) {
      c.strokeStyle = path.color;
      c.lineWidth = path.size;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        c.lineTo(path.points[i].x, path.points[i].y);
      }
      c.stroke();
    } else if (path.type === 'line') {
      c.strokeStyle = path.color;
      c.lineWidth = path.size;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(path.x1, path.y1);
      c.lineTo(path.x2, path.y2);
      c.stroke();
    } else if (path.type === 'rect') {
      c.strokeStyle = path.color;
      c.lineWidth = path.size;
      if (path.fill) {
        c.fillStyle = path.color;
        c.fillRect(path.x, path.y, path.w, path.h);
      }
      c.strokeRect(path.x, path.y, path.w, path.h);
    } else if (path.type === 'circle') {
      c.strokeStyle = path.color;
      c.lineWidth = path.size;
      const rx = Math.abs(path.w) / 2;
      const ry = Math.abs(path.h) / 2;
      const cx = path.x + path.w / 2;
      const cy = path.y + path.h / 2;
      c.beginPath();
      c.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2);
      if (path.fill) {
        c.fillStyle = path.color;
        c.fill();
      }
      c.stroke();
    }
  }

  function render(preview) {
    const { dpr } = canvasSize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, w, h);

    collageItems.forEach((item) => {
      const img = collageImages.get(item.id);
      if (img && img.complete) {
        ctx.drawImage(img, item.x, item.y, item.w, item.h);
        if (item.id === selectedCollageId) {
          ctx.strokeStyle = '#557a76';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(item.x, item.y, item.w, item.h);
          ctx.setLineDash([]);
        }
      }
    });

    strokes.forEach((s) => drawPath(s));

    if (preview) drawPath(preview);
  }

  function setTool(next) {
    tool = next;
    root.querySelectorAll('[data-tool]').forEach((btn) => {
      const active = btn.dataset.tool === tool;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    canvas.style.cursor =
      tool === 'select' ? 'default' : tool === 'brush' ? 'crosshair' : 'crosshair';
  }

  function addCollageFromDataUrl(src) {
    if (collageItems.length >= MAX_COLLAGE) {
      setStatus(trN('atelier.msg.collageMax', MAX_COLLAGE, `Maximal ${MAX_COLLAGE} Bilder in der Kollage.`), 'error');
      return;
    }
    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const img = new Image();
    img.onload = () => {
      const { cssW, cssH } = canvasSize();
      const scale = Math.min((cssW * 0.45) / img.width, (cssH * 0.45) / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      collageItems.push({
        id,
        src,
        x: (cssW - w) / 2,
        y: (cssH - h) / 2,
        w,
        h,
      });
      collageImages.set(id, img);
      selectedCollageId = id;
      pushHistory();
      syncCollageBar();
      render();
      setStatus(tr('atelier.msg.collageAdded', 'Bild zur Kollage hinzugefügt – ziehen zum Verschieben.'), 'success');
      markStarted();
    };
    img.src = src;
  }

  function resizeImageFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const max = 1200;
        let { width, height } = img;
        const s = Math.min(1, max / Math.max(width, height));
        width = Math.round(width * s);
        height = Math.round(height * s);
        const off = document.createElement('canvas');
        off.width = width;
        off.height = height;
        off.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(off.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(tr('atelier.msg.imageLoadFailed', 'Bild konnte nicht geladen werden')));
      };
      img.src = url;
    });
  }

  function syncCollageBar() {
    if (!collageBar) return;
    collageBar.innerHTML = '';
    if (!collageItems.length) {
      collageBar.hidden = true;
      return;
    }
    collageBar.hidden = false;
    collageItems.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'atelier-collage-thumb' + (item.id === selectedCollageId ? ' active' : '');
      btn.title = tr('atelier.msg.collageSelect', 'Kollage-Bild auswählen');
      const thumb = document.createElement('img');
      thumb.src = item.src;
      thumb.alt = '';
      btn.appendChild(thumb);
      btn.addEventListener('click', () => {
        selectedCollageId = item.id;
        setTool('select');
        syncCollageBar();
        render();
      });
      collageBar.appendChild(btn);
    });
  }

  function removeSelectedCollage() {
    if (!selectedCollageId) return;
    collageItems = collageItems.filter((c) => c.id !== selectedCollageId);
    collageImages.delete(selectedCollageId);
    selectedCollageId = null;
    pushHistory();
    syncCollageBar();
    render();
  }

  function scaleSelectedCollage(factor) {
    const item = collageItems.find((c) => c.id === selectedCollageId);
    if (!item) return;
    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;
    item.w *= factor;
    item.h *= factor;
    item.x = cx - item.w / 2;
    item.y = cy - item.h / 2;
    pushHistory();
    render();
  }

  function onPointerDown(e) {
    if (e.button === 2) return;
    markStarted();
    const p = pointerPos(e);

    if (tool === 'select') {
      const hit = hitCollage(p);
      if (hit) {
        selectedCollageId = hit.id;
        dragCollage = { id: hit.id, ox: p.x - hit.x, oy: p.y - hit.y };
        syncCollageBar();
        render();
      } else {
        selectedCollageId = null;
        syncCollageBar();
        render();
      }
      e.preventDefault();
      return;
    }

    drawing = true;
    shapeStart = p;

    if (tool === 'brush') {
      currentPath = { type: 'path', color, size, points: [p] };
    }
    e.preventDefault();
  }

  function onPointerMove(e) {
    const p = pointerPos(e);

    if (dragCollage) {
      const item = collageItems.find((c) => c.id === dragCollage.id);
      if (item) {
        item.x = p.x - dragCollage.ox;
        item.y = p.y - dragCollage.oy;
        render();
      }
      e.preventDefault();
      return;
    }

    if (!drawing || !shapeStart) return;

    if (tool === 'brush' && currentPath) {
      currentPath.points.push(p);
      render(currentPath);
    } else if (tool === 'line') {
      render({
        type: 'line',
        color,
        size,
        x1: shapeStart.x,
        y1: shapeStart.y,
        x2: p.x,
        y2: p.y,
      });
    } else if (tool === 'rect') {
      render({
        type: 'rect',
        color,
        size,
        fill: fillShapes,
        x: shapeStart.x,
        y: shapeStart.y,
        w: p.x - shapeStart.x,
        h: p.y - shapeStart.y,
      });
    } else if (tool === 'circle') {
      render({
        type: 'circle',
        color,
        size,
        fill: fillShapes,
        x: shapeStart.x,
        y: shapeStart.y,
        w: p.x - shapeStart.x,
        h: p.y - shapeStart.y,
      });
    }
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (dragCollage) {
      dragCollage = null;
      pushHistory();
      return;
    }

    if (!drawing) return;
    drawing = false;
    const p = pointerPos(e);

    if (tool === 'brush' && currentPath && currentPath.points.length > 1) {
      strokes.push(currentPath);
      pushHistory();
    } else if (tool === 'line') {
      strokes.push({
        type: 'line',
        color,
        size,
        x1: shapeStart.x,
        y1: shapeStart.y,
        x2: p.x,
        y2: p.y,
      });
      pushHistory();
    } else if (tool === 'rect') {
      strokes.push({
        type: 'rect',
        color,
        size,
        fill: fillShapes,
        x: shapeStart.x,
        y: shapeStart.y,
        w: p.x - shapeStart.x,
        h: p.y - shapeStart.y,
      });
      pushHistory();
    } else if (tool === 'circle') {
      strokes.push({
        type: 'circle',
        color,
        size,
        fill: fillShapes,
        x: shapeStart.x,
        y: shapeStart.y,
        w: p.x - shapeStart.x,
        h: p.y - shapeStart.y,
      });
      pushHistory();
    }

    currentPath = null;
    shapeStart = null;
    render();
  }

  function clearCanvas() {
    if (!window.confirm(tr('atelier.msg.clearConfirm', 'Alles löschen – Zeichnung und Kollage?'))) return;
    strokes.length = 0;
    collageItems.length = 0;
    collageImages.clear();
    selectedCollageId = null;
    syncCollageBar();
    pushHistory();
    render();
    setStatus(tr('atelier.msg.cleared', 'Leinwand geleert.'), 'info');
  }

  function saveDraft() {
    try {
      const payload = {
        version: 1,
        strokes,
        collage: collageItems.map(({ id, src, x, y, w, h }) => ({ id, src, x, y, w, h })),
        color,
        size,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setStatus(tr('atelier.msg.saved', 'Entwurf auf diesem Gerät gespeichert.'), 'success');
    } catch (err) {
      setStatus(tr('atelier.msg.saveFailed', 'Speichern fehlgeschlagen – eventuell zu groß (weniger Bilder).'), 'error');
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setStatus(tr('atelier.msg.noDraft', 'Kein gespeicherter Entwurf gefunden.'), 'info');
        return;
      }
      const data = JSON.parse(raw);
      strokes.length = 0;
      if (data.strokes) strokes.push(...data.strokes);
      collageItems.length = 0;
      collageImages.clear();
      if (data.collage) {
        data.collage.forEach((c) => {
          collageItems.push({ ...c });
          const img = new Image();
          img.src = c.src;
          collageImages.set(c.id, img);
        });
      }
      if (data.color) color = data.color;
      if (data.size) size = data.size;
      const colorInput = root.querySelector('[data-color]');
      const sizeInput = root.querySelector('[data-size]');
      if (colorInput) colorInput.value = color;
      if (sizeInput) sizeInput.value = size;
      pushHistory();
      syncCollageBar();
      render();
      setStatus(tr('atelier.msg.loaded', 'Entwurf geladen.'), 'success');
    } catch {
      setStatus(tr('atelier.msg.loadFailed', 'Entwurf konnte nicht geladen werden.'), 'error');
    }
  }

  function exportFlattenedCanvas() {
    const { cssW, cssH } = canvasSize();
    const off = document.createElement('canvas');
    off.width = Math.floor(cssW);
    off.height = Math.floor(cssH);
    const octx = off.getContext('2d');
    octx.fillStyle = '#faf8f5';
    octx.fillRect(0, 0, off.width, off.height);
    collageItems.forEach((item) => {
      const img = collageImages.get(item.id);
      if (img && img.complete) octx.drawImage(img, item.x, item.y, item.w, item.h);
    });
    strokes.forEach((s) => drawPath(s, octx));
    return off;
  }

  async function submitWork(e) {
    e.preventDefault();
    const form = e.target;
    const anonymous = form.querySelector('[name="anonymous"]').checked;
    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const note = form.querySelector('[name="note"]').value.trim();

    if (!anonymous && !name && !email) {
      setStatus(tr('atelier.msg.identityRequired', 'Bitte Name oder E-Mail angeben – oder „Anonym senden“ wählen.'), 'error');
      return;
    }

    if (!strokes.length && !collageItems.length) {
      setStatus(tr('atelier.msg.emptySubmit', 'Bitte erst etwas gestalten, bevor gesendet wird.'), 'error');
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    setStatus(tr('atelier.msg.sending', 'Wird gesendet …'), 'info');

    try {
      const off = exportFlattenedCanvas();
      const blob = await new Promise((res, rej) => {
        off.toBlob(
          (b) => (b ? res(b) : rej(new Error(tr('atelier.msg.exportFailed', 'Export fehlgeschlagen')))),
          'image/png',
          0.92
        );
      });

      const fd = new FormData();
      fd.append('image', blob, 'atelier-werk.png');
      fd.append('anonymous', anonymous ? '1' : '0');
      fd.append('name', name);
      fd.append('email', email);
      fd.append('note', note);

      fd.append('lang', window.ktI18n?.getLang?.() || 'de');

      const res = await fetch('/api/atelier/submit', { method: 'POST', body: fd });
      // Antwort tolerant parsen: bei Nicht-JSON (z. B. Proxy-Fehler 413/502)
      // keine harte JSON-Parse-Exception, sondern saubere Fehlermeldung.
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || tr('atelier.msg.sendFailed', 'Senden fehlgeschlagen'));

      setStatus(data.message || tr('atelier.msg.sendSuccess', 'Vielen Dank – das Werk wurde übermittelt.'), 'success');
      form.reset();
      form.querySelector('[name="anonymous"]').checked = true;
      toggleIdentityFields();
    } catch (err) {
      setStatus(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  function toggleIdentityFields() {
    const anon = root.querySelector('[name="anonymous"]')?.checked;
    const fields = root.querySelector('[data-identity-fields]');
    if (fields) fields.hidden = Boolean(anon);
  }

  function bindUI() {
    root.querySelectorAll('[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => setTool(btn.dataset.tool));
    });

    root.querySelector('[data-color]')?.addEventListener('input', (e) => {
      color = e.target.value;
    });
    root.querySelector('[data-size]')?.addEventListener('input', (e) => {
      size = Number(e.target.value) || 8;
    });
    root.querySelector('[data-fill]')?.addEventListener('change', (e) => {
      fillShapes = e.target.checked;
    });

    root.querySelector('[data-undo]')?.addEventListener('click', undo);
    root.querySelector('[data-redo]')?.addEventListener('click', redo);
    root.querySelector('[data-clear]')?.addEventListener('click', clearCanvas);
    root.querySelector('[data-save-draft]')?.addEventListener('click', saveDraft);
    root.querySelector('[data-load-draft]')?.addEventListener('click', loadDraft);
    root.querySelector('[data-collage-remove]')?.addEventListener('click', removeSelectedCollage);
    root.querySelector('[data-collage-bigger]')?.addEventListener('click', () => scaleSelectedCollage(1.12));
    root.querySelector('[data-collage-smaller]')?.addEventListener('click', () => scaleSelectedCollage(0.88));

    root.querySelector('[data-upload]')?.addEventListener('change', async (e) => {
      const files = [...(e.target.files || [])];
      e.target.value = '';
      for (const file of files) {
        if (!/^image\//.test(file.type)) continue;
        try {
          const dataUrl = await resizeImageFile(file);
          addCollageFromDataUrl(dataUrl);
        } catch (err) {
          setStatus(err.message, 'error');
        }
      }
    });

    root.querySelector('[data-submit-form]')?.addEventListener('submit', submitWork);
    root.querySelector('[name="anonymous"]')?.addEventListener('change', toggleIdentityFields);

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('mouseleave', () => {
      if (drawing) {
        drawing = false;
        currentPath = null;
        shapeStart = null;
        render();
      }
      if (dragCollage) {
        dragCollage = null;
        pushHistory();
      }
    });
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    canvas.addEventListener('touchmove', onPointerMove, { passive: false });
    canvas.addEventListener('touchend', onPointerUp);
  }

  pushHistory();
  bindUI();
  setTool('brush');
  toggleIdentityFields();
  if (strokes.length || collageItems.length) markStarted();
  resize();
  window.addEventListener('resize', resize);
})();
