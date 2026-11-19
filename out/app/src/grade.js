// Color grades and self-contained canvas painting helpers.

export const GRADES = {
  vice: {
    id: 'vice',
    name: 'Vice',
    sky: ['#1b0b3a', '#8e2a9e', '#ff6b4a'],
    sun: '#ffd76a',
    sea: '#2a0f4d',
    land: '#120726',
    accent: '#ff2e88',
    ink: '#fff4e8',
    dark: '#080318'
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    sky: ['#2b1246', '#e2663f', '#ffc46b'],
    sun: '#fff1a8',
    sea: '#3a1a48',
    land: '#1c0e2c',
    accent: '#ff9f1c',
    ink: '#fff8e7',
    dark: '#0e0618'
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    sky: ['#05021a', '#2b0b52', '#b3128b'],
    sun: '#ff4fd8',
    sea: '#0a0730',
    land: '#070419',
    accent: '#39f5ff',
    ink: '#eafcff',
    dark: '#02010c'
  },
  miami: {
    id: 'miami',
    name: 'Miami',
    sky: ['#0b1b3a', '#5b2a8c', '#ff5f8d'],
    sun: '#ffe08a',
    sea: '#0f3c57',
    land: '#10233b',
    accent: '#ff5fa2',
    ink: '#fff0f5',
    dark: '#050c1f'
  },
  teal: {
    id: 'teal',
    name: 'Teal',
    sky: ['#021a24', '#0a5a68', '#37b6a3'],
    sun: '#b8ffe9',
    sea: '#042a35',
    land: '#02161d',
    accent: '#ff7a3d',
    ink: '#e6fffa',
    dark: '#010c11'
  }
};

// Turn a hex or rgb/a color string into an rgba() string with the given alpha.
// Unknown formats are returned unchanged so callers can fall back to globalAlpha.
function withAlpha(color, alpha) {
  const value = String(color || '').trim();

  if (value.charAt(0) === '#') {
    let hex = value.slice(1);
    if (hex.length === 3) {
      hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
    }
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }
  }

  const parts = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (parts) {
    return 'rgba(' + parts[1] + ', ' + parts[2] + ', ' + parts[3] + ', ' + alpha + ')';
  }

  return value;
}

// Small deterministic PRNG (mulberry32).
function mulberry32(seed) {
  let state = (Number(seed) || 0) >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function paintSky(ctx, w, h, grade) {
  if (!ctx || !(w > 0) || !(h > 0)) return;

  const colors = (grade && grade.sky) || GRADES.vice.sky;
  const sunColor = (grade && grade.sun) || GRADES.vice.sun;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, colors[0] || '#000000');
  sky.addColorStop(0.58, colors[1] || colors[0] || '#000000');
  sky.addColorStop(1, colors[2] || colors[1] || colors[0] || '#000000');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.58;
  const horizon = h * 0.66;
  const radius = Math.min(w, h) * 0.12;
  const glowRadius = radius * 3.2;

  const glow = ctx.createRadialGradient(cx, horizon, radius * 0.15, cx, horizon, glowRadius);
  glow.addColorStop(0, withAlpha(sunColor, 0.6));
  glow.addColorStop(0.38, withAlpha(sunColor, 0.2));
  glow.addColorStop(1, withAlpha(sunColor, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, horizon, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = sunColor;
  ctx.beginPath();
  ctx.arc(cx, horizon, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// One tapered frond: out along a quadratic curve, back along a second one.
function palmFrond(ctx, x, y, ctrlX, ctrlY, tipX, tipY, width) {
  const midX = 0.25 * x + 0.5 * ctrlX + 0.25 * tipX;
  const midY = 0.25 * y + 0.5 * ctrlY + 0.25 * tipY;
  const dx = tipX - x;
  const dy = tipY - y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const offsetX = (-dy / len) * width;
  const offsetY = (dx / len) * width;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
  ctx.quadraticCurveTo(midX + offsetX, midY + offsetY, x, y);
  ctx.closePath();
  ctx.fill();
}

function palmTree(ctx, x, baseY, size, rand, color) {
  const lean = (rand() - 0.5) * size * 0.55;
  const topX = x + lean;
  const topY = baseY - size;
  const trunkW = Math.max(1.1, size * 0.075);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - trunkW, baseY);
  ctx.quadraticCurveTo(x + lean * 0.35 - trunkW * 0.6, baseY - size * 0.55, topX - trunkW * 0.35, topY);
  ctx.lineTo(topX + trunkW * 0.35, topY);
  ctx.quadraticCurveTo(x + lean * 0.65 + trunkW * 0.6, baseY - size * 0.55, x + trunkW, baseY);
  ctx.closePath();
  ctx.fill();

  const fronds = 6 + Math.floor(rand() * 3);
  for (let i = 0; i < fronds; i++) {
    const t = fronds === 1 ? 0.5 : i / (fronds - 1);
    const angle = -Math.PI / 2 + (t - 0.5) * Math.PI * 1.5;
    const length = size * (0.55 + rand() * 0.35);
    const tipX = topX + Math.cos(angle) * length;
    const tipY = topY + Math.sin(angle) * length * 0.7 + size * 0.2;
    const ctrlX = topX + Math.cos(angle) * length * 0.5;
    const ctrlY = topY + Math.sin(angle) * length * 0.35 - size * 0.08;
    palmFrond(ctx, topX, topY, ctrlX, ctrlY, tipX, tipY, size * 0.055);
  }
}

export function drawPalms(ctx, w, h, grade, seed) {
  if (!ctx || !(w > 0) || !(h > 0)) return;

  const color = (grade && grade.dark) || GRADES.vice.dark;
  const rand = mulberry32(seed);
  const trees = 3 + Math.floor(rand() * 3);

  ctx.save();
  for (let i = 0; i < trees; i++) {
    const x = w * (0.08 + rand() * 0.84);
    const baseY = h * (0.96 + rand() * 0.06);
    const size = Math.min(w, h) * (0.1 + rand() * 0.08);
    palmTree(ctx, x, baseY, size, rand, color);
  }
  ctx.restore();
}
