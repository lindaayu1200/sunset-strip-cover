// Editor controller: state, control wiring, interaction and automated shots.

import { renderCover, fitCover } from './engine.js';
import { renderAt, exportBlob, SIZES } from './exporter.js';
import { LAYOUTS, layoutPanels } from './layouts.js';
import { GRADES } from './grade.js';
import { INKS } from './caption.js';
import { FRAMES } from './frames.js';
import { PATTERNS } from './patterns.js';
import { BADGES } from './marks.js';
import { IDEAS, ideaById, pickIdea } from './ideas.js';

// An extra ink keeps the "Electric Blue" option from the markup distinct.
if (!INKS.blue) {
  INKS.blue = { id: 'blue', name: 'Electric Blue', color: '#59c8ff' };
}

const LETTERING_STYLES = {
  slab: 'Slab',
  chrome: 'Chrome',
  neon: 'Neon',
  stencil: 'Stencil'
};

// Option values in the markup use friendlier names than the renderer's ids.
// They are normalised once at startup, so event handlers only see real ids.
const LEGACY = {
  layout: { single: 'cinema', duo: 'duo', trio: 'strip3', grid: 'grid4', stripe: 'strip3' },
  grade: { golden: 'gold', vapor: 'miami', noir: 'vice' },
  lettering: { anton: 'slab', bebas: 'stencil', russo: 'chrome' },
  ink: { 'hot-pink': 'pink', 'sunset-orange': 'gold', cream: 'white', 'electric-blue': 'blue' }
};

// Mood ids used by the markup that are not part of the built-in idea packs.
const UI_IDEAS = {
  'neon-nights': { id: 'neon-nights', title: 'NEON NIGHTS', subtitle: 'EVERY SIGN IS A PROMISE', kicker: 'AFTER DARK ON THE STRIP' },
  'after-hours': { id: 'after-hours', title: 'AFTER HOURS', subtitle: 'THE DOOR OPENS WHEN THE CITY SLEEPS', kicker: 'ONE MORE SONG' },
  'golden-hour': { id: 'golden-hour', title: 'GOLDEN HOUR', subtitle: 'THE LAST LIGHT ON THE PACIFIC', kicker: 'STAY UNTIL IT DISAPPEARS' },
  'vice-city': { id: 'vice-city', title: 'VICE CITY', subtitle: 'FAST CARS, BRIGHT LIGHTS, NO RULES', kicker: 'THE COAST IS YOURS' },
  poolside: { id: 'poolside', title: 'POOLSIDE', subtitle: 'SUN, NOISE AND A DRINK IN YOUR HAND', kicker: 'SUMMER NEVER ENDS' },
  'midnight-drive': { id: 'midnight-drive', title: 'MIDNIGHT DRIVE', subtitle: 'ONE LAST RIDE THROUGH THE CITY', kicker: 'NO DESTINATION' },
  'last-call': { id: 'last-call', title: 'LAST CALL', subtitle: 'THE NIGHT IS NOT OVER YET', kicker: 'ORDERS AT THE BAR' },
  'sunset-boulevard': { id: 'sunset-boulevard', title: 'SUNSET BOULEVARD', subtitle: 'WHERE EVERY DREAM GETS A SIGN', kicker: 'MILE AFTER MILE' }
};

const SAMPLE_IMAGES = ['sunset-boulevard', 'beach-pier', 'neon-rooftop'];
const imageWaits = [];
const params = new URLSearchParams(window.location.search);

function byId(id) {
  return document.getElementById(id);
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function makeEntry(src, revoke) {
  const img = new Image();
  img.decoding = 'async';
  const ready = new Promise((resolve) => {
    const finish = () => {
      if (revoke) URL.revokeObjectURL(revoke);
      requestRender();
      resolve();
    };
    img.addEventListener('load', finish, { once: true });
    img.addEventListener('error', finish, { once: true });
  });
  imageWaits.push(ready);
  img.src = src;
  return { img, zoom: 1, ox: 0, oy: 0 };
}

function sampleEntry(name) {
  return makeEntry('vendor/samples/' + name + '.jpg');
}

const state = {
  photos: [
    sampleEntry(SAMPLE_IMAGES[0]),
    sampleEntry(SAMPLE_IMAGES[1]),
    sampleEntry(SAMPLE_IMAGES[2]),
    sampleEntry(SAMPLE_IMAGES[0])
  ],
  layout: 'grid4',
  grade: 'vice',
  title: 'SUNSET STRIP',
  subtitle: 'VICE CITY STORIES · VOL. 01',
  kicker: 'THE COAST IS YOURS',
  lettering: 'slab',
  ink: 'white',
  sizeScale: 1,
  palms: true,
  grain: true,
  badge: true,
  badgeStyle: 'classic',
  frame: 'none',
  pattern: 'none',
  idea: '',
  size: 'square'
};

window.__coverState = () => state;

let panels = [];
let renderFrame = 0;
let activeThumb = 0;
let userPhotosAdded = false;
let drag = null;

function currentSize() {
  return SIZES[state.size] || SIZES.square;
}

function requestRender() {
  if (params.get('shot') === 'export' || params.get('shot') === 'cover') return;
  if (renderFrame) return;
  renderFrame = window.requestAnimationFrame(() => {
    renderFrame = 0;
    renderPreview();
  });
}

function renderPreview() {
  const canvas = byId('preview-canvas');
  if (!canvas) return;
  const size = currentSize();
  if (canvas.width !== size.w) canvas.width = size.w;
  if (canvas.height !== size.h) canvas.height = size.h;
  canvas.style.aspectRatio = size.w + ' / ' + size.h;

  panels = layoutPanels(state.layout, size.w, size.h);
  renderCover(canvas, size.w, size.h, state);

  const meta = byId('stage-meta');
  if (meta) meta.textContent = size.w + ' \u00d7 ' + size.h;
}

function normalize(kind, value) {
  const table = LEGACY[kind];
  const text = String(value == null ? '' : value);
  return (table && Object.prototype.hasOwnProperty.call(table, text) && table[text]) || text;
}

function parseBool(value, fallback) {
  if (value == null) return fallback;
  const text = String(value).toLowerCase();
  return !(text === '' || text === '0' || text === 'false' || text === 'no' || text === 'off');
}

function parseTitleSize(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  const scale = number > 4 ? number / 96 : number;
  return clamp(scale, 0.5, 1.5);
}

function sizeFromParam(value) {
  if (!value) return null;
  if (SIZES[value]) return SIZES[value];
  const match = String(value).match(/^(\d+)\s*[x\u00d7]\s*(\d+)$/i);
  if (!match) return null;
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (!(w > 0) || !(h > 0)) return null;
  const found = Object.keys(SIZES).find((key) => SIZES[key].w === w && SIZES[key].h === h);
  if (found) return SIZES[found];
  const custom = { id: 'custom', name: w + ' x ' + h, w, h };
  SIZES.custom = custom;
  return custom;
}

function applyParams() {
  if (params.has('photo')) {
    const names = String(params.get('photo'))
      .split(',')
      .map((name) => name.trim())
      .filter((name) => /^[A-Za-z0-9_-]+$/.test(name))
      .slice(0, 4);
    if (names.length) state.photos = names.map(sampleEntry);
  }

  if (params.has('caption')) state.title = params.get('caption');
  if (params.has('subtitle')) state.subtitle = params.get('subtitle');
  if (params.has('kicker')) state.kicker = params.get('kicker');
  if (params.has('layout')) state.layout = normalize('layout', params.get('layout'));
  if (params.has('grade')) state.grade = normalize('grade', params.get('grade'));
  if (params.has('lettering')) state.lettering = normalize('lettering', params.get('lettering'));
  if (params.has('ink')) state.ink = normalize('ink', params.get('ink'));
  if (params.has('frame')) state.frame = normalize('frame', params.get('frame'));
  if (params.has('pattern')) state.pattern = normalize('pattern', params.get('pattern'));
  if (params.has('badges')) {
    state.badgeStyle = params.get('badges') || 'classic';
    state.badge = state.badgeStyle !== 'none';
  }
  if (params.has('palms')) state.palms = parseBool(params.get('palms'), true);
  if (params.has('grain')) state.grain = parseBool(params.get('grain'), true);
  if (params.has('title-size')) state.sizeScale = parseTitleSize(params.get('title-size'));
  if (params.has('idea')) state.idea = params.get('idea') || '';

  const size = sizeFromParam(params.get('size'));
  if (size) state.size = size.id;
}

function addOption(select, value, label) {
  if (!select || !value) return;
  const exists = Array.from(select.options).some((option) => option.value === value);
  if (exists) return;
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function rewriteLegacyOptions(select, kind) {
  if (!select) return;
  const table = LEGACY[kind];
  if (!table) return;
  Array.from(select.options).forEach((option) => {
    if (Object.prototype.hasOwnProperty.call(table, option.value)) {
      option.value = table[option.value];
    }
  });
}

function prepareOptions() {
  rewriteLegacyOptions(byId('select-layout'), 'layout');
  rewriteLegacyOptions(byId('select-grade'), 'grade');
  rewriteLegacyOptions(byId('select-lettering'), 'lettering');
  rewriteLegacyOptions(byId('select-ink'), 'ink');

  Object.keys(LAYOUTS).forEach((id) => addOption(byId('select-layout'), id, LAYOUTS[id].name));

  Object.keys(GRADES).forEach((id) => addOption(byId('select-grade'), id, GRADES[id].name));
  addOption(byId('select-grade'), 'none', 'Raw');

  Object.keys(LETTERING_STYLES).forEach((id) => addOption(byId('select-lettering'), id, LETTERING_STYLES[id]));
  Object.keys(INKS).forEach((id) => addOption(byId('select-ink'), id, INKS[id].name));

  Object.keys(FRAMES).forEach((id) => addOption(byId('select-frame'), id, FRAMES[id].name));
  Object.keys(PATTERNS).forEach((id) => addOption(byId('select-pattern'), id, PATTERNS[id].name));
  Object.keys(BADGES).forEach((id) => addOption(byId('select-badge'), id, BADGES[id].name));
  addOption(byId('select-badge'), 'none', 'none');

  IDEAS.forEach((idea) => addOption(byId('select-idea'), idea.id, idea.mood));
  Object.keys(UI_IDEAS).forEach((id) => addOption(byId('select-idea'), id, id.replace(/-/g, ' ')));
}

function ideaFor(id) {
  return ideaById(id) || UI_IDEAS[id] || pickIdea();
}

function syncControls() {
  byId('input-title').value = state.title;
  byId('input-subtitle').value = state.subtitle;
  byId('input-kicker').value = state.kicker;
  byId('select-layout').value = state.layout;
  byId('select-grade').value = state.grade;
  byId('select-lettering').value = state.lettering;
  byId('select-ink').value = state.ink;
  byId('select-frame').value = state.frame;
  byId('select-pattern').value = state.pattern;
  byId('select-badge').value = state.badgeStyle;
  byId('select-idea').value = state.idea || '';

  const slider = byId('input-title-size');
  const sliderValue = Math.round(state.sizeScale * 96);
  slider.value = String(sliderValue);
  byId('title-size-value').textContent = String(sliderValue);

  byId('check-palms').checked = state.palms;
  byId('check-grain').checked = state.grain;
  byId('check-badge').checked = state.badge;

  Array.from(document.querySelectorAll('.btn-size')).forEach((button) => {
    button.classList.toggle('is-active', button.dataset.size === state.size);
  });
}

function renderThumbs() {
  const strip = byId('thumb-strip');
  if (!strip) return;
  strip.textContent = '';

  if (!state.photos.length) {
    const empty = document.createElement('p');
    empty.className = 'thumb-empty';
    empty.textContent = 'No photos yet — add some to start building panels.';
    strip.appendChild(empty);
    return;
  }

  state.photos.forEach((entry, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb' + (index === activeThumb ? ' is-active' : '');
    button.style.backgroundImage = 'url(' + JSON.stringify(String(entry.img.src)) + ')';
    button.title = 'Move photo ' + (index + 1) + ' to the first panel';

    const label = document.createElement('span');
    label.className = 'thumb-index';
    label.textContent = String(index + 1);
    button.appendChild(label);

    button.addEventListener('click', () => {
      if (index < state.photos.length) {
        const moved = state.photos.splice(index, 1)[0];
        state.photos.unshift(moved);
        activeThumb = 0;
        renderThumbs();
        requestRender();
      }
    });
    strip.appendChild(button);
  });
}

function addFiles(files) {
  const images = Array.from(files || []).filter((file) => /^image\//.test(file.type || ''));
  if (!images.length) return;
  if (!userPhotosAdded) {
    state.photos = [];
    userPhotosAdded = true;
  }
  images.forEach((file) => {
    const url = URL.createObjectURL(file);
    state.photos.push(makeEntry(url, url));
  });
  activeThumb = 0;
  renderThumbs();
  requestRender();
}

function installDropTarget(target) {
  if (!target) return;
  const zone = byId('dropzone');

  target.addEventListener('dragenter', (event) => {
    event.preventDefault();
    if (zone) zone.classList.add('is-dragover');
  });
  target.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    if (zone) zone.classList.add('is-dragover');
  });
  target.addEventListener('dragleave', () => {
    if (zone) zone.classList.remove('is-dragover');
  });
  target.addEventListener('drop', (event) => {
    event.preventDefault();
    if (zone) zone.classList.remove('is-dragover');
    if (event.dataTransfer) addFiles(event.dataTransfer.files);
  });
}

function pointOnCanvas(event) {
  const canvas = byId('preview-canvas');
  const box = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - box.left) * canvas.width / (box.width || 1),
    y: (event.clientY - box.top) * canvas.height / (box.height || 1)
  };
}

function panelAt(point) {
  for (let i = 0; i < panels.length; i += 1) {
    const rect = panels[i];
    if (point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h) {
      return i;
    }
  }
  return -1;
}

function photoForPanel(index) {
  if (!state.photos.length) return null;
  return state.photos[index % state.photos.length];
}

function installCanvasInteraction() {
  const canvas = byId('preview-canvas');
  if (!canvas) return;
  canvas.style.touchAction = 'none';

  canvas.addEventListener('mousedown', (event) => {
    const index = panelAt(pointOnCanvas(event));
    const photo = photoForPanel(index);
    if (!photo) return;
    const point = pointOnCanvas(event);
    drag = { index, photo, x: point.x, y: point.y };
    event.preventDefault();
  });

  window.addEventListener('mousemove', (event) => {
    if (!drag) return;
    const point = pointOnCanvas(event);
    const rect = panels[drag.index];
    if (!rect) return;
    const fit = fitCover(drag.photo.img, rect, drag.photo);
    if (fit) {
      const rangeX = fit.w - rect.w;
      const rangeY = fit.h - rect.h;
      if (rangeX > 0) drag.photo.ox = clamp(drag.photo.ox + (point.x - drag.x) / rangeX, -1, 1);
      if (rangeY > 0) drag.photo.oy = clamp(drag.photo.oy + (point.y - drag.y) / rangeY, -1, 1);
    }
    drag.x = point.x;
    drag.y = point.y;
    requestRender();
  });

  window.addEventListener('mouseup', () => {
    drag = null;
  });

  canvas.addEventListener('wheel', (event) => {
    const index = panelAt(pointOnCanvas(event));
    const photo = photoForPanel(index);
    if (!photo) return;
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0015);
    photo.zoom = clamp(photo.zoom * factor, 0.5, 4);
    requestRender();
  }, { passive: false });
}

function bindText(id, key) {
  const element = byId(id);
  if (!element) return;
  element.addEventListener('input', () => {
    state[key] = element.value;
    requestRender();
  });
}

function bindSelect(id, key) {
  const element = byId(id);
  if (!element) return;
  element.addEventListener('change', () => {
    state[key] = element.value;
    requestRender();
  });
}

function bindCheck(id, key) {
  const element = byId(id);
  if (!element) return;
  element.addEventListener('change', () => {
    state[key] = element.checked;
    requestRender();
  });
}

function wireControls() {
  bindText('input-title', 'title');
  bindText('input-subtitle', 'subtitle');
  bindText('input-kicker', 'kicker');

  bindSelect('select-lettering', 'lettering');
  bindSelect('select-ink', 'ink');
  bindSelect('select-layout', 'layout');
  bindSelect('select-grade', 'grade');
  bindSelect('select-frame', 'frame');
  bindSelect('select-pattern', 'pattern');

  byId('select-badge').addEventListener('change', (event) => {
    state.badgeStyle = event.target.value;
    state.badge = state.badgeStyle !== 'none';
    byId('check-badge').checked = state.badge;
    requestRender();
  });

  byId('select-idea').addEventListener('change', (event) => {
    state.idea = event.target.value;
    if (!state.idea) return;
    const idea = ideaFor(state.idea);
    state.title = idea.title;
    state.subtitle = idea.subtitle;
    state.kicker = idea.kicker;
    byId('input-title').value = state.title;
    byId('input-subtitle').value = state.subtitle;
    byId('input-kicker').value = state.kicker;
    requestRender();
  });

  const slider = byId('input-title-size');
  slider.addEventListener('input', () => {
    state.sizeScale = parseTitleSize(slider.value);
    byId('title-size-value').textContent = slider.value;
    requestRender();
  });

  bindCheck('check-palms', 'palms');
  bindCheck('check-grain', 'grain');
  byId('check-badge').addEventListener('change', (event) => {
    state.badge = event.target.checked;
    if (state.badge && state.badgeStyle === 'none') {
      state.badgeStyle = 'classic';
      byId('select-badge').value = 'classic';
    }
    requestRender();
  });

  Array.from(document.querySelectorAll('.btn-size')).forEach((button) => {
    button.addEventListener('click', () => {
      state.size = button.dataset.size;
      Array.from(document.querySelectorAll('.btn-size')).forEach((other) => {
        other.classList.toggle('is-active', other === button);
      });
      const size = currentSize();
      byId('stage-meta').textContent = size.w + ' \u00d7 ' + size.h;
      requestRender();
    });
  });

  byId('button-shuffle').addEventListener('click', () => {
    if (state.photos.length > 1) {
      state.photos.unshift(state.photos.pop());
      activeThumb = 0;
      renderThumbs();
    }
    requestRender();
  });

  byId('button-recenter').addEventListener('click', () => {
    state.photos.forEach((photo) => {
      photo.zoom = 1;
      photo.ox = 0;
      photo.oy = 0;
    });
    requestRender();
  });

  byId('input-photos').addEventListener('change', (event) => {
    addFiles(event.target.files);
    event.target.value = '';
  });

  byId('button-export').addEventListener('click', exportPng);

  installDropTarget(byId('dropzone'));
  installDropTarget(byId('preview-canvas'));
  installCanvasInteraction();

  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('drop', (event) => event.preventDefault());
}

async function exportPng() {
  const size = currentSize();
  const button = byId('button-export');
  if (button) button.disabled = true;
  try {
    const blob = await exportBlob(state, size.w, size.h);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sunset-strip-' + size.id + '.png';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Could not export the cover', error);
  } finally {
    if (button) button.disabled = false;
  }
}

async function allImagesReady() {
  await Promise.all(imageWaits);
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (error) {
      // Font failure should not block a shot; the canvas falls back to system fonts.
    }
  }
}

async function runShot() {
  const shot = params.get('shot');
  await allImagesReady();

  if (shot === 'export' || shot === 'cover') {
    const size = currentSize();
    const canvas = renderAt(state, size.w, size.h);
    window.__shotPng = canvas.toDataURL('image/png').split(',')[1] || '';
  } else {
    renderPreview();
  }
  window.__shotReady = true;
}

applyParams();
prepareOptions();
syncControls();
renderThumbs();
wireControls();
renderPreview();
runShot();
