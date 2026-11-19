// The cover renderer: panel composition, per-panel tone, then the atmosphere layer and the
// lettering, all drawn at the export size so a preview and a PNG are the same picture.
import { LAYOUTS, panelRects } from './layouts.js';
import { gradeById, paintAtmosphere } from './grade.js';
import { drawLettering } from './caption.js';
import { drawFrame } from './frames.js';
import { drawBandPattern } from './patterns.js';
import { drawBadge } from './marks.js';

const GUTTER = 10;

/** Deterministic grain tile so two exports of one cover are byte-identical. */
let grainTile = null;
function grainCanvas(size = 128) {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  let seed = 0x9e3779b9;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const v = (seed >>> 24) & 255;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

/** How wide the lettering band is, as a share of the cover height, for this layout and size. */
export function bandHeight(state, h) {
  const layout = LAYOUTS[state.layout];
  if (layout.band === 'none') return 0;
  const wide = state.w > state.h;
  const base = wide ? 0.26 : 0.235;
  return Math.round(h * base * (0.86 + 0.14 * (state.titleScale / 100)));
}

/** Draws one photo into a panel: cover-fit, then the per-panel pan and zoom. */
function drawPanelPhoto(ctx, img, rect, view, tone) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = tone.under ?? '#1b1030';
  ctx.fillRect(x, y, w, h);
  if (img) {
    const zoom = Math.max(1, view?.zoom ?? 1);
    const cover = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const iw = img.naturalWidth * cover;
    const ih = img.naturalHeight * cover;
    const cx = w / 2 + (view?.panX ?? 0) * w * 0.5;
    const cy = h / 2 + (view?.panY ?? 0) * h * 0.5;
    ctx.filter = tone.filter;
    ctx.drawImage(img, x + cx - iw / 2, y + cy - ih / 2, iw, ih);
    ctx.filter = 'none';
  }
  if (tone.wash) {
    ctx.fillStyle = tone.wash;
    ctx.fillRect(x, y, w, h);
  }
  const shade = ctx.createLinearGradient(0, y, 0, y + h);
  shade.addColorStop(0, 'rgba(12, 4, 24, 0.18)');
  shade.addColorStop(0.55, 'rgba(12, 4, 24, 0)');
  shade.addColorStop(1, 'rgba(12, 4, 24, 0.34)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(16, 6, 26, 0.85)';
  ctx.lineWidth = Math.max(1, Math.round(Math.min(w, h) * 0.006));
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}

/** Draws the whole cover for `state` onto `ctx` at w x h. */
export function renderCover(ctx, w, h, state) {
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.grid4;
  const grade = gradeById(state.grade);
  const band = bandHeight(state, h);
  const rects = panelRects(layout, w, h, Math.round(Math.min(w, h) * 0.012) + GUTTER / 4, band);

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = grade.base;
  ctx.fillRect(0, 0, w, h);

  const photos = state.panels ?? [];
  rects.forEach((rect, i) => {
    const slot = photos[i % Math.max(1, photos.length)] ?? null;
    const tone = grade.panelTone(i, rects.length);
    drawPanelPhoto(ctx, slot?.img ?? null, rect, slot?.view ?? null, tone);
    if (state.frame && state.frame !== 'none') drawFrame(ctx, rect, state.frame, grade);
  });

  if (state.pattern && state.pattern !== 'none') drawBandPattern(ctx, w, h, band, grade, state.pattern);

  paintAtmosphere(ctx, w, h, grade, {
    bandTop: h - band,
    sun: state.glow / 100,
    palms: state.palms,
  });

  drawLettering(ctx, w, h, {
    title: state.title,
    subtitle: state.subtitle,
    kicker: state.kicker,
    style: state.lettering,
    ink: state.ink,
    scale: state.titleScale / 100,
    band,
  });

  if (state.badge) drawBadge(ctx, w, h, band, grade, state.badgeStyle ?? 'classic');
  if (state.grain > 0) drawGrain(ctx, w, h, state.grain / 100);
  drawEdge(ctx, w, h);
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Film grain, tiled and blended soft-light so it reads as texture, not noise. */
function drawGrain(ctx, w, h, amount) {
  const tile = grainCanvas();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.22 * amount;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.12 * amount;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** A hairline frame and a soft inner shadow, so the cover reads as a printed object. */
function drawEdge(ctx, w, h) {
  const pad = Math.round(Math.min(w, h) * 0.012);
  ctx.save();
  const vig = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.24, w / 2, h * 0.5, Math.max(w, h) * 0.78);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(8, 2, 16, 0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255, 236, 220, 0.14)';
  ctx.lineWidth = 1;
  ctx.strokeRect(pad + 0.5, pad + 0.5, w - pad * 2 - 1, h - pad * 2 - 1);
  ctx.restore();
}
