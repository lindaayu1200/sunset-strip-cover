// Wires the studio: state, photos into panels, live preview, export. A `?shot=` query sets a
// fixed scene for a screenshot instead (./shots.js).
import { renderCover } from './engine.js';
import { LAYOUTS } from './layouts.js';
import { exportCover, saveBlob } from './exporter.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const deck = document.getElementById('deck');
const statusEl = document.getElementById('status');

const state = {
  layout: 'grid4',
  grade: 'vice',
  lettering: 'slab',
  ink: 'white',
  title: 'SUNSET STRIP',
  subtitle: 'VICE CITY STORIES · VOL. 01',
  kicker: 'THE COAST IS YOURS',
  titleScale: 100,
  grain: 42,
  glow: 55,
  palms: true,
  badge: true,
  badgeStyle: 'classic',
  frame: 'none',
  pattern: 'none',
  grainOn: true,
  size: '1080x1080',
  panels: [],
};

let active = 0;
const ui = {};

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The state as the exporter and the screenshot harness read it. */
export function coverState() {
  return {
    ...state,
    palms: state.palms,
    grain: state.grainOn ? state.grain : 0,
  };
}

function slotCount() {
  return (LAYOUTS[state.layout] ?? LAYOUTS.grid4).panels.length;
}

function redraw() {
  const w = canvas.width;
  const h = canvas.height;
  while (state.panels.length < slotCount()) state.panels.push(null);
  renderCover(canvas.getContext('2d'), w, h, coverState());
  canvas.style.aspectRatio = `${w} / ${h}`;
  drawDeck();
}

function drawDeck() {
  deck.textContent = '';
  for (let i = 0; i < slotCount(); i++) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'slot' + (i === active ? ' is-on' : '');
    const p = state.panels[i];
    if (p?.thumb) {
      slot.style.backgroundImage = `url(${p.thumb})`;
    } else {
      slot.textContent = `Panel ${i + 1}`;
    }
    const n = document.createElement('span');
    n.textContent = String(i + 1);
    slot.appendChild(n);
    slot.addEventListener('click', () => {
      active = i;
      redraw();
    });
    deck.appendChild(slot);
  }
}

/** Loads photos and fills the panels: one photo per slot in order, the last repeating. */
async function setPhotos(filesOrUrls) {
  const urls = filesOrUrls.map((f) => (typeof f === 'string' ? f : URL.createObjectURL(f)));
  const imgs = [];
  for (const url of urls) {
    const img = await loadImage(url);
    imgs.push({ img, url });
  }
  if (!imgs.length) return;
  const n = slotCount();
  state.panels = [];
  for (let i = 0; i < n; i++) {
    const pick = imgs[Math.min(i, imgs.length - 1)];
    state.panels.push({ img: pick.img, thumb: pick.url, view: { panX: 0, panY: 0, zoom: 1 } });
  }
  status(`Loaded ${imgs.length} photo${imgs.length > 1 ? 's' : ''} into ${n} panels`, true);
  redraw();
}

function status(text, ok = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('ok', ok);
}

function bind(id, key, parse = (v) => v, after = redraw) {
  const el = document.getElementById(id);
  ui[id] = el;
  el.addEventListener('input', () => {
    const v = el.type === 'checkbox' ? el.checked : parse(el.value);
    state[key] = v;
    after();
  });
  return el;
}

bind('title', 'title');
bind('subtitle', 'subtitle');
bind('kicker', 'kicker');
bind('lettering', 'lettering');
bind('ink', 'ink');
bind('layout', 'layout');
bind('grade', 'grade');
bind('titlesize', 'titleScale', Number);
bind('grainamt', 'grain', Number);
bind('glow', 'glow', Number);
bind('frame', 'frame');
bind('pattern', 'pattern');
ui.palms = bind('palms', 'palms');
ui.badge = bind('badge', 'badge');
document.getElementById('grain').addEventListener('change', (e) => {
  state.grainOn = e.target.checked;
  redraw();
});
state.grainOn = true;

// Caption ideas and the frame/texture style pickers are filled from their modules.
Promise.all([import('./ideas.js'), import('./frames.js'), import('./patterns.js'), import('./marks.js')]).then(([ideas, frames, patterns, marks]) => {
  const row = document.getElementById('ideas');
  for (const idea of ideas.IDEAS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ghost';
    b.textContent = idea.mood;
    b.addEventListener('click', () => {
      state.title = idea.title;
      state.subtitle = idea.subtitle;
      state.kicker = idea.kicker;
      for (const [id, key] of [['title', 'title'], ['subtitle', 'subtitle'], ['kicker', 'kicker']]) {
        document.getElementById(id).value = idea[key];
      }
      redraw();
      status(`Idea: ${idea.mood}`);
    });
    row.appendChild(b);
  }
  fillSelect('frame', Object.values(frames.FRAMES));
  fillSelect('pattern', Object.values(patterns.PATTERNS));
  fillSelect('badgeStyle', Object.values(marks.BADGES));
}).catch(() => {});

function fillSelect(id, items) {
  const el = document.getElementById(id);
  if (!el || !Array.isArray(items)) return;
  const keep = el.value;
  el.textContent = '';
  for (const item of items) {
    const o = document.createElement('option');
    o.value = item.id;
    o.textContent = item.name;
    el.appendChild(o);
  }
  if ([...el.options].some((o) => o.value === keep)) el.value = keep;
}

document.getElementById('shuffle').addEventListener('click', () => {
  const n = slotCount();
  const filled = state.panels.filter(Boolean);
  if (filled.length < 2) return;
  const rot = filled.slice(1).concat(filled.slice(0, 1));
  state.panels = [];
  for (let i = 0; i < n; i++) state.panels.push(rot[i % rot.length] ?? null);
  redraw();
  status('Panels shuffled');
});
document.getElementById('reset').addEventListener('click', () => {
  state.panels = state.panels.map((p) => (p ? { ...p, view: { panX: 0, panY: 0, zoom: 1 } } : null));
  redraw();
  status('All panels recentered');
});

document.getElementById('export').addEventListener('click', async () => {
  const btn = document.getElementById('export');
  btn.disabled = true;
  status(`Exporting ${state.size.replace('x', ' x ')} PNG...`);
  try {
    await fontsReady();
    const { blob, name } = await exportCover(coverState(), state.size);
    saveBlob(blob, name);
    status(`Saved ${name}`, true);
  } catch (err) {
    status(`Export failed: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
});

function fontsReady() {
  return Promise.all([
    document.fonts.load('400 48px "Anton"'),
    document.fonts.load('400 48px "Bebas Neue"'),
  ]).catch(() => {});
}

// Size buttons swap the export size and the preview aspect.
document.querySelectorAll('.size').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size').forEach((b) => b.classList.remove('is-on'));
    btn.classList.add('is-on');
    state.size = btn.dataset.size;
    const [w, h] = state.size.split('x').map(Number);
    canvas.width = w;
    canvas.height = h;
    redraw();
  });
});

// Photos: picker and drag-and-drop onto the stage.
const photoInput = document.getElementById('photo');
photoInput.addEventListener('change', () => setPhotos([...photoInput.files]));
const drop = document.getElementById('drop');
const stage = document.querySelector('.stage');
['dragenter', 'dragover'].forEach((ev) => {
  stage.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add('over');
  });
});
['dragleave', 'drop'].forEach((ev) => {
  stage.addEventListener(ev, (e) => {
    e.preventDefault();
    if (ev === 'drop' && e.dataTransfer?.files?.length) setPhotos([...e.dataTransfer.files]);
    drop.classList.remove('over');
  });
});

// Pan and zoom on the active panel, right on the preview.
let dragFrom = null;
canvas.addEventListener('pointerdown', (e) => {
  if (!state.panels[active]) return;
  dragFrom = { x: e.clientX, y: e.clientY, panX: state.panels[active].view.panX, panY: state.panels[active].view.panY };
  canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragFrom) return;
  const rect = canvas.getBoundingClientRect();
  const view = state.panels[active].view;
  view.panX = clamp01(dragFrom.panX + (e.clientX - dragFrom.x) / rect.width * 1.4);
  view.panY = clamp01(dragFrom.panY + (e.clientY - dragFrom.y) / rect.height * 1.4);
  redraw();
});
canvas.addEventListener('pointerup', () => {
  dragFrom = null;
  canvas.classList.remove('dragging');
});
canvas.addEventListener('wheel', (e) => {
  if (!state.panels[active]) return;
  e.preventDefault();
  const view = state.panels[active].view;
  view.zoom = clamp(view.zoom * (e.deltaY > 0 ? 0.94 : 1.06), 1, 3.5);
  redraw();
}, { passive: false });

function clamp01(v) {
  return clamp(v, -1, 1);
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Screenshot scenes and the app's own state hooks.
window.__coverState = coverState;
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(async (sampleUrls, opts) => {
    Object.assign(state, opts);
    for (const [id, key] of [['title', 'title'], ['subtitle', 'subtitle'], ['kicker', 'kicker'], ['lettering', 'lettering'], ['ink', 'ink'], ['layout', 'layout'], ['grade', 'grade']]) {
      const el = document.getElementById(id);
      if (el && opts[key] !== undefined) el.value = opts[key];
    }
    const sizeBtn = document.querySelector(`.size[data-size="${opts.size}"]`);
    if (sizeBtn) sizeBtn.click();
    await fontsReady();
    await setPhotos(sampleUrls);
  });
} else {
  redraw();
  status('Ready — add photos or open the samples');
}
