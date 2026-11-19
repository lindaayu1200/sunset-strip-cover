// Color grades: the Vice City look. Each grade paints an atmosphere over the composited
// panels and tints each panel.
export const GRADES = {
  vice: {
    id: 'vice',
    base: '#1c0b2e',
    accent: '#ff2e88',
    skyTop: 'rgba(64, 18, 96, 0.55)',
    skyBottom: 'rgba(255, 84, 60, 0.5)',
    washTop: 'rgba(255, 46, 136, 0.20)',
    washBottom: 'rgba(28, 10, 70, 0.34)',
    sunColor: '#ffb057',
    horizon: 'rgba(255, 120, 90, 0.55)',
    palmColor: 'rgba(20, 6, 30, 0.92)',
    vignette: 0.5,
    sat: 1.18,
    contrast: 1.06,
  },
  neon: {
    id: 'neon',
    base: '#0a0f2e',
    accent: '#00e5ff',
    skyTop: 'rgba(8, 16, 60, 0.6)',
    skyBottom: 'rgba(210, 40, 160, 0.4)',
    washTop: 'rgba(0, 229, 255, 0.16)',
    washBottom: 'rgba(40, 8, 90, 0.42)',
    sunColor: '#ff54b0',
    horizon: 'rgba(255, 84, 176, 0.42)',
    palmColor: 'rgba(4, 8, 28, 0.94)',
    vignette: 0.62,
    sat: 1.22,
    contrast: 1.1,
  },
  gold: {
    id: 'gold',
    base: '#2b1508',
    accent: '#ffc043',
    skyTop: 'rgba(120, 60, 10, 0.42)',
    skyBottom: 'rgba(255, 176, 60, 0.5)',
    washTop: 'rgba(255, 200, 90, 0.14)',
    washBottom: 'rgba(70, 26, 6, 0.36)',
    sunColor: '#ffe08a',
    horizon: 'rgba(255, 190, 110, 0.5)',
    palmColor: 'rgba(38, 16, 6, 0.9)',
    vignette: 0.48,
    sat: 1.12,
    contrast: 1.04,
  },
  teal: {
    id: 'teal',
    base: '#07242c',
    accent: '#2de2c5',
    skyTop: 'rgba(10, 68, 88, 0.55)',
    skyBottom: 'rgba(255, 110, 60, 0.42)',
    washTop: 'rgba(24, 190, 200, 0.18)',
    washBottom: 'rgba(255, 110, 60, 0.2)',
    sunColor: '#ffce7a',
    horizon: 'rgba(255, 130, 90, 0.45)',
    palmColor: 'rgba(4, 26, 32, 0.92)',
    vignette: 0.52,
    sat: 1.16,
    contrast: 1.08,
  },
  miami: {
    id: 'miami',
    base: '#26103c',
    accent: '#ff7ad9',
    skyTop: 'rgba(90, 30, 140, 0.5)',
    skyBottom: 'rgba(255, 130, 200, 0.42)',
    washTop: 'rgba(255, 122, 217, 0.16)',
    washBottom: 'rgba(40, 14, 90, 0.4)',
    sunColor: '#ffd0e8',
    horizon: 'rgba(255, 150, 210, 0.5)',
    palmColor: 'rgba(26, 8, 42, 0.92)',
    vignette: 0.55,
    sat: 1.2,
    contrast: 1.06,
  },
};

export function gradeById(id) {
  const g = GRADES[id] ?? GRADES.vice;
  return {
    ...g,
    panelTone(i, count) {
      const warm = i % 2 === 0;
      return {
        filter: `saturate(${g.sat}) contrast(${g.contrast}) ${warm ? 'hue-rotate(-6deg)' : 'hue-rotate(6deg)'}`,
        wash: warm ? g.washTop : g.washBottom,
        under: g.base,
      };
    },
  };
}

/** Atmosphere over the whole cover: sky gradient, sun disc with glow, haze band, palms. */
export function paintAtmosphere(ctx, w, h, grade, opts) {
  const bandTop = opts.bandTop ?? h * 0.76;
  const glow = opts.sun ?? 0.55;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(1, grade.skyBottom);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  if (glow > 0) {
    const cx = w * 0.5;
    const cy = bandTop * 0.62;
    const r = Math.min(w, h) * 0.4;
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    halo.addColorStop(0, hexA(grade.sunColor, 0.34 * glow));
    halo.addColorStop(0.4, hexA(grade.sunColor, 0.14 * glow));
    halo.addColorStop(1, hexA(grade.sunColor, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
    const disc = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.26);
    disc.addColorStop(0, hexA(grade.sunColor, 0.6 * glow));
    disc.addColorStop(0.7, hexA(grade.sunColor, 0.34 * glow));
    disc.addColorStop(1, hexA(grade.sunColor, 0));
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.26, 0, Math.PI * 2);
    ctx.fillStyle = disc;
    ctx.fill();
  }

  const haze = ctx.createLinearGradient(0, bandTop - h * 0.16, 0, h);
  haze.addColorStop(0, hexA(grade.horizon, 0));
  haze.addColorStop(1, grade.washBottom);
  ctx.fillStyle = haze;
  ctx.fillRect(0, bandTop - h * 0.16, w, h * 0.16 + 1);
  ctx.restore();

  if (opts.palms) drawPalms(ctx, w, h, bandTop, grade.palmColor);
}

/** Original palm silhouettes drawn as vectors: drooping fronds off a curved trunk. */
function drawPalms(ctx, w, h, groundY, color) {
  const s = Math.min(w, h);
  const trees = [
    { x: w * 0.055, lean: -0.12, scale: 0.2 },
    { x: w * 0.13, lean: 0.08, scale: 0.14 },
    { x: w * 0.9, lean: 0.14, scale: 0.22 },
    { x: w * 0.965, lean: -0.1, scale: 0.13 },
  ];
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (const t of trees) {
    const base = groundY + s * 0.06;
    const top = base - s * t.scale * 2.1;
    const tip = t.x + s * t.scale * t.lean * 2;
    ctx.lineWidth = s * t.scale * 0.1;
    ctx.beginPath();
    ctx.moveTo(t.x - s * 0.014, base);
    ctx.quadraticCurveTo(t.x - s * 0.006, (base + top) / 2, tip, top);
    ctx.quadraticCurveTo(t.x + s * 0.016, (base + top) / 2, t.x + s * 0.014, base);
    ctx.fill();
    for (let f = 0; f < 7; f++) {
      const ang = -Math.PI * 0.95 + (f * Math.PI * 0.95) / 6;
      const len = s * t.scale * 1.05;
      const mx = tip + Math.cos(ang) * len * 0.55;
      const my = top + Math.sin(ang) * len * 0.3;
      const ex = tip + Math.cos(ang) * len;
      const ey = top + Math.sin(ang) * len * 0.5 + len * 0.32;
      ctx.lineWidth = Math.max(2, s * t.scale * 0.075);
      ctx.beginPath();
      ctx.moveTo(tip, top);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
