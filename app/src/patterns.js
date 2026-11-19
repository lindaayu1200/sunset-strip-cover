// Subtle textures painted behind the caption band lettering.
// Self-contained: no imports, no network, no dependencies.

export const PATTERNS = {
  none: { id: 'none', name: 'None' },
  rays: { id: 'rays', name: 'Rays' },
  dots: { id: 'dots', name: 'Dots' },
  grid: { id: 'grid', name: 'Grid' }
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function drawRays(ctx, w, h, band, accent) {
  const originX = w / 2;
  const originY = h + band * 0.85;
  const radius = Math.max(w, band) * 2.4 + h;
  const count = 30;
  const start = -Math.PI * 0.92;
  const end = -Math.PI * 0.08;
  const step = (end - start) / count;

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = accent;
  for (let i = 0; i < count; i += 1) {
    const angle = start + step * (i + 0.5);
    const half = step * (i % 2 === 0 ? 0.34 : 0.22);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + Math.cos(angle - half) * radius, originY + Math.sin(angle - half) * radius);
    ctx.lineTo(originX + Math.cos(angle + half) * radius, originY + Math.sin(angle + half) * radius);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawDots(ctx, w, bandTop, band, ink) {
  const spacing = 16;
  const maxRadius = spacing * 0.46;
  ctx.save();
  ctx.fillStyle = ink;
  for (let row = 0, y = bandTop + spacing * 0.5; y < bandTop + band + spacing; row += 1, y += spacing) {
    const t = clamp((y - bandTop) / band, 0, 1);
    const radius = maxRadius * (0.12 + 0.88 * t);
    if (radius < 0.4) continue;
    ctx.globalAlpha = 0.14 * (0.18 + 0.82 * t);
    const offset = row % 2 === 0 ? 0 : spacing / 2;
    for (let x = offset; x < w + spacing; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGrid(ctx, w, bandTop, band, ink) {
  const spacing = 28;
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = spacing; x < w; x += spacing) {
    ctx.moveTo(x + 0.5, bandTop);
    ctx.lineTo(x + 0.5, bandTop + band);
  }
  for (let y = bandTop + spacing; y < bandTop + band; y += spacing) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawBandPattern(ctx, w, h, band, grade, kind) {
  if (!ctx || !(w > 0) || !(h > 0) || !(band > 0)) return;
  if (!kind || !PATTERNS[kind] || kind === 'none') return;

  const bandTop = h - band;
  const palette = grade || {};
  const accent = palette.accent || '#ff9b54';
  const ink = palette.ink || '#0b0b14';

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, bandTop, w, band);
  ctx.clip();

  if (kind === 'rays') {
    drawRays(ctx, w, h, band, accent);
  } else if (kind === 'dots') {
    drawDots(ctx, w, bandTop, band, ink);
  } else if (kind === 'grid') {
    drawGrid(ctx, w, bandTop, band, ink);
  }

  ctx.restore();
}
