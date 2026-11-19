// Lettering primitives for the bottom caption band.
// Self-contained: no imports, no network, no dependencies.

export const INKS = {
  white: { id: 'white', name: 'White', color: '#ffffff' },
  gold: { id: 'gold', name: 'Gold', color: '#f6c453' },
  pink: { id: 'pink', name: 'Pink', color: '#ff77b0' },
  mint: { id: 'mint', name: 'Mint', color: '#79f0c4' }
};

const STYLES = new Set(['slab', 'chrome', 'neon', 'stencil']);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseColor(value) {
  const str = String(value == null ? '' : value).trim();
  let match = /^#([0-9a-f]{3})$/i.exec(str);
  if (match) {
    const hex = match[1];
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16)
    ];
  }
  match = /^#([0-9a-f]{6})$/i.exec(str);
  if (match) {
    return [
      parseInt(match[1].slice(0, 2), 16),
      parseInt(match[1].slice(2, 4), 16),
      parseInt(match[1].slice(4, 6), 16)
    ];
  }
  match = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(str);
  if (match) {
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  return null;
}

function shade(value, amount) {
  const rgb = parseColor(value);
  if (!rgb) return amount >= 0 ? '#ffffff' : '#000000';
  const target = amount >= 0 ? 255 : 0;
  const t = clamp(Math.abs(amount), 0, 1);
  const mix = (channel) => Math.round(channel + (target - channel) * t);
  return `rgb(${mix(rgb[0])}, ${mix(rgb[1])}, ${mix(rgb[2])})`;
}

function makeScratch(width, height) {
  const cw = Math.max(1, Math.ceil(width));
  const ch = Math.max(1, Math.ceil(height));
  if (typeof document !== 'undefined' && document.createElement) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      return canvas;
    } catch (err) {
      // fall through to OffscreenCanvas
    }
  }
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      return new OffscreenCanvas(cw, ch);
    } catch (err) {
      return null;
    }
  }
  return null;
}

function drawSpacedText(ctx, text, centerX, y, spacing) {
  const chars = Array.from(text);
  if (!chars.length) return 0;
  const previousAlign = ctx.textAlign;
  const widths = chars.map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + spacing * (chars.length - 1);
  let x = centerX - total / 2;
  ctx.textAlign = 'left';
  for (let i = 0; i < chars.length; i += 1) {
    ctx.fillText(chars[i], x, y);
    x += widths[i] + spacing;
  }
  ctx.textAlign = previousAlign;
  return total;
}

function punchStencilGaps(target, centerY, size, width, height, topLimit) {
  const gapHeight = Math.max(1.5, size * 0.022);
  const stepY = Math.max(6, size * 0.13);
  const top = centerY - size * 0.82;
  const bottom = centerY + size * 0.06;
  target.save();
  target.globalCompositeOperation = 'destination-out';
  target.fillStyle = '#000000';
  for (let gy = top; gy < bottom; gy += stepY) {
    const clippedY = Math.max(topLimit, gy);
    if (clippedY < height) {
      target.fillRect(0, clippedY, width, gapHeight);
    }
  }
  target.restore();
}

export function drawLettering(ctx, w, h, band, grade, opts) {
  if (!ctx || !(w > 0) || !(h > 0) || !(band > 0)) return;

  const options = opts || {};
  const palette = grade || {};
  const bandTop = h - band;
  const centerX = w / 2;
  const scale = clamp(Number(options.sizeScale) || 1, 0.5, 1.5);
  const ink = (INKS[options.ink] || INKS.white).color;
  const accent = palette.accent || '#ff8a4c';
  const outline = palette.ink || 'rgba(0, 0, 0, 0.72)';
  const style = STYLES.has(options.style) ? options.style : 'slab';

  const title = String(options.title == null ? '' : options.title).toUpperCase();
  const kicker = String(options.kicker == null ? '' : options.kicker).toUpperCase();
  const subtitle = String(options.subtitle == null ? '' : options.subtitle);

  const kickerSize = clamp(band * 0.12, 9, 20);
  const subSize = clamp(band * 0.1, 8, 16);
  const maxTitleWidth = Math.max(1, w - 2 * (w * 0.06));
  const titleFont = (size) => `700 ${size}px Anton, sans-serif`;

  let titleSize = Math.min(96 * scale, band * 0.54);
  ctx.font = titleFont(titleSize);
  let measured = ctx.measureText(title).width;
  for (let pass = 0; pass < 12 && measured > maxTitleWidth && titleSize > 8; pass += 1) {
    titleSize = Math.max(8, titleSize * (maxTitleWidth / measured) * 0.99);
    ctx.font = titleFont(titleSize);
    measured = ctx.measureText(title).width;
  }

  const kickerY = bandTop + band * 0.17;
  const titleY = bandTop + band * 0.64;
  const subtitleY = bandTop + band * 0.88;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, bandTop, w, band);
  ctx.clip();

  if (kicker) {
    ctx.save();
    ctx.font = `700 ${kickerSize}px 'Bebas Neue', sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.95;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 4;
    drawSpacedText(ctx, kicker, centerX, kickerY, Math.max(2, kickerSize * 0.3));
    ctx.restore();
  }

  if (title) {
    ctx.save();
    ctx.font = titleFont(titleSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    if (style === 'slab') {
      ctx.save();
      ctx.translate(centerX, 0);
      ctx.transform(1, 0, -0.11, 1, 0, 0);
      ctx.translate(-centerX, 0);
      ctx.fillStyle = ink;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = Math.max(3, titleSize * 0.07);
      ctx.shadowOffsetY = Math.max(1, titleSize * 0.035);
      ctx.fillText(title, centerX, titleY);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.lineWidth = Math.max(1, titleSize * 0.022);
      ctx.strokeStyle = outline;
      ctx.strokeText(title, centerX, titleY);
      ctx.restore();
    } else if (style === 'chrome') {
      const gradient = ctx.createLinearGradient(0, titleY - titleSize * 0.85, 0, titleY + titleSize * 0.08);
      gradient.addColorStop(0, shade(ink, 0.72));
      gradient.addColorStop(0.38, ink);
      gradient.addColorStop(0.5, shade(ink, -0.32));
      gradient.addColorStop(1, shade(ink, -0.72));
      ctx.fillStyle = gradient;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = Math.max(4, titleSize * 0.09);
      ctx.shadowOffsetY = 2;
      ctx.fillText(title, centerX, titleY);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, titleY - titleSize * 0.88, w, titleSize * 0.45);
      ctx.clip();
      ctx.lineWidth = Math.max(1, titleSize * 0.018);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeText(title, centerX, titleY - titleSize * 0.012);
      ctx.restore();
    } else if (style === 'neon') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = Math.max(8, titleSize * 0.42);
      ctx.globalAlpha = 0.55;
      ctx.fillText(title, centerX, titleY);
      ctx.shadowBlur = Math.max(4, titleSize * 0.18);
      ctx.globalAlpha = 0.85;
      ctx.fillText(title, centerX, titleY);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = ink === accent ? accent : shade(accent, 0.45);
      ctx.shadowColor = accent;
      ctx.shadowBlur = Math.max(2, titleSize * 0.05);
      ctx.fillText(title, centerX, titleY);
      ctx.restore();
    } else {
      const scratch = makeScratch(w, band);
      const sctx = scratch && scratch.getContext ? scratch.getContext('2d') : null;
      if (sctx) {
        sctx.clearRect(0, 0, w, band);
        sctx.font = titleFont(titleSize);
        sctx.textAlign = 'center';
        sctx.textBaseline = 'alphabetic';
        sctx.fillStyle = ink;
        sctx.fillText(title, centerX, titleY - bandTop);
        punchStencilGaps(sctx, titleY - bandTop, titleSize, w, band, 0);
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = Math.max(3, titleSize * 0.06);
        ctx.shadowOffsetY = 2;
        ctx.drawImage(scratch, 0, bandTop);
        ctx.restore();
      } else {
        ctx.fillStyle = ink;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = Math.max(3, titleSize * 0.06);
        ctx.fillText(title, centerX, titleY);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        punchStencilGaps(ctx, titleY, titleSize, w, h, bandTop);
      }
    }
    ctx.restore();
  }

  if (subtitle) {
    ctx.save();
    ctx.font = `700 ${subSize}px 'Bebas Neue', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = shade(ink, 0.08);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 3;
    ctx.fillText(subtitle, centerX, subtitleY);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    const textWidth = ctx.measureText(subtitle).width;
    const half = Math.min(w * 0.42, textWidth / 2 + subSize * 0.9);
    const underlineY = Math.min(h - 2, subtitleY + subSize * 0.42);
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - half, underlineY);
    ctx.lineTo(centerX + half, underlineY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - half, underlineY - 2);
    ctx.lineTo(centerX - half, underlineY + 2);
    ctx.moveTo(centerX + half, underlineY - 2);
    ctx.lineTo(centerX + half, underlineY + 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}
