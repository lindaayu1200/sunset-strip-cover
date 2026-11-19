// Decorative frames painted strictly inside a supplied rectangle.
// Self-contained: no imports, no network, no dependencies.

export const FRAMES = {
  none: { id: 'none', name: 'None' },
  neon: { id: 'neon', name: 'Neon' },
  tape: { id: 'tape', name: 'Tape' },
  double: { id: 'double', name: 'Double' },
  sticker: { id: 'sticker', name: 'Sticker' }
};

function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawNeon(ctx, x, y, w, h, accent) {
  const inset = Math.max(4, Math.min(10, Math.min(w, h) * 0.04));
  const bx = x + inset;
  const by = y + inset;
  const bw = w - inset * 2;
  const bh = h - inset * 2;
  if (bw <= 0 || bh <= 0) return;

  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.004);
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.shadowBlur = 6;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.9;
  ctx.strokeRect(bx, by, bw, bh);

  const tick = Math.min(28, Math.min(w, h) * 0.12);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx, by + tick);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx + tick, by);
  ctx.moveTo(bx + bw - tick, by + bh);
  ctx.lineTo(bx + bw, by + bh);
  ctx.lineTo(bx + bw, by + bh - tick);
  ctx.stroke();
  ctx.restore();
}

function drawTape(ctx, x, y, w, h) {
  const tapeWidth = Math.min(w * 0.34, 180);
  const tapeHeight = Math.max(10, Math.min(h * 0.09, 30));
  if (tapeWidth <= 0 || tapeHeight <= 0) return;
  const inset = Math.min(w * 0.16, tapeWidth * 0.6);

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#ffffff';

  ctx.save();
  ctx.translate(x + inset, y + tapeHeight * 0.55);
  ctx.rotate(-Math.PI / 6);
  ctx.fillRect(-tapeWidth / 2, -tapeHeight / 2, tapeWidth, tapeHeight);
  ctx.restore();

  ctx.save();
  ctx.translate(x + w - inset, y + h - tapeHeight * 0.55);
  ctx.rotate(Math.PI / 6);
  ctx.fillRect(-tapeWidth / 2, -tapeHeight / 2, tapeWidth, tapeHeight);
  ctx.restore();

  ctx.restore();
}

function drawDouble(ctx, x, y, w, h, ink) {
  const firstInset = 8;
  const gap = 6;
  if (w <= 2 * (firstInset + gap) + 4 || h <= 2 * (firstInset + gap) + 4) return;
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.38;
  ctx.strokeRect(x + firstInset + 0.5, y + firstInset + 0.5,
    w - 2 * firstInset - 1, h - 2 * firstInset - 1);
  ctx.globalAlpha = 0.26;
  ctx.strokeRect(x + firstInset + gap + 0.5, y + firstInset + gap + 0.5,
    w - 2 * (firstInset + gap) - 1, h - 2 * (firstInset + gap) - 1);
  ctx.restore();
}

function drawSticker(ctx, x, y, w, h, accent, ink) {
  const pad = Math.max(6, Math.min(14, Math.min(w, h) * 0.03));
  const plateWidth = Math.min(w * 0.3, 160);
  const plateHeight = Math.max(20, Math.min(h * 0.14, 44));
  if (plateWidth <= 10 || plateHeight <= 10) return;
  const plateX = x + pad;
  const plateY = y + pad;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  roundRectPath(ctx, plateX, plateY, plateWidth, plateHeight, Math.min(8, plateHeight / 3));
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = accent;
  roundRectPath(ctx, plateX + 5, plateY + 5,
    Math.max(8, plateWidth * 0.2), plateHeight - 10, 3);
  ctx.fill();

  let barcodeX = plateX + plateWidth + Math.max(6, pad);
  let barcodeY = plateY + plateHeight * 0.18;
  if (x + w - barcodeX - pad < 24) {
    barcodeX = plateX;
    barcodeY = plateY + plateHeight + Math.max(4, pad * 0.5);
  }
  const barcodeHeight = plateHeight * 0.64;
  const bars = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3];
  const gap = 2;
  const total = bars.reduce((sum, bar) => sum + bar, 0) + gap * (bars.length - 1);
  const available = Math.max(1, x + w - barcodeX - pad);
  const factor = total > available ? available / total : 1;

  ctx.globalAlpha = 0.8;
  ctx.fillStyle = ink;
  let cursor = barcodeX;
  for (let i = 0; i < bars.length; i += 1) {
    const barWidth = Math.max(1, bars[i] * factor);
    ctx.fillRect(cursor, barcodeY, barWidth, barcodeHeight);
    cursor += barWidth + Math.max(1, gap * factor);
  }
  ctx.restore();
}

export function drawFrame(ctx, rect, styleId, grade) {
  if (!ctx || !rect) return;
  const x = Number(rect.x) || 0;
  const y = Number(rect.y) || 0;
  const w = Number(rect.w) || 0;
  const h = Number(rect.h) || 0;
  if (!(w > 0) || !(h > 0)) return;

  const id = styleId && FRAMES[styleId] ? styleId : 'none';
  if (id === 'none') return;

  const palette = grade || {};
  const accent = palette.accent || '#5ce1ff';
  const ink = palette.ink || 'rgba(12, 14, 26, 0.85)';

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  if (id === 'neon') {
    drawNeon(ctx, x, y, w, h, accent);
  } else if (id === 'tape') {
    drawTape(ctx, x, y, w, h);
  } else if (id === 'double') {
    drawDouble(ctx, x, y, w, h, ink);
  } else if (id === 'sticker') {
    drawSticker(ctx, x, y, w, h, accent, ink);
  }

  ctx.restore();
}
