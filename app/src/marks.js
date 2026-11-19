// Poster badge marks. CONTRACT (do not change signatures):
//   BADGES: object of style id -> { id, name }
//   drawBadge(ctx, w, h, band, grade, styleId): paints a small corner badge above the
//   lettering band at the right edge, in the grade's accent color. Nothing for 'none'/unknown.
// These are original editorial marks: an edition plate, a folded banner and a round seal.

export const BADGES = {
  none: { id: 'none', name: 'None' },
  classic: { id: 'classic', name: 'Edition plate' },
  ribbon: { id: 'ribbon', name: 'Folded ribbon' },
  stamp: { id: 'stamp', name: 'Round seal' },
};

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function accentA(hex, alpha) {
  const h = String(hex ?? '#ff2e88').replace('#', '');
  if (h.length !== 6) return `rgba(255, 46, 136, ${alpha})`;
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function rounded(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Centered label; save/restore keeps letterSpacing from leaking into the title. */
function label(ctx, text, x, y, size, color, spacing) {
  ctx.save();
  ctx.font = `${Math.max(8, Math.round(size))}px "Bebas Neue", "Arial Narrow", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${spacing}px`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawBadge(ctx, w, h, band, grade, styleId) {
  if (!ctx || !w || !h || !grade || !styleId) return;
  if (styleId === 'none' || !BADGES[styleId]) return;
  const s = Math.min(w, h);
  const bh = Math.max(22, s * 0.052);
  const bw = styleId === 'classic' ? s * 0.19 : styleId === 'ribbon' ? s * 0.25 : bh;
  const cx = w - Math.max(14, s * 0.042) - bw / 2;
  const bottom = h - band - s * 0.026;
  const cy = clamp(bottom - bh / 2, s * 0.09, h - s * 0.02 - bh / 2);
  ctx.save();
  if (styleId === 'classic') drawPlate(ctx, cx, cy, bw, bh, grade);
  else if (styleId === 'ribbon') drawRibbon(ctx, cx, cy, bw, bh, grade);
  else if (styleId === 'stamp') drawSeal(ctx, cx, cy, bh, grade);
  ctx.restore();
}

/** Two stacked words on a dark rounded card with a hairline inner border. */
function drawPlate(ctx, cx, cy, w, h, grade) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  rounded(ctx, x, y, w, h, h * 0.16);
  ctx.fillStyle = 'rgba(10, 4, 20, 0.88)';
  ctx.fill();
  ctx.lineWidth = Math.max(1, h * 0.035);
  ctx.strokeStyle = accentA(grade.accent, 0.94);
  ctx.stroke();
  const inset = h * 0.13;
  rounded(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, h * 0.08);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 244, 234, 0.4)';
  ctx.stroke();
  ctx.fillStyle = accentA(grade.accent, 0.65);
  ctx.fillRect(cx - w * 0.24, cy + h * 0.06, w * 0.48, Math.max(1, h * 0.03));
  label(ctx, 'SUNSET', cx, y + h * 0.36, h * 0.32, '#fff6e9', h * 0.06);
  label(ctx, 'EDITION', cx, y + h * 0.73, h * 0.24, grade.accent, h * 0.05);
}

/** A tilted banner with a notched tail and folded ends, like a screen-printed ribbon. */
function drawRibbon(ctx, cx, cy, w, h, grade) {
  const notch = h * 0.42;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.09);
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2 - notch, -h / 2);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(w / 2 - notch, h / 2);
  ctx.lineTo(-w / 2, h / 2);
  ctx.lineTo(-w / 2 + notch * 0.55, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(12, 5, 24, 0.9)';
  ctx.fill();
  ctx.lineWidth = Math.max(1, h * 0.03);
  ctx.strokeStyle = accentA(grade.accent, 0.95);
  ctx.stroke();
  ctx.fillStyle = accentA(grade.accent, 0.55);
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.lineTo(-w / 2 + notch * 0.55, 0);
  ctx.lineTo(-w / 2 + notch * 0.55, h / 2);
  ctx.closePath();
  ctx.fill();
  label(ctx, 'NIGHT SHIFT', -notch * 0.35 - w * 0.02, -h * 0.13, h * 0.3, '#fff4e8', h * 0.045);
  label(ctx, 'VOL. 01', -notch * 0.35 + w * 0.03, h * 0.24, h * 0.21, grade.accent, h * 0.05);
  ctx.restore();
}

/** A compact round seal with a double ring and a number in the middle. */
function drawSeal(ctx, cx, cy, d, grade) {
  const r = d / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10, 4, 20, 0.88)';
  ctx.fill();
  ctx.lineWidth = Math.max(1, d * 0.045);
  ctx.strokeStyle = accentA(grade.accent, 0.92);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.79, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 244, 234, 0.5)';
  ctx.stroke();
  ctx.fillStyle = accentA(grade.accent, 0.8);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.89, cy + Math.sin(a) * r * 0.89, Math.max(1, d * 0.025), 0, Math.PI * 2);
    ctx.fill();
  }
  label(ctx, '01', cx, cy - d * 0.09, d * 0.38, '#fff6e9', 0);
  label(ctx, 'VOL', cx, cy + d * 0.26, d * 0.19, grade.accent, d * 0.03);
}
