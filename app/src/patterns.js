// Texture behind the lettering band. CONTRACT (do not change signatures):
//   PATTERNS: object of id -> { id, name } (at least none, rays, dots, grid)
//   drawBandPattern(ctx, w, h, band, grade, kind): paints texture across the band area
//   [h-band, h], subtle, behind the text. Nothing for 'none' or unknown.
// All three marks are quiet enough to sit behind the title: alpha stays below 0.18.

export const PATTERNS = {
  none: { id: 'none', name: 'Plain' },
  rays: { id: 'rays', name: 'Sunburst' },
  dots: { id: 'dots', name: 'Halftone' },
  grid: { id: 'grid', name: 'Night grid' },
};

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/** Accent with alpha; the fallback keeps the helper safe if a grade is missing its accent. */
function accentA(hex, alpha) {
  const h = String(hex ?? '#ff2e88').replace('#', '');
  if (h.length !== 6) return `rgba(255, 46, 136, ${alpha})`;
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function drawBandPattern(ctx, w, h, band, grade, kind) {
  if (!ctx || !w || !h || !band || band <= 0 || !grade) return;
  if (kind === 'none' || !Object.prototype.hasOwnProperty.call(PATTERNS, kind)) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, h - band, w, band);
  ctx.clip();
  if (kind === 'rays') drawRays(ctx, w, h, band, grade);
  else if (kind === 'dots') drawDots(ctx, w, h, band, grade);
  else if (kind === 'grid') drawGrid(ctx, w, h, band, grade);
  ctx.restore();
}

/** Wide wedges fan out from a point just below the band, like a printed sunburst. */
function drawRays(ctx, w, h, band, grade) {
  const top = h - band;
  const ox = w * 0.5;
  const oy = h + band * 0.22;
  const reach = Math.hypot(w, band * 1.7) * 1.5;
  const count = 26;
  for (let i = 0; i < count; i++) {
    const a0 = Math.PI * (1.03 + (0.94 * i) / count);
    const a1 = Math.PI * (1.03 + (0.94 * (i + 1)) / count);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(a0) * reach, oy + Math.sin(a0) * reach);
    ctx.lineTo(ox + Math.cos(a1) * reach, oy + Math.sin(a1) * reach);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0
      ? accentA(grade.accent, 0.075)
      : 'rgba(255, 228, 196, 0.038)';
    ctx.fill();
  }
  const bloom = ctx.createRadialGradient(ox, oy, 0, ox, oy, band * 0.95);
  bloom.addColorStop(0, accentA(grade.accent, 0.13));
  bloom.addColorStop(0.55, accentA(grade.accent, 0.05));
  bloom.addColorStop(1, accentA(grade.accent, 0));
  ctx.fillStyle = bloom;
  ctx.fillRect(0, top, w, band);
}

/** Halftone dots grow and brighten toward the foot of the cover. */
function drawDots(ctx, w, h, band, grade) {
  const top = h - band;
  const step = clamp(band * 0.105, 9, 26);
  const rows = Math.ceil(band / step) + 1;
  const cols = Math.ceil(w / step) + 1;
  for (let row = 0; row < rows; row++) {
    const y = top + row * step;
    const t = row / Math.max(1, rows - 1);
    const radius = step * (0.1 + 0.21 * t);
    ctx.fillStyle = accentA(grade.accent, 0.02 + 0.135 * t * t);
    const shift = (row % 2) * step * 0.5;
    for (let col = -1; col <= cols; col++) {
      ctx.beginPath();
      ctx.arc(col * step + shift, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A faint measurement grid: fine rules, brighter majors and small intersection nodes. */
function drawGrid(ctx, w, h, band, grade) {
  const top = h - band;
  const sx = clamp(band * 0.16, 14, 44);
  const sy = clamp(band * 0.14, 12, 36);
  const originX = w * 0.5;
  ctx.lineWidth = 1;
  for (let x = originX % sx; x <= w + sx; x += sx) {
    const index = Math.round((x - originX) / sx);
    const major = index % 4 === 0;
    ctx.strokeStyle = accentA(grade.accent, major ? 0.125 : 0.05);
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, top);
    ctx.lineTo(Math.round(x) + 0.5, h);
    ctx.stroke();
  }
  for (let y = h - sy; y >= top - sy; y -= sy) {
    const major = Math.round((h - y) / sy) % 4 === 0;
    ctx.strokeStyle = accentA(grade.accent, major ? 0.12 : 0.048);
    ctx.beginPath();
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(w, Math.round(y) + 0.5);
    ctx.stroke();
  }
  ctx.fillStyle = accentA(grade.accent, 0.15);
  for (let x = originX % (sx * 4); x <= w; x += sx * 4) {
    for (let y = h - sy * 4; y >= top; y -= sy * 4) {
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    }
  }
}
