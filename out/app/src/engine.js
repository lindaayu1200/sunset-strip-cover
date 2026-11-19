// The cover renderer. Every measurement is derived from the canvas size so the
// same state produces the same artwork in the preview and in any export size.

import { layoutPanels, LAYOUTS } from './layouts.js';
import { paintSky, drawPalms, GRADES } from './grade.js';
import { drawLettering } from './caption.js';
import { drawFrame } from './frames.js';
import { drawBandPattern } from './patterns.js';
import { drawBadge } from './marks.js';

const DEFAULT_BAND = 0.26;

// "Raw" keeps the lettering and panels but drops back to a neutral palette.
const RAW_GRADE = {
  id: 'none',
  name: 'Raw',
  sky: ['#20102f', '#6c3459', '#d98a63'],
  sun: '#ffdca6',
  sea: '#1d1533',
  land: '#0d0918',
  accent: '#ffc46b',
  ink: '#fff4e8',
  dark: '#06040e'
};

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function withAlpha(color, alpha) {
  const value = String(color || '').trim();
  if (value.charAt(0) === '#') {
    let hex = value.slice(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }
  }
  const parts = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (parts) {
    return 'rgba(' + parts[1] + ', ' + parts[2] + ', ' + parts[3] + ', ' + alpha + ')';
  }
  return value;
}

function resolveGrade(id) {
  if (id === 'none' || id === 'raw') return RAW_GRADE;
  return GRADES[id] || GRADES.vice;
}

function hashString(value) {
  let hash = 2166136261;
  const text = String(value == null ? '' : value);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRandom(seed) {
  let value = (Number(seed) || 0) >>> 0;
  return function () {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cover-fit math: scale to cover the rect, centre it, then apply the photo's
// own zoom and pan offsets. ox/oy are fractions of the overflow on each axis.
export function fitCover(img, rect, photo) {
  if (!img || !rect || !(rect.w > 0) || !(rect.h > 0)) return null;
  const iw = img.naturalWidth || img.width || 0;
  const ih = img.naturalHeight || img.height || 0;
  if (!(iw > 0) || !(ih > 0)) return null;

  const zoom = clamp(photo && photo.zoom, 0.5, 4);
  const ox = clamp(photo && photo.ox, -1, 1);
  const oy = clamp(photo && photo.oy, -1, 1);
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const x = rect.x + (rect.w - dw) / 2 + ox * Math.max(0, dw - rect.w);
  const y = rect.y + (rect.h - dh) / 2 + oy * Math.max(0, dh - rect.h);

  return { x, y, w: dw, h: dh, scale, zoom, ox, oy };
}

function paintPanel(ctx, rect, photo, grade, w, h, frame) {
  if (!rect || !(rect.w > 0) || !(rect.h > 0)) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  const fit = photo ? fitCover(photo.img, rect, photo) : null;
  if (fit) {
    ctx.drawImage(photo.img, fit.x, fit.y, fit.w, fit.h);
  }

  // Two overlapping colour washes give a multiply-ish grade without changing
  // the underlying photo pixels.
  const top = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  top.addColorStop(0, withAlpha(grade.sky[0], 0.35));
  top.addColorStop(1, withAlpha(grade.sky[0], 0));
  ctx.fillStyle = top;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  const bottom = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  bottom.addColorStop(0, withAlpha(grade.land, 0));
  bottom.addColorStop(1, withAlpha(grade.land, 0.3));
  ctx.fillStyle = bottom;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  const line = Math.max(1, Math.min(w, h) * 0.0012);
  ctx.strokeStyle = withAlpha(grade.ink, 0.25);
  ctx.lineWidth = line;
  ctx.strokeRect(rect.x + line / 2, rect.y + line / 2, rect.w - line, rect.h - line);
  ctx.restore();

  drawFrame(ctx, rect, frame, grade);
}

function paintBand(ctx, w, h, band, grade, state) {
  if (!(band > 0)) return;
  const top = h - band;
  const dark = grade.dark || '#080318';

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, w, band);
  ctx.clip();

  const gradient = ctx.createLinearGradient(0, top, 0, h);
  gradient.addColorStop(0, withAlpha(dark, 0.85));
  gradient.addColorStop(0.55, withAlpha(dark, 0.5));
  gradient.addColorStop(1, withAlpha(dark, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, top, w, band);

  // A second, gentler scrim keeps the lower line of type readable.
  const scrim = ctx.createLinearGradient(0, top, 0, h);
  scrim.addColorStop(0, withAlpha(dark, 0));
  scrim.addColorStop(1, withAlpha(dark, 0.5));
  ctx.fillStyle = scrim;
  ctx.fillRect(0, top, w, band);

  drawBandPattern(ctx, w, h, band, grade, state.pattern);
  if (state.badge) drawBadge(ctx, w, h, band, grade, state.badgeStyle);

  drawLettering(ctx, w, h, band, grade, {
    title: state.title,
    subtitle: state.subtitle,
    kicker: state.kicker,
    style: state.lettering,
    ink: state.ink,
    sizeScale: state.sizeScale
  });
  ctx.restore();
}

function paintGrain(ctx, w, h, seed) {
  const tileSize = 96;
  let tile;
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    tile = document.createElement('canvas');
    tile.width = tileSize;
    tile.height = tileSize;
  } else if (typeof OffscreenCanvas !== 'undefined') {
    tile = new OffscreenCanvas(tileSize, tileSize);
  }
  if (!tile) return;

  const tctx = tile.getContext && tile.getContext('2d');
  if (!tctx) return;
  const image = tctx.createImageData(tileSize, tileSize);
  const rand = makeRandom(seed);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.floor(rand() * 256);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  tctx.putImageData(image, 0, 0);

  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function renderCover(canvas, w, h, state) {
  if (!canvas || !(w > 0) || !(h > 0)) return canvas;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const options = state || {};
  const grade = resolveGrade(options.grade);
  const layout = LAYOUTS[options.layout];
  const bandRatio = layout && typeof layout.letteringBand === 'number' ? layout.letteringBand : DEFAULT_BAND;
  const band = clamp(h * bandRatio, 0, h * 0.6);
  const panels = layoutPanels(options.layout, w, h);
  const photos = Array.isArray(options.photos) ? options.photos : [];
  const seed = hashString((options.idea || '') + '|' + (options.title || '') + '|' + options.layout);

  ctx.clearRect(0, 0, w, h);

  // (a) Sky base.
  paintSky(ctx, w, h, grade);

  // (b) Photo panels, colour tone and frames.
  for (let i = 0; i < panels.length; i += 1) {
    const photo = photos.length ? photos[i % photos.length] : null;
    paintPanel(ctx, panels[i], photo, grade, w, h, options.frame);
  }

  // (c) Palms sit over the photo area, not over the caption band.
  if (options.palms) {
    const areaH = h - band;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, areaH);
    ctx.clip();
    drawPalms(ctx, w, areaH, grade, seed);
    ctx.restore();
  }

  // (d) Caption band: gradient, texture, badge, lettering.
  paintBand(ctx, w, h, band, grade, options);

  // (e) Subtle grain over everything.
  if (options.grain) paintGrain(ctx, w, h, seed ^ 0x9e3779b9);

  // (f) Final inner edge.
  const edge = Math.max(1, Math.min(w, h) * 0.0012);
  ctx.save();
  ctx.strokeStyle = withAlpha(grade.ink, 0.4);
  ctx.lineWidth = edge;
  ctx.strokeRect(edge / 2, edge / 2, w - edge, h - edge);
  ctx.restore();

  return canvas;
}
