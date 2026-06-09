/**
 * Live-Atelier: Malen, Formen, Kollage – Auto-Speicher, weiche Pinsel, Radierer.
 */
(function () {
  const root = document.getElementById('atelierApp');
  if (!root) return;

  const canvas = root.querySelector('#atelierCanvas');
  const ctx = canvas.getContext('2d');
  const statusEl = root.querySelector('[data-atelier-status]');
  const saveIndicator = root.querySelector('[data-save-indicator]');
  const collageBar = root.querySelector('[data-collage-bar]');
  const canvasWrap = root.querySelector('.atelier-canvas-wrap');

  const STORAGE_KEY = 'kunsttherapie-atelier-draft-v2';
  const LEGACY_STORAGE_KEY = 'kunsttherapie-atelier-draft-v1';
  const MAX_COLLAGE = 6;
  const MAX_HISTORY = 50;
  const AUTO_SAVE_MS = 700;
  const BG = '#faf8f5';

  const PALETTE = ['#557a76', '#a2d4c4', '#e8a87c', '#c38d9e', '#6b5b95', '#f4d35e', '#2c3e50', '#e85d4c'];

  let tool = 'brush';
  let color = '#557a76';
  let size = 8;
  let fillShapes = false;
  let softBrush = false;
  let brushOpacity = 0.45;

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
  let autoSaveTimer = 0;
  let dirty = false;

  function tr(key, fallback) {
    return window.ktI18n?.t(key) ?? fallback;
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

  function setSaveIndicator(saved) {
    if (!saveIndicator) return;
    saveIndicator.hidden = !saved;
    saveIndicator.textContent = tr('atelier.autosaved', 'Automatisch gespeichert');
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

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const { dpr } = canvasSize();
    const t = e.touches?.[0] ?? e;
    return {
      x: ((t.clientX - rect.left) / rect.width) * (canvas.width / dpr),
      y: ((t.clientY - rect.top) / rect.height) * (canvas.height / dpr),
    };
  }

  function snapshotState() {
    return {
      strokes: JSON.parse(JSON.stringify(strokes)),
      collage: collageItems.map((c) => ({ ...c })),
    };
  }

  function pushHistory() {
    history.splice(historyIndex + 1);
    history.push(snapshotState());
    if (history.length > MAX_HISTORY) history.shift();
    historyIndex = history.length - 1;
    updateUndoRedoButtons();
    scheduleAutoSave();
  }

  function resetHistoryFromCurrent() {
    history.length = 0;
    history.push(snapshotState());
    historyIndex = 0;
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
    setStatus(tr('atelier.status.undo', 'Rückgängig'), 'info');
    scheduleAutoSave();
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    restoreHistory(historyIndex);
    setStatus(tr('atelier.status.redo', 'Wiederhergestellt'), 'info');
    scheduleAutoSave();
  }

  function updateUndoRedoButtons() {
    const u = root.querySelector('[data-undo]');
    const r = root.querySelector('[data-redo]');
    if (u) u.disabled = historyIndex <= 0;
    if (r) r.disabled = historyIndex >= history.length - 1;
  }

  function applyStrokeStyle(path, targetCtx) {
    const c = targetCtx || ctx;
    if (path.type === 'erase') {
      c.globalCompositeOperation = 'destination-out';
      c.strokeStyle = 'rgba(0,0,0,1)';
      c.globalAlpha = 1;
      c.lineWidth = path.size;
      return;
    }
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = path.color;
    c.lineWidth = path.size;
    if (path.soft) {
      c.globalAlpha = path.opacity ?? brushOpacity;
      c.lineWidth = path.size * 1.6;
    } else {
      c.globalAlpha = 1;
    }
    c.lineCap = 'round';
    c.lineJoin = 'round';
  }

  function drawSmoothPath(path, targetCtx) {
    const c = targetCtx || ctx;
    const pts = path.points;
    if (!pts || pts.length < 2) return;

    applyStrokeStyle(path, c);
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);

    if (pts.length === 2) {
      c.lineTo(pts[1].x, pts[1].y);
    } else {
      for (let i = 1; i < pts.length - 1; i += 1) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        c.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      const last = pts[pts.length - 1];
      c.lineTo(last.x, last.y);
    }
    c.stroke();
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  function drawPath(path, targetCtx) {
    const c = targetCtx || ctx;

    if (path.type === 'path' || path.type === 'erase') {
      drawSmoothPath(path, c);
    } else if (path.type === 'line') {
      applyStrokeStyle(path, c);
      c.beginPath();
      c.moveTo(path.x1, path.y1);
      c.lineTo(path.x2, path.y2);
      c.stroke();
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    } else if (path.type === 'rect') {
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      c.strokeStyle = path.color;
      c.lineWidth = path.size;
      if (path.fill) {
        c.fillStyle = path.color;
        c.fillRect(path.x, path.y, path.w, path.h);
      }
      c.strokeRect(path.x, path.y, path.w, path.h);
    } else if (path.type === 'circle') {
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
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

  function paintBackground(targetCtx, w, h) {
    const c = targetCtx || ctx;
    c.fillStyle = BG;
    c.fillRect(0, 0, w, h);
  }

  function render(preview) {
    const { dpr } = canvasSize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    paintBackground(ctx, w, h);

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
    const softToggle = root.querySelector('[data-soft-brush]');
    if (softToggle) softToggle.disabled = tool !== 'brush';
    canvas.style.cursor = tool === 'select' ? 'default' : tool === 'erase' ? 'cell' : 'crosshair';
  }

  function hitCollage(p) {
    for (let i = collageItems.length - 1; i >= 0; i -= 1) {
      const c = collageItems[i];
      if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) return c;
    }
    return null;
  }

  function newBrushPath(p) {
    if (tool === 'erase') {
      return { type: 'erase', size: size * 1.4, points: [p] };
    }
    return {
      type: 'path',
      color,
      size,
      soft: softBrush,
      opacity: brushOpacity,
      points: [p],
    };
  }

  function previewShape(p) {
    if (tool === 'brush' || tool === 'erase') {
      if (currentPath) render(currentPath);
      return;
    }
    if (tool === 'line') {
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
  }

  function commitStroke(p) {
    if (tool === 'brush' || tool === 'erase') {
      if (currentPath && currentPath.points.length === 1) {
        currentPath.points.push({ ...currentPath.points[0] });
      }
      if (currentPath && currentPath.points.length > 1) {
        strokes.push(currentPath);
        pushHistory();
      }
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
    drawing = false;
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
    if (tool === 'brush' || tool === 'erase') {
      currentPath = newBrushPath(p);
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

    if ((tool === 'brush' || tool === 'erase') && currentPath) {
      const last = currentPath.points[currentPath.points.length - 1];
      const dx = p.x - last.x;
      const dy = p.y - last.y;
      if (dx * dx + dy * dy < 1.5) return;
      currentPath.points.push(p);
      render(currentPath);
    } else {
      previewShape(p);
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
    const p = pointerPos(e);
    commitStroke(p);
  }

  function serializeDraft() {
    return {
      version: 2,
      savedAt: Date.now(),
      strokes,
      collage: collageItems.map(({ id, src, x, y, w, h }) => ({ id, src, x, y, w, h })),
      color,
      size,
      fillShapes,
      softBrush,
      brushOpacity,
      tool,
    };
  }

  function applyDraft(data, silent) {
    strokes.length = 0;
    if (data.strokes) strokes.push(...data.strokes);
    collageItems.length = 0;
    collageImages.clear();
    if (data.collage) {
      data.collage.forEach((c) => {
        collageItems.push({ ...c });
        const img = new Image();
        img.onload = () => render();
        img.src = c.src;
        collageImages.set(c.id, img);
      });
    }
    if (data.color) color = data.color;
    if (data.size) size = data.size;
    if (typeof data.fillShapes === 'boolean') fillShapes = data.fillShapes;
    if (typeof data.softBrush === 'boolean') softBrush = data.softBrush;
    if (data.brushOpacity) brushOpacity = data.brushOpacity;
    if (data.tool) tool = data.tool;

    const colorInput = root.querySelector('[data-color]');
    const sizeInput = root.querySelector('[data-size]');
    const fillInput = root.querySelector('[data-fill]');
    const softInput = root.querySelector('[data-soft-brush]');
    const opacityInput = root.querySelector('[data-opacity]');
    if (colorInput) colorInput.value = color;
    if (sizeInput) sizeInput.value = String(size);
    if (fillInput) fillInput.checked = fillShapes;
    if (softInput) softInput.checked = softBrush;
    if (opacityInput) opacityInput.value = String(Math.round(brushOpacity * 100));

    setTool(tool);
    syncPaletteActive();
    resetHistoryFromCurrent();
    syncCollageBar();
    render();
    if (strokes.length || collageItems.length) markStarted();
    dirty = false;
    if (!silent) {
      setSaveIndicator(true);
      setStatus(tr('atelier.status.loaded', 'Entwurf geladen.'), 'success');
    }
  }

  function saveDraft(manual) {
    try {
      const payload = serializeDraft();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      dirty = false;
      setSaveIndicator(true);
      if (manual) {
        setStatus(tr('atelier.status.saved', 'Entwurf auf diesem Gerät gespeichert.'), 'success');
      }
    } catch {
      setStatus(tr('atelier.status.saveError', 'Speichern fehlgeschlagen – weniger Bilder verwenden.'), 'error');
    }
  }

  function scheduleAutoSave() {
    dirty = true;
    setSaveIndicator(false);
    window.clearTimeout(autoSaveTimer);
    autoSaveTimer = window.setTimeout(() => saveDraft(false), AUTO_SAVE_MS);
  }

  function loadDraft(manual) {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) {
        if (manual) setStatus(tr('atelier.status.noDraft', 'Kein gespeicherter Entwurf gefunden.'), 'info');
        return false;
      }
      applyDraft(JSON.parse(raw), !manual);
      if (manual) setStatus(tr('atelier.status.loaded', 'Entwurf geladen.'), 'success');
      return true;
    } catch {
      if (manual) setStatus(tr('atelier.status.loadError', 'Entwurf konnte nicht geladen werden.'), 'error');
      return false;
    }
  }

  function addCollageFromDataUrl(src) {
    if (collageItems.length >= MAX_COLLAGE) {
      setStatus(tr('atelier.status.collageMax', `Maximal ${MAX_COLLAGE} Bilder in der Kollage.`), 'error');
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
      setStatus(tr('atelier.status.collageAdded', 'Bild zur Kollage – ziehen zum Verschieben.'), 'success');
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
        reject(new Error(tr('atelier.status.imageError', 'Bild konnte nicht geladen werden')));
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
      btn.title = tr('atelier.collageSelect', 'Kollage-Bild auswählen');
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

  function clearCanvas() {
    const msg = tr('atelier.confirmClear', 'Alles löschen – Zeichnung und Kollage?');
    if (!window.confirm(msg)) return;
    strokes.length = 0;
    collageItems.length = 0;
    collageImages.clear();
    selectedCollageId = null;
    syncCollageBar();
    pushHistory();
    render();
    setStatus(tr('atelier.status.cleared', 'Leinwand geleert.'), 'info');
  }

  function exportFlattenedCanvas() {
    const { cssW, cssH } = canvasSize();
    const off = document.createElement('canvas');
    off.width = Math.floor(cssW);
    off.height = Math.floor(cssH);
    const octx = off.getContext('2d');
    paintBackground(octx, off.width, off.height);
    collageItems.forEach((item) => {
      const img = collageImages.get(item.id);
      if (img && img.complete) octx.drawImage(img, item.x, item.y, item.w, item.h);
    });
    strokes.forEach((s) => drawPath(s, octx));
    return off;
  }

  function downloadPng() {
    if (!strokes.length && !collageItems.length) {
      setStatus(tr('atelier.status.empty', 'Bitte erst etwas gestalten.'), 'error');
      return;
    }
    const off = exportFlattenedCanvas();
    const link = document.createElement('a');
    link.download = `atelier-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = off.toDataURL('image/png', 0.92);
    link.click();
    setStatus(tr('atelier.status.downloaded', 'Bild heruntergeladen.'), 'success');
  }

  async function submitWork(e) {
    e.preventDefault();
    const form = e.target;
    const anonymous = form.querySelector('[name="anonymous"]').checked;
    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const note = form.querySelector('[name="note"]').value.trim();

    if (!anonymous && !name && !email) {
      setStatus(tr('atelier.status.identity', 'Bitte Name oder E-Mail – oder „Anonym senden“.'), 'error');
      return;
    }
    if (!strokes.length && !collageItems.length) {
      setStatus(tr('atelier.status.emptySend', 'Bitte erst etwas gestalten, bevor gesendet wird.'), 'error');
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    setStatus(tr('atelier.status.sending', 'Wird gesendet …'), 'info');

    try {
      const off = exportFlattenedCanvas();
      const blob = await new Promise((res, rej) => {
        off.toBlob((b) => (b ? res(b) : rej(new Error('Export fehlgeschlagen'))), 'image/png', 0.92);
      });

      const fd = new FormData();
      fd.append('image', blob, 'atelier-werk.png');
      fd.append('anonymous', anonymous ? '1' : '0');
      fd.append('name', name);
      fd.append('email', email);
      fd.append('note', note);

      const res = await fetch('/api/atelier/submit', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Senden fehlgeschlagen');

      setStatus(data.message || tr('atelier.status.sent', 'Vielen Dank – das Werk wurde übermittelt.'), 'success');
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

  function syncPaletteActive() {
    root.querySelectorAll('[data-palette-color]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.paletteColor === color);
    });
  }

  function buildPalette() {
    const wrap = root.querySelector('[data-palette]');
    if (!wrap) return;
    wrap.innerHTML = '';
    PALETTE.forEach((hex) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'atelier-palette-swatch';
      btn.dataset.paletteColor = hex;
      btn.style.backgroundColor = hex;
      btn.title = hex;
      btn.setAttribute('aria-label', hex);
      btn.addEventListener('click', () => {
        color = hex;
        const colorInput = root.querySelector('[data-color]');
        if (colorInput) colorInput.value = hex;
        syncPaletteActive();
        if (tool === 'erase') setTool('brush');
      });
      wrap.appendChild(btn);
    });
    syncPaletteActive();
  }

  function bindUI() {
    root.querySelectorAll('[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => setTool(btn.dataset.tool));
    });

    root.querySelector('[data-color]')?.addEventListener('input', (e) => {
      color = e.target.value;
      syncPaletteActive();
    });
    root.querySelector('[data-size]')?.addEventListener('input', (e) => {
      size = Number(e.target.value) || 8;
    });
    root.querySelector('[data-opacity]')?.addEventListener('input', (e) => {
      brushOpacity = (Number(e.target.value) || 45) / 100;
    });
    root.querySelector('[data-fill]')?.addEventListener('change', (e) => {
      fillShapes = e.target.checked;
    });
    root.querySelector('[data-soft-brush]')?.addEventListener('change', (e) => {
      softBrush = e.target.checked;
    });

    root.querySelector('[data-undo]')?.addEventListener('click', undo);
    root.querySelector('[data-redo]')?.addEventListener('click', redo);
    root.querySelector('[data-clear]')?.addEventListener('click', clearCanvas);
    root.querySelector('[data-save-draft]')?.addEventListener('click', () => saveDraft(true));
    root.querySelector('[data-load-draft]')?.addEventListener('click', () => loadDraft(true));
    root.querySelector('[data-download]')?.addEventListener('click', downloadPng);
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
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', (e) => {
      if (drawing) commitStroke(pointerPos(e));
      if (dragCollage) {
        dragCollage = null;
        pushHistory();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!root.contains(document.activeElement) && document.activeElement !== document.body) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (mod && e.key === 's') {
        e.preventDefault();
        saveDraft(true);
      }
    });

    window.addEventListener('beforeunload', (e) => {
      if (dirty) {
        saveDraft(false);
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  buildPalette();
  bindUI();
  setTool('brush');
  toggleIdentityFields();
  resetHistoryFromCurrent();
  canvasSize();

  const restored = loadDraft(false);
  if (restored) {
    setStatus(tr('atelier.status.restored', 'Dein letzter Entwurf wurde wiederhergestellt.'), 'info');
  }

  window.addEventListener('resize', () => canvasSize());
  document.addEventListener('kt-lang-change', () => {
    if (saveIndicator && !saveIndicator.hidden) {
      saveIndicator.textContent = tr('atelier.autosaved', 'Automatisch gespeichert');
    }
  });
})();
