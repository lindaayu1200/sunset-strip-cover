// Decorative panel frames. CONTRACT (do not change signatures):
//   FRAMES: object of style id -> { id, name }
//   drawFrame(ctx, rect, styleId, grade): paints a decorative frame INSIDE rect (does not clip outside).
// rect: {x, y, w, h}; grade has .accent. Draw nothing for unknown or 'none'.

export const FRAMES = {
  none: { id: 'none', name: 'None' },
  neon: { id: 'neon', name: 'Neon edge' },
  tape: { id: 'tape', name: 'Masking tape' },
  double: { id: 'double', name: 'Double hairline' },
  sticker: { id: 'sticker', name: 'Sticker plate' },
};

/** The panel palette starts with the grade accent, so a frame always suits the sunset. */
function accentA(hex, alpha) {
  const h = String(hex ?? '#ff2e88').replace('#', '');
  const n = h.length === 6 ? parseInt(h, 16) : 0xff2e88;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Every style draws inside a clipped copy of the panel, so no ink leaks into the gutter. */
function clipPanel(ctx, r) {
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
}

const padding = (r) => Math.max(3, Math.min(r.w, r.h) * 0.018);

/** A rounded path built from arcTo, for the plate sticker and its barcode label. */
function rounded(ctx, x, y, w, h, radius) {
  const rad = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function drawFrame(ctx, rect, styleId, grade) {
  if (!ctx || !rect || rect.w <= 0 || rect.h <= 0 || !grade) return;
  if (styleId === 'none' || !Object.prototype.hasOwnProperty.call(FRAMES, styleId)) return;
  ctx.save();
  clipPanel(ctx, rect);
  if (styleId === 'neon') drawNeon(ctx, rect, grade);
  else if (styleId === 'tape') drawTape(ctx, rect, grade);
  else if (styleId === 'double') drawDouble(ctx, rect, grade);
  else if (styleId === 'sticker') drawSticker(ctx, rect, grade);
  ctx.restore();
}

/** A glowing inset hairline with four bright L-shaped corner ticks. */
function drawNeon(ctx, r, grade) {
  const s = Math.min(r.w, r.h);
  const p = padding(r);
  const x = r.x + p, y = r.y + p, w = r.w - p * 2, h = r.h - p * 2;
  ctx.save();
  ctx.lineWidth = Math.max(1, s * 0.0028);
  ctx.strokeStyle = accentA(grade.accent, 0.92);
  ctx.shadowColor = grade.accent;
  ctx.shadowBlur = s * 0.024;
  ctx.strokeRect(x, y, w, h);
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(1, s * 0.0011);
  ctx.strokeStyle = 'rgba(255, 246, 238, 0.6)';
  const inner = s * 0.005;
  ctx.strokeRect(x + inner, y + inner, w - inner * 2, h - inner * 2);
  const tick = Math.max(10, s * 0.04);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.lineWidth = Math.max(1, s * 0.0034);
  const corners = [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath(); ctx.moveTo(cx + dx * tick, cy);
    ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * tick);
    ctx.stroke();
  }
  ctx.restore();
}

/** Two torn strips of translucent masking tape crossing opposite corners. */
function drawTape(ctx, r, grade) {
  const s = Math.min(r.w, r.h);
  const len = s * 0.5;
  const thick = Math.max(7, s * 0.062);
  const strips = [
    { x: r.x + len * 0.17, y: r.y + len * 0.17 },
    { x: r.x + r.w - len * 0.17, y: r.y + r.h - len * 0.17 },
  ];
  for (const spot of strips) {
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = 'rgba(248, 226, 194, 0.68)';
    ctx.fillRect(-len / 2, -thick / 2, len, thick);
    ctx.fillStyle = accentA(grade.accent, 0.18);
    ctx.fillRect(-len / 2, -thick / 2, len, thick * 0.14);
    ctx.fillRect(-len / 2, thick * 0.36, len, thick * 0.14);
    ctx.fillStyle = 'rgba(96, 52, 36, 0.22)';
    for (let i = -len / 2 + thick * 0.5; i < len / 2; i += thick * 1.1) {
      ctx.fillRect(i, -thick / 2, Math.max(1, thick * 0.04), thick);
    }
    ctx.strokeStyle = 'rgba(108, 62, 42, 0.3)'; ctx.lineWidth = 1;
    ctx.strokeRect(-len / 2 + 0.5, -thick / 2 + 0.5, len - 1, thick - 1);
    ctx.restore();
  }
}

/** Two fine borders, offset diagonally, with registration marks bridging the gap. */
function drawDouble(ctx, r, grade) {
  const s = Math.min(r.w, r.h);
  const p = padding(r) * 0.7, off = Math.max(3, s * 0.012), t = Math.max(1, s * 0.002);
  const x = r.x + p, y = r.y + p, w = r.w - p * 2, h = r.h - p * 2;
  ctx.save();
  ctx.lineWidth = Math.max(1, s * 0.0013);
  ctx.strokeStyle = 'rgba(255, 242, 228, 0.6)';
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = accentA(grade.accent, 0.82);
  ctx.strokeRect(x + off, y + off, w - off * 2, h - off * 2);
  ctx.fillStyle = accentA(grade.accent, 0.9);
  const marks = [
    [x + off / 2, y, off, t], [x + off / 2, y + h, off, t],
    [x, y + off / 2, t, off], [x + w, y + off / 2, t, off],
  ];
  for (const [mx, my, mw, mh] of marks) ctx.fillRect(mx - mw / 2, my - mh / 2, mw, mh);
  ctx.restore();
}

/** A pale rounded sticker in one corner: a barcode and a short accent label. */
function drawSticker(ctx, r, grade) {
  const s = Math.min(r.w, r.h);
  const p = padding(r);
  ctx.save();
  ctx.lineWidth = Math.max(1, s * 0.0016);
  ctx.strokeStyle = accentA(grade.accent, 0.44);
  rounded(ctx, r.x + p, r.y + p, r.w - p * 2, r.h - p * 2, s * 0.018);
  ctx.stroke();
  const pw = Math.min(r.w * 0.34, s * 0.44), ph = pw * 0.42;
  const px = r.x + p + s * 0.018, py = r.y + p + s * 0.018;
  rounded(ctx, px, py, pw, ph, ph * 0.14);
  ctx.fillStyle = 'rgba(252, 244, 234, 0.9)'; ctx.fill();
  ctx.lineWidth = Math.max(1, s * 0.002);
  ctx.strokeStyle = accentA(grade.accent, 0.9);
  ctx.stroke();
  // Seed the barcode from the panel's position so repeated stickers read as separate prints
  // instead of a copy-pasted stamp; the same panel still renders identically every time.
  const seed = Math.round(r.x * 0.013 + r.y * 0.021);
  const bx = px + pw * 0.08, bw = pw * 0.84;
  const by = py + ph * 0.32, bh = ph * 0.5;
  const bars = 11 + (Math.abs(seed) % 4);
  for (let i = 0; i < bars; i++) {
    const wide = (i * 7 + 3 + seed) % 5 === 0;
    const barW = (bw / (bars * 1.9)) * (wide ? 1.55 : 0.78);
    ctx.fillStyle = (i + seed) % 3 === 0 ? accentA(grade.accent, 0.95) : 'rgba(38, 18, 34, 0.88)';
    ctx.fillRect(bx + (i / bars) * bw, by, Math.max(1, barW), bh);
  }
  ctx.fillStyle = accentA(grade.accent, 0.85);
  ctx.fillRect(px + pw * 0.08, py + ph * 0.14, pw * (0.36 + 0.1 * (Math.abs(seed) % 3)), ph * 0.07);
  ctx.restore();
}
