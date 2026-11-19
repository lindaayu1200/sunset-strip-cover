// The lettering: a big stacked title in Anton, a subtitle strip and a kicker, drawn into the
// band at the foot of the cover. Four styles, four ink colors.
const INKS = {
  white: { fill: ['#ffffff', '#f2e2ea'], stroke: '#16040f', glow: 'rgba(255,255,255,0.0)' },
  gold: { fill: ['#ffe9a8', '#ffb057'], stroke: '#3a1404', glow: 'rgba(255,176,87,0.55)' },
  pink: { fill: ['#ffd1ec', '#ff2e88'], stroke: '#2a0418', glow: 'rgba(255,46,136,0.6)' },
  mint: { fill: ['#d9fff2', '#2de2c5'], stroke: '#04231c', glow: 'rgba(45,226,197,0.5)' },
};

export function drawLettering(ctx, w, h, spec) {
  const band = spec.band;
  if (!band) return;
  const title = String(spec.title ?? '').trim();
  const subtitle = String(spec.subtitle ?? '').trim().toUpperCase();
  const kicker = String(spec.kicker ?? '').trim().toUpperCase();
  const ink = INKS[spec.ink] ?? INKS.white;
  const base = band * 0.34 * (spec.scale ?? 1);

  // Scrim: a dark gradient so the letters always read.
  const scrim = ctx.createLinearGradient(0, h - band, 0, h);
  scrim.addColorStop(0, 'rgba(10, 3, 20, 0)');
  scrim.addColorStop(0.42, 'rgba(10, 3, 20, 0.55)');
  scrim.addColorStop(1, 'rgba(10, 3, 20, 0.9)');
  ctx.save();
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h - band, w, band);

  const margin = w * 0.055;

  // Stacked from the foot up: subtitle line, then the big title, then the kicker.
  const subtitleY = h - band * 0.13;
  const titleY = subtitleY - band * 0.16;
  const kickerY = h - band + band * 0.16;

  if (kicker) {
    const ks = Math.max(10, band * 0.082);
    ctx.font = `${Math.round(ks)}px "Bebas Neue", "Arial Narrow", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = ink.glow === 'rgba(255,255,255,0.0)' ? '#ffcf9a' : ink.fill[1];
    ctx.letterSpacing = `${ks * 0.42}px`;
    ctx.fillText(kicker, margin, kickerY);
    ctx.letterSpacing = '0px';
  }

  if (title) {
    const lines = wrapTitle(ctx, title.toUpperCase(), base, w - margin * 2, spec.style);
    for (let i = 0; i < lines.length; i++) {
      const ty = titleY - (lines.length - 1 - i) * base * 0.82;
      drawTitleLine(ctx, lines[i], margin, ty, base, spec.style, ink, w);
    }
  }

  if (subtitle) {
    const ss = Math.max(9, band * 0.072);
    ctx.font = `${Math.round(ss)}px "Bebas Neue", "Arial Narrow", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(247, 236, 240, 0.92)';
    ctx.letterSpacing = `${ss * 0.34}px`;
    ctx.fillText(subtitle, margin, subtitleY);
    ctx.letterSpacing = '0px';
    const tw = ctx.measureText(subtitle).width;
    ctx.strokeStyle = 'rgba(255, 190, 120, 0.85)';
    ctx.lineWidth = Math.max(1, ss * 0.09);
    ctx.beginPath();
    ctx.moveTo(margin, subtitleY + ss * 0.3);
    ctx.lineTo(margin + Math.min(tw + ss * 1.4, w - margin * 2), subtitleY + ss * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

/** Fits a title to the band: split on the last space that fits, then shrink to fit one line. */
function wrapTitle(ctx, text, size, maxW, style) {
  ctx.letterSpacing = `${size * 0.02}px`;
  let s = size;
  ctx.font = titleFont(s);
  while (ctx.measureText(text).width > maxW && s > size * 0.45) {
    s *= 0.94;
    ctx.font = titleFont(s);
  }
  if (ctx.measureText(text).width <= maxW) return [{ text, size: s }];
  const words = text.split(' ');
  let best = [text];
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    ctx.font = titleFont(size);
    if (ctx.measureText(a).width <= maxW && ctx.measureText(b).width <= maxW) best = [a, b];
  }
  let s2 = size;
  ctx.font = titleFont(s2);
  while (best.some((ln) => ctx.measureText(ln).width > maxW) && s2 > size * 0.4) {
    s2 *= 0.92;
    ctx.font = titleFont(s2);
  }
  return best.map((t) => ({ text: t, size: s2 }));
}

function titleFont(px) {
  return `${Math.round(px)}px "Anton", "Arial Narrow", sans-serif`;
}

function drawTitleLine(ctx, line, x, y, size, style, ink, w) {
  ctx.font = titleFont(line.size);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = `${line.size * 0.02}px`;
  const skew = style === 'stencil' || style === 'chrome' ? 0 : -0.02;

  ctx.save();
  if (skew !== 0) {
    ctx.translate(x + line.size * 0.02, y);
    ctx.transform(1, 0, skew, 1, 0, 0);
    ctx.translate(-x, -y);
  }

  if (style === 'chrome') {
    const g = ctx.createLinearGradient(0, y - line.size, 0, y + line.size * 0.06);
    g.addColorStop(0, '#fdfdff');
    g.addColorStop(0.45, ink.fill[0]);
    g.addColorStop(0.52, ink.fill[1]);
    g.addColorStop(1, '#f7ecf2');
    ctx.fillStyle = g;
  } else if (style === 'neon') {
    ctx.shadowColor = ink.glow;
    ctx.shadowBlur = line.size * 0.28;
    ctx.fillStyle = ink.fill[0];
  } else {
    ctx.fillStyle = ink.fill[0];
  }

  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, line.size * (style === 'stencil' ? 0.055 : 0.075));
  ctx.strokeStyle = ink.stroke;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = line.size * 0.1;
  ctx.shadowOffsetY = line.size * 0.03;
  ctx.strokeText(line.text, x, y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (style === 'neon') {
    ctx.shadowColor = ink.glow;
    ctx.shadowBlur = line.size * 0.24;
  }
  ctx.fillText(line.text, x, y);
  if (style === 'chrome') {
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(20, 4, 14, 0.65)';
    ctx.lineWidth = Math.max(1, line.size * 0.016);
    ctx.strokeText(line.text, x, y);
  }
  if (style === 'stencil') {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(x, y - line.size * 0.16, w, line.size * 0.045);
    ctx.fillRect(x, y - line.size * 0.02, w, line.size * 0.03);
    ctx.restore();
    ctx.fillStyle = ink.fill[0];
  }
  ctx.restore();
  ctx.letterSpacing = '0px';
}
