// Small poster marks, drawn above the lettering band at the right edge of a cover.

export const BADGES = {
  classic: { id: 'classic', name: 'Classic' },
  ribbon: { id: 'ribbon', name: 'Ribbon' }
};

const FONT = '"Bebas Neue", "Arial Narrow", sans-serif';
const TILT = (-8 * Math.PI) / 180;
const SHEAR = 0.14; // tan(8deg): the slanted cut ends of the ribbon

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
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

function ribbonPath(ctx, width, height) {
  const skew = SHEAR * height;
  ctx.beginPath();
  ctx.moveTo(-width / 2 + skew / 2, -height / 2);
  ctx.lineTo(width / 2 + skew / 2, -height / 2);
  ctx.lineTo(width / 2 - skew / 2, height / 2);
  ctx.lineTo(-width / 2 - skew / 2, height / 2);
  ctx.closePath();
}

// Badge height is about 5% of the cover's short side, tucked just above the band.
function placement(w, h, band) {
  const short = Math.min(w, h);
  const size = Math.max(18, Math.round(short * 0.05));
  const pad = Math.max(4, Math.round(short * 0.018));
  const gap = Math.max(2, Math.round(short * 0.012));
  const bottom = Math.max(size + pad, band > 0 ? h - band - gap : h - pad);
  return { size, pad, bottom };
}

function drawClassic(ctx, w, h, band, color) {
  const { size, pad, bottom } = placement(w, h, band);
  const title = 'ORIGINAL';
  const detail = 'YOUR PHOTO, YOUR WORDS';
  const titlePx = Math.max(10, Math.round(size * 0.52));
  const detailPx = Math.max(6, Math.round(size * 0.2));
  const inset = Math.max(5, Math.round(size * 0.24));

  ctx.font = `700 ${titlePx}px ${FONT}`;
  const titleWidth = ctx.measureText(title).width;
  ctx.font = `600 ${detailPx}px ${FONT}`;
  const detailWidth = ctx.measureText(detail).width;

  const plateW = Math.max(24, Math.min(w - pad * 2, Math.max(titleWidth, detailWidth) + inset * 2));
  const plateH = size;
  const x = w - pad - plateW;
  const y = bottom - plateH;

  ctx.fillStyle = color.dark;
  roundedRect(ctx, x, y, plateW, plateH, Math.max(3, Math.round(plateH * 0.18)));
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = color.accent;
  ctx.lineWidth = Math.max(1, size * 0.03);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color.accent;
  ctx.font = `700 ${titlePx}px ${FONT}`;
  ctx.fillText(title, x + plateW / 2, y + plateH * 0.6);
  ctx.fillStyle = color.ink;
  ctx.font = `600 ${detailPx}px ${FONT}`;
  ctx.fillText(detail, x + plateW / 2, y + plateH * 0.86);
}

function drawRibbon(ctx, w, h, band, color) {
  const { size, pad, bottom } = placement(w, h, band);
  const ribbonH = Math.max(12, Math.round(size * 0.64));
  const textPx = Math.max(10, Math.round(ribbonH * 0.82));
  const over = Math.max(2, Math.round(ribbonH * 0.12));

  ctx.font = `700 ${textPx}px ${FONT}`;
  const textWidth = ctx.measureText('ORIGINAL').width;
  const ribbonW = Math.max(24, Math.min(w - pad * 2 - over * 2, Math.max(textWidth + ribbonH, ribbonH * 2.6)));

  const cos = Math.abs(Math.cos(TILT));
  const sin = Math.abs(Math.sin(TILT));
  const outerW = ribbonW + SHEAR * ribbonH + over * 2;
  const outerH = ribbonH + over * 2;
  const boundW = outerW * cos + outerH * sin;
  const boundH = outerW * sin + outerH * cos;
  const cx = w - pad - boundW / 2;
  const cy = Math.max(pad + boundH / 2, bottom - boundH / 2);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(TILT);

  ctx.fillStyle = color.dark;
  ribbonPath(ctx, ribbonW + over * 2, ribbonH + over * 2);
  ctx.fill();

  ctx.fillStyle = color.accent;
  ribbonPath(ctx, ribbonW, ribbonH);
  ctx.fill();

  ctx.fillStyle = color.dark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${textPx}px ${FONT}`;
  ctx.fillText('ORIGINAL', 0, 0);
  ctx.restore();
}

export function drawBadge(ctx, w, h, band, grade, styleId) {
  if (!ctx || !(w > 0) || !(h > 0)) return;
  if (!Object.prototype.hasOwnProperty.call(BADGES, styleId)) return;

  const color = {
    accent: (grade && grade.accent) || '#ff2e88',
    ink: (grade && grade.ink) || '#fff4e8',
    dark: (grade && grade.dark) || '#080318'
  };
  const bandH = Math.max(0, Number(band) || 0);

  ctx.save();
  if (styleId === 'classic') drawClassic(ctx, w, h, bandH, color);
  else if (styleId === 'ribbon') drawRibbon(ctx, w, h, bandH, color);
  ctx.restore();
}
